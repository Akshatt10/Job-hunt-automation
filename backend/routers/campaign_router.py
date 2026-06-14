"""
Campaign routes: create, run (with SSE progress), list history.
Uses Server-Sent Events (SSE) for real-time progress streaming.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session, select, func

from database import get_session
from models import User, Contact, Campaign, EmailLog, Profile, SmtpConfig
from auth import get_current_user
from services.email_generator import generate_email
from services.email_sender import send_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/campaigns", tags=["campaigns"])

def get_tier_limit(tier: str) -> int:
    if tier == "pro": return 1000
    return 50  # free



class CampaignCreate(BaseModel):
    name: str = "New Campaign"
    daily_limit: int = 50
    dry_run: bool = True
    contact_filter: str = "pending"  # pending | failed


@router.post("")
async def create_campaign(
    data: CampaignCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Count contacts matching filter
    query = select(func.count(Contact.id)).where(
        Contact.user_id == user.id,
        Contact.status == data.contact_filter,
    )
    total = session.exec(query).one()
    print(f"DEBUG: user={user.id}, filter={data.contact_filter}, total={total}")

    if total == 0:
        raise HTTPException(400, f"No contacts with status '{data.contact_filter}' found")

    actual_total = min(total, data.daily_limit)

    campaign = Campaign(
        user_id=user.id,
        name=data.name,
        daily_limit=data.daily_limit,
        dry_run=data.dry_run,
        contact_filter=data.contact_filter,
        total_contacts=actual_total,
        status="created",
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign.model_dump()


@router.get("/{campaign_id}/run")
async def run_campaign(
    campaign_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Run a campaign with Server-Sent Events (SSE) streaming progress back to the frontend."""
    campaign = session.get(Campaign, campaign_id)
    if not campaign or campaign.user_id != user.id:
        raise HTTPException(404, "Campaign not found")
    if campaign.status == "completed":
        raise HTTPException(400, "Campaign already completed")

    # Load user profile and SMTP config
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    smtp_config = session.exec(select(SmtpConfig).where(SmtpConfig.user_id == user.id)).first()

    if not profile:
        raise HTTPException(400, "Please set up your profile first")
    if not campaign.dry_run and (not smtp_config or not smtp_config.verified):
        raise HTTPException(400, "SMTP not configured. Enable dry-run or set up email first.")

    # Get contacts
    contacts = session.exec(
        select(Contact)
        .where(Contact.user_id == user.id, Contact.status == campaign.contact_filter)
        .limit(campaign.daily_limit)
    ).all()

    campaign.status = "running"
    campaign.started_at = datetime.now(timezone.utc)
    campaign.total_contacts = len(contacts)
    session.add(campaign)
    session.commit()

    # Extract IDs into plain variables so the generator doesn't try to lazy-load the detached ORM objects
    u_id = user.id
    c_id = campaign.id

    async def event_stream():
        from database import engine
        sent = 0
        failed = 0

        with Session(engine) as s:
            # Re-fetch models in the generator's active session to prevent DetachedInstanceErrors
            active_user = s.get(User, u_id)
            active_profile = s.exec(select(Profile).where(Profile.user_id == u_id)).first()
            active_smtp = s.exec(select(SmtpConfig).where(SmtpConfig.user_id == u_id)).first()
            active_campaign = s.get(Campaign, c_id)
            
            # Fetch specifically the contacts we grabbed earlier based on the offset limits
            active_contacts = s.exec(
                select(Contact)
                .where(Contact.user_id == u_id, Contact.status == active_campaign.contact_filter)
                .limit(active_campaign.daily_limit)
            ).all()

            for i, contact in enumerate(active_contacts):
                if not active_campaign.dry_run:
                    limit = get_tier_limit(active_user.subscription_tier)
                    if active_user.emails_sent_this_month >= limit:
                        # Stream error and abort
                        event = {
                            "index": i + 1,
                            "total": len(active_contacts),
                            "contact": contact.name,
                            "company": contact.company or "",
                            "email": contact.email,
                            "subject": "",
                            "status": "error",
                            "message": f"Monthly limit of {limit} reached. Please upgrade.",
                            "dry_run": False,
                            "sent": sent,
                            "failed": failed + 1,
                        }
                        yield f"data: {json.dumps(event)}\n\n"
                        failed += 1
                        break
                        
                try:
                    # Generate email
                    contact_dict = {
                        "name": contact.name,
                        "title": contact.title or "Recruiter",
                        "company": contact.company or "Company",
                        "company_description": contact.company_description or "",
                    }
                    email_result = await generate_email(contact_dict, active_profile, active_user)

                    # Send email
                    dry_run = active_campaign.dry_run
                    if not dry_run and active_smtp:
                        send_result = send_email(
                            active_smtp, contact.email,
                            email_result["subject"], email_result["body"],
                            active_user.id, dry_run=False,
                        )
                    else:
                        send_result = {"success": True, "dry_run": True, "message": f"[DRY RUN] {contact.email}"}

                    # Log to DB
                    status = "dry_run" if dry_run else ("sent" if send_result["success"] else "failed")
                    log_entry = EmailLog(
                        campaign_id=active_campaign.id,
                        contact_id=contact.id,
                        user_id=active_user.id,
                        to_email=contact.email,
                        subject=email_result["subject"],
                        body=email_result["body"],
                        status=status,
                        error_message=None if send_result["success"] else send_result.get("message"),
                    )
                    s.add(log_entry)

                    # Update contact status
                    if not dry_run:
                        contact.status = "sent" if send_result["success"] else "failed"
                        if send_result["success"]:
                            contact.sent_at = datetime.now(timezone.utc)
                        s.add(contact)
                    
                    s.commit()

                    if send_result["success"]:
                        sent += 1
                        if not dry_run:
                            active_user.emails_sent_this_month += 1
                            s.add(active_user)
                    else:
                        failed += 1

                    # Stream progress event
                    event = {
                        "index": i + 1,
                        "total": len(active_contacts),
                        "contact": contact.name,
                        "company": contact.company or "",
                        "email": contact.email,
                        "subject": email_result["subject"],
                        "status": "success" if send_result["success"] else "error",
                        "message": send_result.get("message", ""),
                        "dry_run": dry_run,
                        "sent": sent,
                        "failed": failed,
                    }
                    yield f"data: {json.dumps(event)}\n\n"

                    # Rate limiting pause between emails
                    await asyncio.sleep(2)

                except Exception as e:
                    failed += 1
                    logger.error("Campaign error for %s: %s", contact.email, e)
                    event = {
                        "index": i + 1,
                        "total": len(active_contacts),
                        "contact": contact.name,
                        "company": contact.company or "",
                        "email": contact.email,
                        "subject": "",
                        "status": "error",
                        "message": str(e),
                        "dry_run": active_campaign.dry_run,
                        "sent": sent,
                        "failed": failed,
                    }
                    yield f"data: {json.dumps(event)}\n\n"

            # Mark campaign complete
            active_campaign.status = "completed"
            active_campaign.sent_count = sent
            active_campaign.failed_count = failed
            active_campaign.completed_at = datetime.now(timezone.utc)
            s.add(active_campaign)
            s.commit()

        # Final event
        yield f"data: {json.dumps({'done': True, 'sent': sent, 'failed': failed})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("")
async def list_campaigns(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    campaigns = session.exec(
        select(Campaign)
        .where(Campaign.user_id == user.id)
        .order_by(Campaign.created_at.desc())
    ).all()
    return [c.model_dump() for c in campaigns]


@router.get("/{campaign_id}/emails")
async def campaign_emails(
    campaign_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all generated emails for a campaign (preview)."""
    logs = session.exec(
        select(EmailLog)
        .where(EmailLog.campaign_id == campaign_id, EmailLog.user_id == user.id)
        .order_by(EmailLog.created_at.desc())
    ).all()
    return [l.model_dump() for l in logs]
