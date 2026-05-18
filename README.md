<div align="center">

# 🎯 GoalTracker — AtomQuest Performance Portal

**In-House Goal Setting & Tracking Portal**

*Built for AtomQuest Hackathon 1.0*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Problem Statement

Organizations relying on manual goal-tracking methods struggle with alignment, visibility, and accountability. GoalTracker is a structured, digital portal that supports the **full lifecycle of employee goals** — from creation and alignment to quarterly check-ins and performance visibility.

## ✨ Features

### Phase 1 — Goal Creation & Approval ✅

- **Employee Goal Sheet** — Create goals with Thrust Area, Title, Description, UoM, Target & Weightage
- **6 UoM Types** — Numeric (Min/Max), Percentage (Min/Max), Timeline, Zero-based
- **Validation Rules** — Total weightage = 100%, min 10% per goal, max 8 goals
- **Manager Approval Workflow** — Review, inline edit, approve or return for rework
- **Goal Locking** — Approved goals are locked; only Admin can unlock
- **Shared Goals** — Push departmental KPIs to multiple employees (read-only except weightage)

### Phase 2 — Achievement Tracking & Check-ins ✅

- **Quarterly Achievement Logging** — Actual vs Planned for each quarter (Q1–Q4)
- **Progress Status** — Not Started / On Track / Completed
- **Manager Check-in Module** — Planned vs Achievement view with structured comments
- **Auto-Computed Scores** — Per UoM formula (see table below)

| UoM Type | Formula | Example |
|----------|---------|---------|
| Min (Numeric / %) | Achievement ÷ Target | Sales Revenue |
| Max (Numeric / %) | Target ÷ Achievement | TAT, Cost |
| Timeline | Completion date vs Deadline | Project Delivery |
| Zero | If 0 → 100%, else 0% | Safety Incidents |

### Reporting & Governance ✅

- **Achievement Report** — Exportable to CSV with Planned vs Actual for all employees
- **Completion Dashboard** — Real-time submission & approval rates
- **Audit Trail** — Logs all changes with who, what, and when (filterable)

### Bonus Features ⭐

- **📊 Analytics Dashboard** — Thrust area distribution, UoM breakdown, department scores, progress heatmaps
- **⚠️ Escalation Module** — Rule-based escalation rules with configurable chains
- **🔔 In-App Notifications** — Real-time notifications for approvals, submissions, check-ins

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Employee** | Create/edit/submit goals, log quarterly achievements, view check-in feedback |
| **Manager (L1)** | Team dashboard, approve/return goals, quarterly check-ins, push shared goals |
| **Admin / HR** | Cycle management, user management, audit trail, reports, goal unlock, analytics |

## 🛠️ Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Next.js 16 (App Router) | SSR + API routes in one project |
| Language | TypeScript | Type safety across the stack |
| Database | SQLite (better-sqlite3) | Zero cost, zero setup, instant reads |
| Auth | NextAuth.js 4 (Credentials) | Role-based JWT sessions |
| Styling | Vanilla CSS | Premium dark-mode glassmorphism UI |
| Font | Inter (Google Fonts) | Modern, clean typography |

> **💰 Cost: $0** — SQLite = no DB cost. Deployable on Vercel free tier.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/astrosoham01/atomquest-goaltracker.git
cd atomquest-goaltracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | `employee@atomberg.com` | `password123` |
| Manager | `manager@atomberg.com` | `password123` |
| Admin | `admin@atomberg.com` | `password123` |

> 💡 Click the quick-access buttons on the login page for instant login.

The database is auto-seeded on first login with:
- 8 users (1 Admin, 2 Managers, 5 Employees)
- 6 Thrust Areas
- 1 Active Performance Cycle (FY 2026-27)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (Client)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Employee │  │ Manager  │  │   Admin/HR   │   │
│  │   Pages  │  │   Pages  │  │    Pages     │   │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │               │           │
│       └──────────────┼───────────────┘           │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │ HTTPS
┌──────────────────────┼───────────────────────────┐
│              Next.js Server                       │
│  ┌───────────────────┴──────────────────────┐    │
│  │           API Routes (REST)              │    │
│  │  /goals  /achievements  /checkins        │    │
│  │  /users  /cycles  /reports  /audit       │    │
│  └───────────────────┬──────────────────────┘    │
│                      │                           │
│  ┌───────────────────┴──────────────────────┐    │
│  │       NextAuth.js (JWT + Credentials)     │    │
│  └───────────────────┬──────────────────────┘    │
│                      │                           │
│  ┌───────────────────┴──────────────────────┐    │
│  │         SQLite (better-sqlite3)           │    │
│  │  users │ goals │ achievements │ audit_logs│    │
│  │  cycles│ checkins│notifications│escalations│   │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── db.ts              # Database schema & initialization
│   ├── seed.ts            # Demo data seeding
│   └── helpers.ts         # Score computation, audit logging, types
├── components/
│   ├── Sidebar.tsx        # Role-aware navigation
│   └── Header.tsx         # Page title, role badge, notifications
└── app/
    ├── login/             # Authentication page
    ├── api/               # 12 REST API routes
    ├── employee/          # 4 employee pages
    ├── manager/           # 4 manager pages
    └── admin/             # 8 admin pages
```

## 📊 Check-in Schedule

| Period | Window | Action |
|--------|--------|--------|
| Phase 1 — Goal Setting | 1st May | Goal Creation, Submission & Approval |
| Q1 Check-in | July | Progress Update — Planned vs Actual |
| Q2 Check-in | October | Progress Update — Planned vs Actual |
| Q3 Check-in | January | Progress Update — Planned vs Actual |
| Q4 / Annual | March–April | Final Achievement Capture |

## 🧑‍💻 Team

**Soham Botle** — Full Stack Developer

## 📄 License

This project was built for the AtomQuest Hackathon 1.0.
