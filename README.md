# HireMe — AI Job Search Assistant & LinkedIn Chrome Extension

> **Intelligent Resume Matching, Dual-Skill Extraction, and Real-Time Opportunity Tracking for Tech Professionals.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome)](https://developer.chrome.com/docs/extensions/)

---

## 🚀 Overview

**HireMe** is an end-to-end AI career accelerator and job analysis platform. It pairs a **Next.js web application** with a lightweight **Manifest V3 Chrome Extension** to help job seekers evaluate role compatibility in sub-400ms, extract key hiring requirements, and manage their job pipeline effortlessly.

### 🌟 Key Features

- **⚡ Sub-400ms Resume & Job Analysis**:
  Evaluates any job description against the user's uploaded resume with real-time scoring (0–100%).

- **🎯 Dual-Skill Matching Engine**:
  Separately extracts and matches **Technical Skills** (domain-specific dictionaries for Frontend, Backend, DevOps, Data Science/AI, Mobile, QA) and **Personality Development / Soft Skills** (Leadership, Communication, Problem Solving, Agile). Supports 50% keyword similarity heuristics (e.g., `ML` ↔ `Machine Learning`, `CSS` ↔ `CSS3`).

- **💼 Internship vs. Full-Time Job Detection**:
  Automatically classifies postings as **Internship** or **Full-time Job** and extracts accurate compensation:
  - **Internships**: Monthly stipend (e.g., `₹15,000 / month`).
  - **Jobs**: Annual CTC (e.g., `₹12,00,000 - ₹18,00,000`).

- **📞 Recruiter Contact Extraction**:
  Extracts hiring manager phone numbers (`📞 +91 ----------`) and email addresses (`✉️ hr@company.com`) directly from job descriptions, displaying them prominently in the tracker modal or showing `Contact : None`.

- **🧩 Clean Manifest V3 Chrome Extension**:
  Operates completely from the Chrome toolbar popup without cluttering or altering LinkedIn's native DOM. One-click scraping, instant evaluation, and seamless cloud sync.

- **📊 Opportunity Tracker & AI Career Coach**:
  Manage job stages (`Saved`, `Applied`, `Interviewing`, `Offer`), view detailed skill gaps, and get personalized interview prep scripts.

---

## 🛠️ Tech Stack

- **Frontend & Fullstack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Database & Storage**: MongoDB Atlas with Mongoose (with in-memory fallback for offline resilience)
- **Browser Extension**: Chrome Extensions Manifest V3, Content Scripts, Popup Action API
- **Icons & Branding**: Custom SVG Lettermark & 32-bit ARGB anti-aliased icon suite

---

## 📁 Project Structure

```text
HireMe/
├── src/
│   ├── app/                    # Next.js App Router (Pages & API routes)
│   │   ├── api/
│   │   │   ├── analyze-job/    # Dual-skill parsing & evaluation endpoint
│   │   │   ├── auth/           # Authentication endpoints (login, signup, session)
│   │   │   ├── extension-stats/# Live statistics endpoint for extension
│   │   │   └── saved-jobs/     # Opportunity Tracker CRUD
│   │   ├── dashboard/          # Analytics & career overview
│   │   ├── tracker/            # Opportunity Pipeline board & detail modal
│   │   └── profile/            # Profile & resume skills manager
│   ├── components/             # Reusable UI components & HireMe logo
│   └── lib/                    # MongoDB connector, skill matcher, metadata extractor
├── extension/                  # Manifest V3 Chrome Extension
│   ├── manifest.json           # Extension configuration (v1.0.1)
│   ├── popup.html / popup.js   # Extension UI & scoring controller
│   ├── content.js              # Background LinkedIn DOM scraper
│   ├── scraper/                # Modular title, company, description extractors
│   └── icons/                  # 16px, 32px, 48px, 128px toolbar icons
├── public/                     # Static assets, branding, and extension.zip
└── package.json
```

---

## 🏃 Local Setup & Development

### 1. Clone & Install
```bash
git clone https://github.com/AryanKalekargit/HireMe.git
cd HireMe
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hireme?retryWrites=true&w=majority
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the web application.

---

## 🧩 Installing the Chrome Extension

1. In Google Chrome, navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top-right corner.
3. Click **"Load unpacked"** in the top-left corner.
4. Select the `extension/` directory inside this repository.
5. Pin **HireMe** to your Chrome toolbar.
6. Open any LinkedIn job listing (e.g., `linkedin.com/jobs/view/...`), click the extension icon, and click **"Evaluate Current Job Posting"**!

---

## 🚀 Deploying to Vercel

1. Push this repository to **GitHub**.
2. Visit [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `HireMe` GitHub repository.
4. In the **Environment Variables** section, add:
   - `MONGODB_URI` = *(your MongoDB Atlas connection string)*
5. Click **Deploy**. Vercel will build and assign you an instant live URL (`https://your-hireme.vercel.app`).

---

## 📄 License
MIT License. Built for modern tech job seekers.
