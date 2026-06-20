# 📖 USER GUIDE: NoFluffMail

Welcome to NoFluffMail! This guide will walk you through exactly how to set up your account, connect your email, and launch your first AI-powered outreach campaign directly from your browser.

---

## 🏗️ 1. First-Time Setup (The Onboarding Wizard)

When you first launch the application and register an account, you will be greeted by the Onboarding Wizard. This only takes 2 minutes and tells the AI everything it needs to know to write your emails.

### Step 1: Your Profile
Fill out your name, your target role (e.g., "Senior Frontend Engineer"), and paste a short bio.
*Pro Tip: Treat the Bio section like a prompt. If you want the AI to emphasize your Next.js experience, write "I have 5 years of Next.js experience" in the bio.*

### Step 2: Email Connection (Gmail)
NoFluffMail sends emails directly from your Gmail account so they look authentic.

> [!IMPORTANT]
> **Gmail App Passwords**: Because of Google's security, you cannot use your normal Gmail password. 
> 1. Go to your [Google Account Security settings](https://myaccount.google.com/security).
> 2. Turn on 2-Step Verification.
> 3. Search for "App Passwords" and create a new one called "NoFluffMail".
> 4. Google will give you a 16-letter password (`xxxx xxxx xxxx xxxx`). 
> 5. **CRITICAL**: Remove all the spaces before pasting it into NoFluffMail! (e.g., `xxxxxxxxxxxxxxxx`).

Once you click "Verify," the system will send a test ping to ensure the connection works.

---

## 🏃 2. Launching a Campaign

Once your profile is set, you'll be dropped into the Dashboard.

### Step 1: Export Leads from Apollo
1. Go to [Apollo.io Search](https://app.apollo.io/#/people).
2. Filter your target audience (e.g., "Engineering Managers in London").
3. Ensure their email status is "Verified".
4. Export the list to a **CSV** file.

### Step 2: Upload
On the NoFluffMail Dashboard, click **Import Contacts**. Select the CSV you just downloaded. The system will automatically map the names and emails and ignore any duplicates.

### Step 3: Run Outreach
Click the **Start Campaign** button. 
- The backend will fetch your leads one by one.
- The AI will read the contact's company description and your profile.
- It will draft a hyper-personalized, "no-fluff" email.
- It will send it via your Gmail.

---

## 💳 3. Billing & Limits

### The Free Tier
By default, new users are placed on the **Free Tier**. To protect your email reputation and our AI costs, this limits you to **50 total emails**.

### Upgrading to Pro
If you need higher volume:
1. Navigate to the **Billing** tab in the sidebar.
2. Click **Upgrade to Pro**.
3. A secure Razorpay checkout window will appear.
4. Complete the $10/mo transaction.
5. Your limit is instantly raised to **1,000 emails per month**.

---

## 🛠️ 4. Troubleshooting 101

- **"The AI generation is taking too long!"**: LLM calls take roughly 5-10 seconds per email. This deliberate pacing actually helps your email deliverability by avoiding Gmail's spam-detection algorithms.
- **"Authentication Failed on SMTP"**: Double check that you removed the spaces from your Google App Password.
- **"Emails are bouncing"**: Ensure you are only exporting "Verified" emails from Apollo. If your bounce rate goes over 5%, Google may temporarily restrict your inbox.

> [!TIP]
> **Keep your Profile fresh**: Re-run the onboarding wizard via your Settings anytime you finish a new project. The AI will immediately start including that new project in its outbound emails!
