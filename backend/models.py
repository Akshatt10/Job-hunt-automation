"""
Database models — all tables for multi-user ColdReach.
"""

from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    hashed_password: Optional[str] = None  # Null for Google-only users
    google_id: Optional[str] = Field(default=None, index=True)
    avatar_url: Optional[str] = None
    onboarded: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    subscription_tier: str = Field(default="free")  # free | pro | elite
    emails_sent_this_month: int = Field(default=0)


class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True, foreign_key="user.id")
    title: str = ""
    years_of_experience: int = 0
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    skills: str = "[]"  # JSON array string
    bio: str = ""
    notable_projects: str = "[]"  # JSON array of {name, description}
    target_roles: str = "[]"  # JSON array
    interests: str = "[]"  # JSON array
    # Communication style
    tone: str = "direct"
    focus_areas: str = ""
    highlight_project: str = ""
    avoid_phrases: str = "[]"  # JSON array
    emphasize: str = "[]"  # JSON array
    # Resume
    resume_filename: Optional[str] = None


class SmtpConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True, foreign_key="user.id")
    host: str = "smtp.gmail.com"
    port: int = 587
    username: str = ""
    password: str = ""  # Encrypted in production
    verified: bool = False


class Contact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    name: str
    email: str
    company: Optional[str] = None
    title: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_description: Optional[str] = None
    status: str = Field(default="pending", index=True)  # pending | sent | failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sent_at: Optional[datetime] = None


class Campaign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    name: str
    daily_limit: int = 50
    dry_run: bool = True
    contact_filter: str = "pending"  # pending | failed
    status: str = "created"  # created | running | paused | completed
    total_contacts: int = 0
    sent_count: int = 0
    failed_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class EmailLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    campaign_id: int = Field(index=True, foreign_key="campaign.id")
    contact_id: int = Field(foreign_key="contact.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    to_email: str
    subject: str
    body: str
    status: str = "sent"  # sent | failed | dry_run
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
