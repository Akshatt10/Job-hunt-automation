"""
Profile routes: get/update profile, upload resume.
"""

import json
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import User, Profile
from auth import get_current_user
from config import UPLOAD_DIR

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    title: Optional[str] = None
    years_of_experience: Optional[int] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    skills: Optional[list[str]] = None
    bio: Optional[str] = None
    notable_projects: Optional[list[dict]] = None
    target_roles: Optional[list[str]] = None
    interests: Optional[list[str]] = None
    tone: Optional[str] = None
    focus_areas: Optional[str] = None
    highlight_project: Optional[str] = None
    avoid_phrases: Optional[list[str]] = None
    emphasize: Optional[list[str]] = None


def profile_to_dict(profile: Profile, user: User) -> dict:
    return {
        "name": user.name,
        "title": profile.title,
        "years_of_experience": profile.years_of_experience,
        "location": profile.location,
        "linkedin": profile.linkedin,
        "github": profile.github,
        "portfolio": profile.portfolio,
        "skills": json.loads(profile.skills) if profile.skills else [],
        "bio": profile.bio,
        "notable_projects": json.loads(profile.notable_projects) if profile.notable_projects else [],
        "target_roles": json.loads(profile.target_roles) if profile.target_roles else [],
        "interests": json.loads(profile.interests) if profile.interests else [],
        "tone": profile.tone,
        "focus_areas": profile.focus_areas,
        "highlight_project": profile.highlight_project,
        "avoid_phrases": json.loads(profile.avoid_phrases) if profile.avoid_phrases else [],
        "emphasize": json.loads(profile.emphasize) if profile.emphasize else [],
        "resume_filename": profile.resume_filename,
    }


@router.get("")
async def get_profile(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if not profile:
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile_to_dict(profile, user)


@router.put("")
async def update_profile(
    data: ProfileUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if not profile:
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(profile)

    # Update fields
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        if isinstance(value, (list, dict)):
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)

    # Mark user as onboarded
    if not user.onboarded:
        user.onboarded = True
        session.add(user)

    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile_to_dict(profile, user)


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    # Save to uploads/user_{id}/resume.pdf
    user_dir = UPLOAD_DIR / f"user_{user.id}"
    user_dir.mkdir(parents=True, exist_ok=True)
    dest = user_dir / "resume.pdf"

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Update profile
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if profile:
        profile.resume_filename = file.filename
        session.add(profile)
        session.commit()

    return {"filename": file.filename, "message": "Resume uploaded successfully"}
