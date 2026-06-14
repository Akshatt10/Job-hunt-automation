"""
SMTP settings routes: save config, test connection.
"""

import smtplib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import User, SmtpConfig
from auth import get_current_user

router = APIRouter(prefix="/smtp", tags=["smtp"])


class SmtpUpdate(BaseModel):
    host: str = "smtp.gmail.com"
    port: int = 587
    username: str = ""
    password: str = ""


@router.get("")
async def get_smtp(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    config = session.exec(select(SmtpConfig).where(SmtpConfig.user_id == user.id)).first()
    if not config:
        return {"host": "smtp.gmail.com", "port": 587, "username": "", "verified": False}
    return {
        "host": config.host,
        "port": config.port,
        "username": config.username,
        "password_set": bool(config.password),
        "verified": config.verified,
    }


@router.put("")
async def save_smtp(
    data: SmtpUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    config = session.exec(select(SmtpConfig).where(SmtpConfig.user_id == user.id)).first()
    if not config:
        config = SmtpConfig(user_id=user.id)

    config.host = data.host
    config.port = data.port
    config.username = data.username
    if data.password:
        config.password = data.password
    config.verified = False  # Reset until tested
    session.add(config)
    session.commit()
    return {"message": "SMTP settings saved", "verified": False}


@router.post("/test")
async def test_smtp(
    data: SmtpUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Test SMTP connection in real-time. Returns specific error messages."""
    if not data.username:
        raise HTTPException(400, detail="Email address is required")
    if not data.password:
        raise HTTPException(400, detail="App password is required")
    if " " in data.password:
        raise HTTPException(400, detail="Password contains spaces! Remove all spaces from your Google App Password and try again.")
    if data.host == "smtp.gmail.com" and len(data.password) < 16:
        raise HTTPException(400, detail="Gmail App Passwords are exactly 16 characters. Check that you copied the full password.")

    try:
        with smtplib.SMTP(data.host, data.port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(data.username, data.password)

        # Save verified config
        config = session.exec(select(SmtpConfig).where(SmtpConfig.user_id == user.id)).first()
        if not config:
            config = SmtpConfig(user_id=user.id)
        config.host = data.host
        config.port = data.port
        config.username = data.username
        config.password = data.password
        config.verified = True
        session.add(config)
        session.commit()

        return {"success": True, "message": f"Connected! Emails will be sent from {data.username}"}

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(400, detail="Authentication failed. Make sure you're using a Gmail App Password (not your regular password). Also check that 2-Factor Authentication is enabled.")
    except smtplib.SMTPConnectError:
        raise HTTPException(400, detail=f"Could not connect to {data.host}:{data.port}. Check that the host and port are correct.")
    except TimeoutError:
        raise HTTPException(400, detail="Connection timed out. Port 587 might be blocked. Try port 465 with SSL.")
    except Exception as e:
        raise HTTPException(400, detail=f"Connection failed: {str(e)}")
