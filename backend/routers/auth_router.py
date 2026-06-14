"""
Auth routes: register, login, Google SSO, /me endpoint.
"""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from database import get_session
from models import User, Profile
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, verify_google_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str]
    onboarded: bool
    subscription_tier: str
    emails_sent_this_month: int


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "onboarded": user.onboarded,
        "subscription_tier": user.subscription_tier,
        "emails_sent_this_month": user.emails_sent_this_month,
    }


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, session: Session = Depends(get_session)):
    # Check if email exists
    existing = session.exec(select(User).where(User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = User(
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create empty profile
    profile = Profile(user_id=user.id)
    session.add(profile)
    session.commit()

    token = create_access_token(user.id)
    return {"token": token, "user": user_to_dict(user)}


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return {"token": token, "user": user_to_dict(user)}


@router.post("/google", response_model=AuthResponse)
async def google_auth(req: GoogleAuthRequest, session: Session = Depends(get_session)):
    """Handle Google Sign-In: create or login user."""
    google_data = await verify_google_token(req.credential)

    # Check if user exists by Google ID or email
    user = session.exec(
        select(User).where(
            (User.google_id == google_data["google_id"]) | (User.email == google_data["email"])
        )
    ).first()

    if user:
        # Update Google info if needed
        if not user.google_id:
            user.google_id = google_data["google_id"]
        if google_data.get("picture"):
            user.avatar_url = google_data["picture"]
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        # Create new user from Google
        user = User(
            name=google_data["name"],
            email=google_data["email"],
            google_id=google_data["google_id"],
            avatar_url=google_data.get("picture"),
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Create empty profile
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()

    token = create_access_token(user.id)
    return {"token": token, "user": user_to_dict(user)}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user_to_dict(user)
