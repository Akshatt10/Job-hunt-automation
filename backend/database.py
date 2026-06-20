"""
Database setup with SQLModel (SQLite for dev, PostgreSQL for prod).
"""

import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

from config import DATABASE_URL

# Ensure data directory exists for SQLite
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300
)


def init_db():
    """Create all tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency that yields a DB session."""
    with Session(engine) as session:
        yield session
