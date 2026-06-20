"""
Email sending service — ported from email_sender/sender.py
Uses user's SMTP config from DB instead of env vars.
"""

import logging
import smtplib
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header

from models import SmtpConfig
from config import UPLOAD_DIR

logger = logging.getLogger(__name__)


def attach_resume(msg: MIMEMultipart, resume_path: Path) -> bool:
    if not resume_path.exists():
        logger.warning("Resume not found at %s", resume_path)
        return False
    try:
        with open(resume_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{resume_path.name}"')
        msg.attach(part)
        return True
    except Exception as e:
        logger.error("Failed to attach resume: %s", e)
        return False


def send_email(
    smtp_config: SmtpConfig,
    to_email: str,
    subject: str,
    body: str,
    user_id: int,
    dry_run: bool = True,
) -> dict:
    """Send a single email. Returns status dict."""

    resume_path = UPLOAD_DIR / f"user_{user_id}" / "resume.pdf"

    # Build MIME message
    email_msg = MIMEMultipart()
    email_msg["From"] = smtp_config.username
    email_msg["To"] = to_email
    email_msg["Subject"] = Header(subject, "utf-8")
    email_msg.attach(MIMEText(body, "plain", "utf-8"))

    if resume_path.exists():
        attach_resume(email_msg, resume_path)

    if dry_run:
        logger.info("[DRY RUN] To: %s | Subject: %s", to_email, subject)
        return {"success": True, "message": f"[DRY RUN] Logged for {to_email}", "dry_run": True}

    if not smtp_config.username or not smtp_config.password:
        return {"success": False, "message": "SMTP credentials not configured", "dry_run": False}

    try:
        with smtplib.SMTP(smtp_config.host, smtp_config.port, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_config.username, smtp_config.password)
            server.send_message(email_msg)

        logger.info("[SENT] %s", to_email)
        return {"success": True, "message": f"Sent to {to_email}", "dry_run": False}
    except smtplib.SMTPAuthenticationError:
        return {"success": False, "message": "SMTP authentication failed", "dry_run": False}
    except Exception as e:
        logger.error("Email failed: %s", e)
        return {"success": False, "message": str(e), "dry_run": False}
