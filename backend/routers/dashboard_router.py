"""
Dashboard stats endpoint.
"""

from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from database import get_session
from models import User, Contact, Campaign, EmailLog
from auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def dashboard_stats(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Contact breakdown
    total_contacts = session.exec(
        select(func.count(Contact.id)).where(Contact.user_id == user.id)
    ).one()
    pending = session.exec(
        select(func.count(Contact.id)).where(Contact.user_id == user.id, Contact.status == "pending")
    ).one()
    sent = session.exec(
        select(func.count(Contact.id)).where(Contact.user_id == user.id, Contact.status == "sent")
    ).one()
    failed = session.exec(
        select(func.count(Contact.id)).where(Contact.user_id == user.id, Contact.status == "failed")
    ).one()

    # Today's send count
    today = date.today().isoformat()
    sent_today = session.exec(
        select(func.count(EmailLog.id)).where(
            EmailLog.user_id == user.id,
            EmailLog.status == "sent",
            EmailLog.created_at >= today,
        )
    ).one()

    # Recent campaigns
    recent_campaigns = session.exec(
        select(Campaign)
        .where(Campaign.user_id == user.id)
        .order_by(Campaign.created_at.desc())
        .limit(5)
    ).all()

    # Recent activity (last 10 email logs)
    recent = session.exec(
        select(EmailLog)
        .where(EmailLog.user_id == user.id)
        .order_by(EmailLog.created_at.desc())
        .limit(10)
    ).all()

    return {
        "contacts": {
            "total": total_contacts,
            "pending": pending,
            "sent": sent,
            "failed": failed,
        },
        "today": {
            "sent": sent_today,
            "daily_limit": 50,
        },
        "recent_campaigns": [c.model_dump() for c in recent_campaigns],
        "recent_activity": [
            {
                "id": r.id,
                "to_email": r.to_email,
                "subject": r.subject,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "body": r.body[:200] if r.body else "",
            }
            for r in recent
        ],
    }
