# TECHNICAL SPECIFICATION: NoFluffMail

This document provides a deep-dive into the architecture, design decisions, and implementation details of the NoFluffMail platform. It is intended for developers and engineers who want to understand, maintain, or scale this codebase.

---

## 1. System Design Philosophy

The core of this project is built on a **Modern Full-Stack Architecture** utilizing React for the frontend and FastAPI for the backend. 

*Note: In previous versions, this project relied on n8n and Docker Compose microservices. We have since refactored into a monolithic API structure to provide a seamless Web UI and significantly reduce operational complexity for the end user.*

### Why React + FastAPI?
- **Speed**: FastAPI provides incredible performance with asynchronous Python, making it perfect for handling LLM network calls and database I/O concurrently.
- **State Management**: React allows us to build complex, multi-step onboarding wizards and real-time campaign dashboards.
- **Authentication**: A monolithic API allows for secure, stateful JWT session management compared to headless cron jobs.

---

## 2. Backend Deep-Dive (FastAPI)

### 2.1 Database & ORM
- **Storage**: Uses **SQLite** (`coldreach.db`) managed via **SQLModel** (a wrapper around SQLAlchemy and Pydantic). 
- **Core Models**:
  - `User`: Handles authentication (bcrypt password hashing) and subscription tiers (`free` vs `pro`).
  - `Profile`: Belongs to a User. Stores their career context (skills, bio, target role) and SMTP credentials securely.
  - `Contact`: Belongs to a User. Stores the target leads (email, company, name). Deduplication is enforced at the database level by uniquely compounding `(user_id, email)`.

### 2.2 The AI Generation Engine
- **Framework**: **LangChain**.
- **Model Routing**: Uses Gemini Pro as the primary generative model. If configured in the `.env`, it can easily fall back to OpenAI.
- **Prompt Architecture**: 
  - The System Prompt strictly enforces the "No Fluff" persona—avoiding standard cliches ("I hope this email finds you well").
  - The Context Injection merges the `User.Profile` data with the specific `Contact` data, feeding a dense prompt to the LLM.
- **Output Parsing**: The LLM output is strictly parsed via Pydantic/Langchain JsonParsers to guarantee `subject` and `body` keys.

### 2.3 Payments (Razorpay)
- **Integration**: Found in `routers/payments.py`.
- **Flow**:
  1. Frontend requests an `order_id` for a specific amount.
  2. Backend securely creates the order via the `razorpay` Python SDK.
  3. Frontend opens the Razorpay native UI.
  4. Upon success, frontend posts the cryptographic signature to `/verify`. The backend validates the SHA256 HMAC before upgrading the `User.subscription_tier`.

---

## 3. Frontend Deep-Dive (React / Vite)

### 3.1 Authentication Strategy
- **ApiClient (`src/api/client.js`)**: A custom fetch wrapper that automatically attaches the JWT token to the `Authorization` header.
- **Silent Refresh**: It intercepts `401 Unauthorized` responses, calls the `/auth/refresh` endpoint using HttpOnly cookies (if configured) or a refresh token, updates the state, and seamlessly replays the failed request.

### 3.2 Key Components
- **Onboarding Wizard**: A state machine that guides users from Account Creation → Profile Setup → SMTP Connection.
- **Campaign Dashboard**: Polling logic that fetches `pending`, `sent`, and `failed` contacts, giving the user a visual breakdown of their outreach funnel.

---

## 4. Privacy & Data Flow

1. **Air-Gapped Credentials**: Users provide their own SMTP app passwords. The application authenticates natively with Gmail via `smtplib`, meaning we don't need OAuth verification or broad Google Workspace access.
2. **Rate Limiting**: To protect users' Gmail reputation, the system enforces a strict `daily_limit` counter attached to their User model, ensuring they do not exceed typical consumer ISP caps.

---

## 5. Scaling for the Future

**How to move from SQLite to PostgreSQL?**
Because we use `SQLModel` and `SQLAlchemy`, migrating to Postgres is as simple as:
1. Changing the `DATABASE_URL` in `.env` to a Postgres connection string.
2. Updating `database.py` from `sqlite:///coldreach.db` to use `psycopg2`.
3. Running migrations (if alembic is configured). This allows us to scale horizontally behind a load balancer.
