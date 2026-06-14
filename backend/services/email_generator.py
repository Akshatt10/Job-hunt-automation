"""
Email generation service — ported from email_generator/generator.py
Uses user's profile from DB instead of config.yaml.
"""

import os
import json
import logging
from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from models import Profile, User

logger = logging.getLogger(__name__)


class EmailOutput(BaseModel):
    subject: str = Field(description="Email subject line")
    body: str = Field(description="Email body (100-130 words)")


FALLBACK_TEMPLATE = {
    "subject": "Backend + AI systems experience — relevant to {company}",
    "body": (
        "Hi {name},\n\n"
        "I've been building production backend systems and AI-powered pipelines "
        "— the kind of work that maps directly to what {company} is doing.\n\n"
        "I've attached my resume with specifics on what I've shipped. "
        "Would a 15-minute call make sense to see if there's a fit?"
    ),
}

SYSTEM_PROMPT = """You are a sharp, direct email copywriter helping a developer land interviews.
Your emails get replies because they feel human, specific, and brief.

VOICE: Confident without being arrogant. Senior engineer tone.
Candidate identity: BUILDER who ships.

STRUCTURE (follow exactly):
1. Opening (1 sentence) — Genuine observation about the company. No filler.
2. Value bridge (2-3 sentences) — Relevant projects and focus areas.
   CRITICAL: Focus ONLY on {comm_focus_areas} and {comm_highlight_project}.
3. The ask (1 sentence) — Soft CTA for 15-minute call.
4. Resume mention (1 sentence) — Woven in naturally.

HARD RULES:
- Body: 100-130 words.
- Zero clichés: passionate, go-getter, perfect fit, excited to.
- No filler openers: "I hope this finds you well", "My name is".
- Subject line: Curiosity or specific value prop.
- No sign-off/closing name.

OUTPUT: valid JSON only.
{{
  "subject": "...",
  "body": "..."
}}"""

USER_PROMPT_TEMPLATE = """Write a cold outreach email for a job application.

COMPANY:
- Company: {company}
- What they do: {company_description}
- Contact: {contact_name}, {contact_title}

CANDIDATE:
- Name: {my_name}
- Role: {my_title}
- Experience: {my_experience} year(s)
- Skills: {my_skills}
- Bio: {my_bio}
- Projects: {my_projects}

IDENTITY:
- Tone: {comm_tone}
- Emphasize: {comm_emphasize}
- Avoid: {comm_avoid}
- Focus focal points: {comm_focus_areas}, {comm_highlight_project}.

Now write the email. JSON only."""


def get_all_llms():
    """Returns prioritized list of LLM providers: Gemini -> OpenAI."""
    llms = []
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llms.append(("Gemini 2.5 Flash", ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0.6,
                google_api_key=gemini_key,
            )))
        except ImportError:
            logger.warning("langchain-google-genai not installed, skipping Gemini")

    if openai_key:
        try:
            from langchain_openai import ChatOpenAI
            llms.append(("OpenAI GPT-4o-mini", ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.75,
                api_key=openai_key,
            )))
        except ImportError:
            logger.warning("langchain-openai not installed, skipping OpenAI")

    return llms


def build_chain(llm):
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT_TEMPLATE),
    ])
    parser = JsonOutputParser(pydantic_object=EmailOutput)
    return prompt | llm | parser


def profile_to_prompt_vars(profile: Profile, user: User) -> dict:
    """Convert DB profile to the prompt variables dict."""
    projects_list = json.loads(profile.notable_projects) if profile.notable_projects else []
    formatted_projects = "\n".join([
        f"- {p.get('name', 'Project')}: {p.get('description', '').strip()}"
        for p in projects_list
    ]) if projects_list else "No projects listed."

    avoid_phrases = json.loads(profile.avoid_phrases) if profile.avoid_phrases else []
    emphasize = json.loads(profile.emphasize) if profile.emphasize else ["impact", "things shipped"]
    skills = json.loads(profile.skills) if profile.skills else ["Python"]

    return {
        "my_name": user.name,
        "my_title": profile.title or "Software Developer",
        "my_experience": profile.years_of_experience or 1,
        "my_skills": ", ".join(skills),
        "my_bio": profile.bio or "",
        "my_projects": formatted_projects,
        "comm_tone": profile.tone or "direct and confident",
        "comm_emphasize": ", ".join(emphasize),
        "comm_avoid": ", ".join(avoid_phrases),
        "comm_focus_areas": profile.focus_areas or "relevant technical experience",
        "comm_highlight_project": profile.highlight_project or "a core technical project",
        "comm_avoid_projects": "irrelevant or basic projects",
    }


async def generate_email(
    contact: dict,
    profile: Profile,
    user: User,
) -> dict:
    """Generate personalized email using fallback LLM chain (Gemini -> OpenAI -> fallback)."""
    prompt_vars = profile_to_prompt_vars(profile, user)
    prompt_vars.update({
        "contact_name": contact.get("name", "Hiring Manager"),
        "contact_title": contact.get("title", "Recruiter"),
        "company": contact.get("company", "your company"),
        "company_description": contact.get("company_description", "a technology company"),
    })

    all_llms = get_all_llms()
    last_error = None

    for llm_name, llm in all_llms:
        try:
            logger.info("Trying %s for %s at %s", llm_name, contact.get("name"), contact.get("company"))
            chain = build_chain(llm)
            result = await chain.ainvoke(prompt_vars)

            if not isinstance(result, dict) or "subject" not in result or "body" not in result:
                raise ValueError("Unexpected LLM format")

            # Add sign-off
            sign_off = f"\n\nBest regards,\n{user.name}"
            if profile.github:
                sign_off += f"\nGitHub: {profile.github}"
            if profile.linkedin:
                sign_off += f"\nLinkedIn: {profile.linkedin}"
            result["body"] = result["body"].rstrip() + sign_off

            logger.info("✅ Generated for %s at %s", contact.get("name"), contact.get("company"))
            return result
        except Exception as e:
            last_error = e
            logger.warning("❌ [%s] Failed: %s", llm_name, str(e)[:100])
            continue

    # All LLMs failed — use fallback template
    logger.error("All LLMs failed. Using fallback template.")
    return {
        "subject": FALLBACK_TEMPLATE["subject"].format(company=contact.get("company", "Company")),
        "body": FALLBACK_TEMPLATE["body"].format(
            name=contact.get("name", "Hiring Manager"),
            company=contact.get("company", "company"),
        ) + f"\n\nBest regards,\n{user.name}",
    }
