# NextRound — AI Resume Builder

> **AI-powered resume builder with ATS scoring, LaTeX compilation, and multi-template support.** Tailor resumes to job descriptions, generate cover letters, and export polished PDFs.

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-FF6B6B)](https://openrouter.ai)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?logo=razorpay)](https://razorpay.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## Features

- **AI Resume Tailoring** — Paste a job description; AI rewrites your resume for maximum ATS match score
- **ATS Scoring** — Get a detailed 0-100 match score with analysis of keyword coverage and role relevance
- **Multi-Model AI** — Choose from any free OpenRouter model; auto-fallback to `openrouter/free`
- **LaTeX Templates** — Professional LaTeX templates with Handlebars variable injection
- **Template Builder** — Admin panel to upload, convert, and manage LaTeX → Handlebars templates
- **Cover Letter Generation** — AI-generated cover letters tailored to specific roles
- **GitHub Integration** — Import projects and contributions directly from GitHub
- **LinkedIn Import** — Pull profile data from LinkedIn
- **DOCX Export** — Export resumes as Word documents
- **Razorpay Billing** — Subscription plans for premium features

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI | OpenRouter (model-agnostic — GPT-4o, Claude, Gemini, etc.) |
| LaTeX | Handlebars → latexonline.cc → PDF |
| Payments | Razorpay |
| Export | DOCX generation |
| Hosting | Vercel |

## Getting Started

```bash
# Clone
git clone https://github.com/justaman045/NextRound.git
cd NextRound

# Install
npm install

# Set up environment
cp .env.example .env.local
# Fill in Firebase config, OpenRouter API key, Razorpay keys

# Run dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK config |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK key (JSON) |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay payment gateway |

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Resume builder dashboard |
| `/tailor` | AI tailoring + ATS scoring |
| `/preview` | Resume preview + PDF export |
| `/admin` | Template management, users, integrations |
| `/api/ai/evaluate-ats` | ATS score evaluation API |
| `/api/compile` | LaTeX → PDF compilation API |
| `/api/export/docx` | DOCX export API |

## LaTeX Pipeline

```
LaTeX source → OpenRouter AI → Handlebars template → .tar.gz → latexonline.cc → PDF
```

For detailed Razorpay setup, see [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md).
