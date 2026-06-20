# 🚀 NoFluffMail: Anti-Cliché AI Cold Email Automation

**NoFluffMail** is an end-to-end automated cold email platform for job hunting, networking, and outreach. Unlike generic AI wrappers, it generates hyper-personalized, "no-fluff" emails based on your unique career profile and the specific details of your target leads.

```text
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Upload CSV     │────▶│ FastAPI      │────▶│ LangChain    │────▶│ Email Sender │
│ (Apollo Leads)  │     │ Backend DB   │     │ (AI Gen)     │     │ (SMTP/Gmail) │
└─────────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
         ▲                                                               │
         │                      ┌──────────────┐                         │
         └──────────────────────│ React Web UI │◀────────────────────────┘
                                └──────────────┘
```

---

## 📋 Features

- **Web Dashboard**: A beautiful, minimalist React UI to manage your outreach.
- **AI Personalization**: Uses advanced LLMs (Gemini / OpenAI fallback) to draft emails that sound like a real human wrote them.
- **CSV Ingestion**: Upload lists straight from Apollo.io. The backend automatically extracts columns and dedupers contacts.
- **Smart SMTP**: Connects directly to your Gmail. Features built-in rate-limiting and delay randomization to protect your email reputation.
- **Subscription Management**: Integrated Razorpay checkout for Pro tiers.

---

## ⚡ Quick Start

### 1. Clone & Configure Environment

```bash
git clone <your-repo-url> no-fluff-mail
cd "job automation"
```

You'll need two terminals open—one for the backend, one for the frontend.

### 2. Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
# AI Keys
GEMINI_API_KEY=your_gemini_key_here
# OPENAI_API_KEY=optional_fallback_key

# Payment Keys
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=placeholder_secret

# Security
JWT_SECRET_KEY=generate_a_random_secure_string
```

Run the backend:
```bash
uvicorn main:app --reload
```
The API is now running at `http://localhost:8000`.

### 3. Frontend Setup (React/Vite)

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The Web UI is now running at `http://localhost:5173`.

---

## 🛠️ Usage

1. **Register**: Open the web app and create an account.
2. **Onboarding**: Complete the multi-step wizard. Here, you'll set your target role, input your bio, and save your Gmail App Password.
3. **Upload Leads**: Go to the Dashboard and upload an Apollo.io CSV.
4. **Launch**: Review your pending contacts and click start. The system will process each lead, draft the email, and send it through your connected inbox.

---

## 🔧 Architecture & Privacy

- **Strictly Separated**: Your data (profiles, contacts, logs) is securely stored in a local SQLite database (`coldreach.db`) isolated per user via JWT authentication.
- **No n8n or Docker required**: We refactored the original microservice/n8n architecture into a cohesive, monolithic FastAPI REST service for faster execution and a much better User Experience.

Happy Hunting!
