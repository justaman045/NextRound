# NextRound — AI-Powered Resume Builder

> **Build ATS-optimized resumes in seconds with AI, professional LaTeX templates, and seamless integrations.**

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-FF6B6B)](https://openrouter.ai)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?logo=razorpay)](https://razorpay.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-Demo-0A66C2?logo=vercel)](https://next-round-seven.vercel.app)

---

## The Problem

Creating a resume that passes Applicant Tracking Systems (ATS) while looking professional is extremely time-consuming. Most candidates struggle with:

- Manually tailoring resumes for each job
- Low ATS match scores
- Inconsistent formatting across templates
- Spending hours writing cover letters

**NextRound** solves this by combining **AI intelligence** with **professional typesetting** to help users create high-quality, ATS-optimized resumes in minutes.

---

## Key Features

| Feature                    | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| **AI Resume Tailoring**   | Paste a job description → AI rewrites your resume for maximum ATS match    |
| **ATS Scoring**           | Get a 0–100 match score with detailed keyword & relevance analysis         |
| **Multi-Model AI**        | Choose any OpenRouter model (GPT-4o, Claude, Gemini, etc.)                 |
| **LaTeX Templates**       | Professional, publication-grade templates with Handlebars injection        |
| **Template Builder**      | Admin panel to upload and manage custom LaTeX templates                    |
| **Cover Letter Generation** | AI-generated, role-specific cover letters                                 |
| **GitHub Integration**    | Auto-import projects and contributions                                     |
| **LinkedIn Import**       | Pull profile data directly from LinkedIn                                   |
| **DOCX & PDF Export**     | Export polished resumes in multiple formats                                |
| **Subscription Billing**  | Razorpay-powered premium plans                                             |

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| **Frontend**   | Next.js 15 (App Router + TypeScript)            |
| **Database**   | Firebase Firestore                            |
| **Authentication** | Firebase Authentication                    |
| **AI Layer**   | OpenRouter (model-agnostic)                     |
| **Typesetting**| LaTeX + Handlebars + latexonline.cc           |
| **Payments**   | Razorpay                                        |
| **Export**     | DOCX generation                                 |
| **Hosting**    | Vercel                                          |

---

## Architecture Highlights

- **Model Agnostic AI**: Users can switch between different LLMs without changing the core logic.
- **LaTeX Engine**: Uses Handlebars for dynamic content injection into professional LaTeX templates.
- **Real-time Sync**: Firebase enables seamless experience across devices.
- **Scalable Admin Panel**: Allows easy addition of new templates without code changes.

---

## Live Demo

**Try it here**: [https://next-round-seven.vercel.app](https://next-round-seven.vercel.app)

---

## Getting Started (Local Development)

```bash
git clone https://github.com/justaman045/NextRound.git
cd NextRound
npm install
npm run dev
```

> Note: You will need Firebase and OpenRouter API keys to run the full application.

---

## Future Roadmap

- AI interview preparation module
- Resume version control
- One-click application tracking integration
- Multi-language support

---

## Why This Project Matters

This project demonstrates strong skills in:

- Full-Stack development with modern frameworks
- AI integration and prompt engineering
- Building real-world, user-facing products
- Handling payments, authentication, and complex document generation

---

**Built with ❤️ by [Aman Ojha](https://github.com/justaman045)**