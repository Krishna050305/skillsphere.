<div align="center">

<img src="https://img.shields.io/badge/SkillSphere-Hyperlocal%20Freelance%20Ecosystem-0A66C2?style=for-the-badge" alt="SkillSphere" />

<h3>Intelligent Hyperlocal Freelance Marketplace</h3>

<p>Connect clients with the right local freelancers using semantic AI matching, milestone-based escrow payments, and real-time collaboration — built as a production-shaped full-stack system, not a tutorial clone.</p>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat&logo=socket.io)](https://socket.io/)

</div>

---

## What is SkillSphere?

SkillSphere is a full-stack MERN platform that connects clients with freelancers in a hyperlocal environment. Instead of simple keyword filtering, it uses a **self-hosted AI matching engine** to rank freelancers by semantic similarity to a gig's requirements, blended with reputation score and geographic proximity.

The platform handles the complete work lifecycle — gig discovery, proposal negotiation, milestone-based escrow payments, real-time chat, and verified reputation scoring — with an admin dashboard for platform governance and fraud monitoring.

Built as part of a structured full-stack internship at **Nayoda**, with a review on **22 July 2026**.

---

## Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   React Client    │ ◄─────► │   Express API     │ ◄─────► │   MongoDB Atlas      │
│   (Vercel)         │  REST   │   (Render)         │         │                      │
│   + Socket.IO      │   WS    │   + Socket.IO      │         │  2dsphere indexes    │
└──────────────────┘         └────────┬─────────┘         │  Atlas Search        │
                                          │                  └─────────────────────┘
                                          │ internal HTTP
                                          ▼
                                ┌──────────────────┐
                                │   ml-service       │
                                │   FastAPI (Render)  │
                                │   sentence-         │
                                │   transformers      │
                                └──────────────────┘

External: Cloudinary · Razorpay (test mode) · Nodemailer · MongoDB Atlas Search
```

**Why a separate Python service?** The sentence-transformer model needs a Python runtime. Rather than cold-starting a subprocess on every match request, the model loads once at service startup and stays warm in memory — a `child_process.exec` approach would be the naive alternative and would be visibly slow at any real load. The Node API calls the FastAPI service over internal HTTP, keeping the two runtimes cleanly separated.

**Why not more services?** Two services plus a database is the right amount for this scope. No message queue, no container orchestration, no microservices added for resume padding.

---

## Core Modules

| # | Module | What makes it non-trivial |
|---|--------|--------------------------|
| 1 | **Multi-Role Auth** | JWT + refresh tokens, RBAC middleware, email verification, password reset, Google OAuth stub (Phase 2) |
| 2 | **AI Job Matching** | Self-hosted `all-MiniLM-L6-v2`, cached embeddings, weighted scoring formula (see below) |
| 3 | **Freelancer Profiles** | Skills with proficiency, portfolio gallery, resume upload, certifications, availability calendar, verification badge |
| 4 | **Gig Marketplace** | Full CRUD, milestone definition, file attachments, client invitations, geospatial search |
| 5 | **Proposal & Bidding** | Proposal submission, price negotiation history, match score snapshot at apply time |
| 6 | **Real-Time Chat** | Socket.IO, typing indicators, read receipts, file sharing, video call stub (Phase 2) |
| 7 | **Escrow Payments** | 7-state machine, transition guards, Razorpay integration, milestone release, refund flow |
| 8 | **Reputation System** | Weighted review scores (recent reviews count more), verified-review structural constraint |
| 9 | **Admin Dashboard** | User management, gig approval, MongoDB aggregation analytics, fraud flag queue |
| 10 | **Search Engine** | MongoDB Atlas Search — location, skill, price range, rating, experience filters |
| 11 | **Notifications** | Real-time via Socket.IO + email fallback via Nodemailer |
| 12 | **Availability Scheduler** | Weekly slot system, booking management |
| 13 | **Dispute Resolution** | Evidence upload, admin mediation, tied to escrow state machine |
| 14 | **Progress Tracker** | Milestone completion percentage, progress logs, deadline reminders via cron |
| 15 | **Freelancer Analytics** | Profile views, earnings chart, application stats, client feedback summary |

---

## AI Matching — How It Actually Works

This is not an API wrapper. The model runs locally inside `ml-service/`.

**Model:** `sentence-transformers/all-MiniLM-L6-v2`
- 384-dimensional embeddings
- ~80MB, runs on CPU — no GPU required
- Loads once at service startup, stays warm in memory
- Free to self-host, zero per-call cost, no external runtime dependency

**Pipeline:**
```
Freelancer text  =  headline + bio + skills + work history titles
Gig text         =  title + description + required skills

Both → /embed endpoint → 384-dim vector → cached on the document
Recomputed only when source text changes, not on every match request
```

**Scoring Formula:**
```
final_score = (0.60 × semantic_similarity)
            + (0.25 × normalized_rating)
            + (0.15 × proximity_score)

semantic_similarity  →  cosine_similarity(gig_vector, freelancer_vector), clamped to [0,1]
normalized_rating    →  freelancer.reputationScore / 5
proximity_score      →  exp(-distance_km / 25)   [or 1.0 if gig.isRemoteOk = true]
```

**Why these weights:**
- Semantic match at 60% — it's the actual "can this person do this job" signal
- Rating capped at 25% — so a new but genuinely skilled freelancer isn't invisible
- Proximity at 15% — hyperlocal is a discovery filter, not the primary qualifier. A perfectly matched freelancer 30km away beats a poor match 2km away

The three weights are named constants in `scoring.py`, not inline magic numbers — tunable without touching the formula logic.

---

## Escrow State Machine

Every payment goes through a formal state machine. No controller anywhere in the codebase sets `payment.state` directly — all transitions go through a single guarded function.

```
created ──► funded ──► in_progress ──► submitted_for_review ──► released
                │                              │
                │                              └──► disputed ──► released
                │                                              └──► refunded
                └──► refunded
```

```js
// This is the only function allowed to change payment state
function transition(payment, toState, actorUserId) {
  const allowed = ALLOWED_TRANSITIONS[payment.state] || [];
  if (!allowed.includes(toState)) {
    throw new Error(`Cannot move from ${payment.state} to ${toState}`);
  }
  payment.stateHistory.push({ state: toState, at: new Date(), by: actorUserId });
  payment.state = toState;
  return payment.save();
}
```

This design prevents bugs like a freelancer releasing their own payment, or a race condition double-releasing a milestone — by making the invalid transition structurally impossible, not just validated after the fact.

> ⚠️ Razorpay runs in **test mode** throughout. Going live requires KYC, a production Razorpay agreement, and payout account verification — intentionally out of scope for this build.

---

## Fraud Detection — Honest Scope

Rather than claiming an ML fraud model that doesn't exist, this platform uses **rule-based heuristics** logged to an admin queue — which is what most production fraud systems start as anyway.

| Heuristic | Trigger | Action |
|-----------|---------|--------|
| Review velocity | 3+ reviews from same reviewer in 10 minutes | Flag to AdminLog |
| Self-dealing pattern | Client + freelancer share signup IP/device | Flag to AdminLog |
| Rating outlier | All 5★ reviews but low proposal-to-hire conversion rate | Flag to AdminLog |
| Payment retry abuse | 5+ failed attempts on same order in 1 hour | Rate-limit + flag |

The admin dashboard's fraud panel is a filtered view of `AdminLog` where `action = 'fraud_flag'`. No overclaiming — just real, auditable rules.

**Structural fake-review prevention:** A `Review` document requires a `Proposal` reference, and the API only permits review creation when `Proposal.gig.status === 'completed'`. This makes reviewing someone you never contracted with structurally impossible through the API — it's a schema constraint, not a post-creation check.

---

## Tech Stack

### Frontend
| Library | Purpose |
|---------|---------|
| React 18 + Vite | UI framework |
| Redux Toolkit | Global state (auth, notifications) |
| TanStack Query | Server state, caching, background refetch |
| Tailwind CSS | Styling |
| Socket.IO Client | Real-time chat + notifications |
| Recharts | Analytics charts |
| Axios | HTTP client |

### Backend
| Library | Purpose |
|---------|---------|
| Node.js + Express | API server |
| Mongoose | MongoDB ODM |
| Socket.IO | WebSocket server |
| JSON Web Token | Auth tokens |
| bcryptjs | Password hashing |
| Joi | Request validation |
| Nodemailer | Email (verification, password reset, notifications) |
| Multer + Cloudinary | File uploads |
| node-cron | Scheduled jobs (deadline reminders, trending skills) |
| Helmet + CORS | Security headers |
| express-rate-limit | Rate limiting on auth + payment routes |

### ML Service
| Library | Purpose |
|---------|---------|
| FastAPI | API framework |
| sentence-transformers | `all-MiniLM-L6-v2` embedding model |
| NumPy | Cosine similarity, Haversine distance |
| Pydantic | Request/response validation |
| Uvicorn | ASGI server |

### Infrastructure
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Database + Atlas Search + 2dsphere geospatial indexes |
| Render | Backend API + ml-service hosting |
| Vercel | Frontend hosting |
| Cloudinary | File storage (portfolios, resumes, dispute evidence) |
| Razorpay | Payment gateway (test mode) |

---

## Repository Structure

```
skillsphere/
├── client/                         # React + Vite frontend
│   └── src/
│       ├── api/                    # Axios wrappers, one file per resource
│       ├── components/
│       │   ├── common/             # Button, Modal, Avatar, Badge, etc.
│       │   ├── auth/
│       │   ├── gigs/
│       │   ├── proposals/
│       │   ├── chat/
│       │   ├── reviews/
│       │   ├── payments/
│       │   └── admin/
│       ├── pages/                  # Route-level components
│       ├── hooks/                  # useAuth, useSocket, useDebounce, etc.
│       ├── store/                  # Redux Toolkit slices
│       ├── lib/                    # Socket.IO client setup, query client
│       └── utils/
│
├── server/                         # Node.js + Express API
│   └── src/
│       ├── config/                 # db.js, cloudinary.js, razorpay.js
│       ├── models/                 # 9 Mongoose schemas
│       ├── controllers/            # Thin — parse request, call service, respond
│       ├── routes/
│       ├── middleware/             # auth.js, rbac.js, validate.js, rateLimiter.js
│       ├── services/               # All business logic lives here
│       │   ├── matching.service.js
│       │   ├── escrow.service.js   # The state machine
│       │   ├── reputation.service.js
│       │   └── fraud.service.js
│       ├── sockets/                # Socket.IO event handlers
│       ├── jobs/                   # node-cron scheduled tasks
│       └── utils/
│
├── ml-service/                     # Python FastAPI matching engine
│   └── app/
│       ├── main.py                 # FastAPI routes (/embed, /match, /health)
│       ├── model.py                # Loads MiniLM once at startup
│       ├── scoring.py              # Weighted formula + cosine + haversine
│       └── schemas.py              # Pydantic models
│
└── docs/
    ├── api-contract.md
    └── DEPLOYMENT.md
```

> **`services/` vs `controllers/`:** controllers stay thin (parse → call → respond). All Mongoose queries and business rules live in `services/`. This is the single biggest structural difference between tutorial-grade and production-grade Express code — fat controllers with embedded queries are the #1 tell of an unconsidered codebase.

---

## Database Collections

```
Users          — single collection, role-discriminated (client / freelancer / admin)
               — GeoJSON Point with 2dsphere index for hyperlocal search
               — freelancerProfile sub-document with cached embeddingVector

Gigs           — with milestone sub-documents, 2dsphere index, embeddingVector
Proposals      — with negotiationHistory array, matchScore snapshot at apply time
Reviews        — requires Proposal ref (structural fraud prevention)
Messages       — with conversationId for thread grouping
Payments       — with stateHistory audit trail (the escrow state machine)
Notifications  — typed events, real-time + persistent
Disputes       — with evidence uploads, tied to Payment state
AdminLogs      — all admin actions + fraud heuristic flags
```

---

## Running Locally

Three terminal tabs — no Docker required.

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)
- Razorpay test-mode account

### Step 1 — Clone and install

```bash
git clone https://github.com/yourusername/skillsphere.git
cd skillsphere

# Server
cd server && npm install

# Client
cd ../client && npm install

# ML service
cd ../ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2 — Environment variables

```bash
# Copy all three .env.example files
cp server/.env.example server/.env
cp client/.env.example client/.env
cp ml-service/.env.example ml-service/.env
```

Fill in your actual values. See `.env.example` in each service for the full variable list.

### Step 3 — Run all three services

```bash
# Tab 1 — Backend API (runs on :5000)
cd server && npm run dev

# Tab 2 — Frontend (runs on :5173)
cd client && npm run dev

# Tab 3 — ML matching service (runs on :8001)
cd ml-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

### Step 4 — Seed demo data (optional but recommended)

```bash
cd server && node scripts/seed.js
```

Seeds 1 admin, 25 freelancers (varied skills, real Pune coordinates for hyperlocal demo), 8 clients, 15 gigs, and 5 completed contracts with payments and reviews. All seed users have realistic names and emails — not placeholder test data.

---

## Environment Variables

### `server/.env`
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

ML_SERVICE_URL=http://localhost:8001

CLIENT_URL=http://localhost:5173

# Phase 2 — not yet active
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### `ml-service/.env`
```env
ML_SERVICE_ALLOWED_ORIGIN=http://localhost:5000
```

---

## API Overview

| Resource | Base Path |
|----------|-----------|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/verify-email` · `POST /api/auth/forgot-password` · `POST /api/auth/reset-password` |
| Users | `GET /api/users/me` · `PATCH /api/users/me` · `GET /api/users/:id` · `POST /api/users/me/portfolio` |
| Gigs | `GET /api/gigs` · `POST /api/gigs` · `GET /api/gigs/:id` · `PATCH /api/gigs/:id` · `DELETE /api/gigs/:id` |
| Matching | `GET /api/gigs/:id/recommended-freelancers` · `GET /api/freelancers/:id/recommended-gigs` |
| Proposals | `POST /api/gigs/:id/proposals` · `GET /api/gigs/:id/proposals` · `PATCH /api/proposals/:id` |
| Chat | `GET /api/conversations` · `GET /api/conversations/:id/messages` |
| Reviews | `POST /api/reviews` · `GET /api/users/:id/reviews` |
| Payments | `POST /api/payments/create-order` · `POST /api/payments/verify` · `POST /api/payments/:id/release` |
| Disputes | `POST /api/disputes` · `PATCH /api/disputes/:id/resolve` |
| Admin | `GET /api/admin/users` · `GET /api/admin/analytics` · `GET /api/admin/fraud-flags` |
| ML Service | `POST /embed` · `POST /match` · `GET /health` |

Full request/response contracts: [`docs/api-contract.md`](./docs/api-contract.md)

---

## Phase 2 — Explicitly Deferred Features

These features are present in the codebase as stubs — real route shapes, real schema fields, real UI elements — just not yet implemented. Each returns a `501 Not Implemented` with a clear message rather than silently failing.

| Feature | Status | What exists now |
|---------|--------|-----------------|
| Google OAuth login | Stub | Route scaffolded, button renders with "Coming soon" tooltip |
| Two-Factor Authentication | Stub | Schema field exists, settings toggle returns 501 |
| WebRTC Video Calls | Stub | Chat UI has video icon → "Coming soon" modal |
| ElasticSearch | Swappable | Search sits behind a `SearchProvider` interface, swap implementation without touching callers |
| Redis Caching | Config-gated | Cache wrapper no-ops gracefully if `REDIS_URL` isn't set |

This is a scoping decision, not an oversight. These features are documented here rather than quietly omitted.

---

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the full step-by-step guide.

**Quick reference — deploy order matters:**
1. `ml-service` → Render (model download happens on first deploy, ~2 min)
2. `server` → Render (needs `ML_SERVICE_URL` from step 1)
3. `client` → Vercel (needs `VITE_API_URL` from step 2)

Update `SERVER_CORS_ORIGINS` with production URLs before deploying server.

---

## Project Context

Built as the capstone project for the **Nayoda Full-Stack Development Internship**, following a structured 5-week build plan (Week 0 foundation through Week 5 hardening and deployment). Review date: **22 July 2026**.

The build plan, data model decisions, AI matching rationale, and escrow state machine design are documented in [`docs/SkillSphere_Technical_Spec.md`](./docs/SkillSphere_Technical_Spec.md).

---

<div align="center">
<sub>Built by a second-year CS student at PICT, Pune · Nayoda Internship 2026</sub>
</div>
