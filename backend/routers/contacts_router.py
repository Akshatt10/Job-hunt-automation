"""
Contacts routes: CSV upload, list/filter, status update.
"""

import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlmodel import Session, select, func, col

from database import get_session
from models import User, Contact
from auth import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "File must be a CSV")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    saved, duplicates, skipped = 0, 0, 0

    for row in reader:
        email = (row.get("Email") or "").strip()
        if not email or email.lower() == "not available":
            skipped += 1
            continue

        # Check for duplicate (same user + same email)
        existing = session.exec(
            select(Contact).where(Contact.user_id == user.id, Contact.email == email)
        ).first()
        if existing:
            duplicates += 1
            continue

        first = (row.get("First Name") or "").strip()
        last = (row.get("Last Name") or "").strip()

        contact = Contact(
            user_id=user.id,
            name=f"{first} {last}".strip() or email.split("@")[0],
            email=email,
            company=row.get("Company Name") or row.get("Company") or "",
            title=row.get("Title") or "",
            linkedin_url=row.get("Person Linkedin Url") or "",
            company_description=row.get("Keywords") or row.get("Industry") or "",
        )
        session.add(contact)
        saved += 1

    session.commit()
    return {
        "message": "CSV processing complete",
        "saved": saved,
        "duplicates_skipped": duplicates,
        "no_email_skipped": skipped,
        "filename": file.filename,
    }


@router.get("")
async def list_contacts(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, le=500),
    offset: int = Query(0),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(Contact).where(Contact.user_id == user.id)
    if status and status != "all":
        query = query.where(Contact.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (col(Contact.name).ilike(search_term)) |
            (col(Contact.email).ilike(search_term)) |
            (col(Contact.company).ilike(search_term))
        )
    query = query.order_by(Contact.created_at.desc()).offset(offset).limit(limit)
    contacts = session.exec(query).all()
    return [c.model_dump() for c in contacts]


@router.get("/count")
async def count_contacts(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    total = session.exec(
        select(func.count(Contact.id)).where(Contact.user_id == user.id)
    ).one()

    # Status breakdown
    breakdown = {}
    for s in ["pending", "sent", "failed"]:
        count = session.exec(
            select(func.count(Contact.id)).where(
                Contact.user_id == user.id, Contact.status == s
            )
        ).one()
        breakdown[s] = count

    return {"total": total, "breakdown": breakdown}


@router.patch("/{contact_id}/status")
async def update_contact_status(
    contact_id: int,
    status: str = Query(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    contact = session.get(Contact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(404, "Contact not found")

    contact.status = status
    if status == "sent":
        from datetime import datetime, timezone
        contact.sent_at = datetime.now(timezone.utc)
    session.add(contact)
    session.commit()
    return {"updated": True, "id": contact_id, "status": status}


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    contact = session.get(Contact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(404, "Contact not found")
    session.delete(contact)
    session.commit()
    return {"deleted": True, "id": contact_id}


@router.post("/retry-failed")
async def retry_failed(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    failed = session.exec(
        select(Contact).where(Contact.user_id == user.id, Contact.status == "failed")
    ).all()
    for c in failed:
        c.status = "pending"
        session.add(c)
    session.commit()
    return {"retried": len(failed)}
