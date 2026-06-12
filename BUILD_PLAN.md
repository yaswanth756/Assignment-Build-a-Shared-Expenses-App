# BUILD_PLAN.md — SplitBuddy (Shared Expenses App)

> **Build plan for a production-grade Splitwise-inspired expense splitting app.**  
> Timeline: 2 days | AI-assisted development  
> AI Tool: Gemini (Google DeepMind) via Antigravity IDE  
> Last Updated: 2026-06-12

---

## 1. Product Research — How We Studied Splitwise

### Reverse Engineering Process
We analyzed Splitwise by studying its core user workflows, UI patterns, and data model:

1. **Signed up and explored** the app end-to-end as a real user
2. **Mapped the core user journey**: Sign Up → Create Group → Add Members → Add Expense → Choose Split Method → View Balances → Settle Up
3. **Identified the data model** by observing how expenses, splits, and balances relate to each other
4. **Studied 4 split methods**: Equal, Unequal (exact amounts), Percentage-based, Share-based
5. **Analyzed the balance algorithm**: Net amounts per user, simplified debts using a greedy approach
6. **Observed UX patterns**: Card-based layouts, quick-add flows, summary dashboards, inline member search

### Key Workflows Identified

| # | Workflow | What It Does |
|---|----------|-------------|
| 1 | **Authentication** | Email/password signup and login with JWT tokens |
| 2 | **Group Management** | Create groups, name them, add/remove members by email |
| 3 | **Expense Creation** | Enter amount, select who paid, choose split method, assign shares |
| 4 | **Balance Tracking** | View per-group balances: who owes whom and how much |
| 5 | **Settlements** | Record a payment between two users to clear a debt |
| 6 | **Expense Chat** | Comment thread on each expense with real-time updates |
| 7 | **Activity Feed** | See recent expenses and settlements in the group |

### Product Scope Decisions (What to Include vs. Exclude)

#### ✅ In Scope (MVP — Must Have)
| Feature | Details |
|---------|---------|
| Authentication | Email/password signup & login with JWT |
| Groups | Create, edit, delete groups; add/remove members by email |
| Expenses | Create, edit, delete expenses within groups |
| Split Methods | Equal, Unequal (exact amounts), Percentage, Share-based |
| Expense Chat | Real-time comment thread on each expense via Socket.io |
| Balances | Group-wise balances + overall individual balance summary |
| Settlements | Record payments to settle debts between users |
| User Profile | Basic profile with name, email |

#### ❌ Out of Scope (Excluded for MVP)
- Multi-currency support
- Recurring expenses
- Receipt scanning / OCR
- Email notifications / push notifications
- Expense categories with icons
- Friend-to-friend expenses (non-group) — all expenses are group-based
- Payment gateway integration (settlements are manual recordings)
- Export to CSV/PDF
- Google OAuth / social login

### Product Assumptions
- Users are friends/colleagues splitting everyday expenses (food, rent, travel)
- Single currency only (₹ or $)
- One payer per expense (no multi-payer)
- All expenses belong to a group (no standalone friend expenses)
- Settlements are manual recordings (no actual payment processing)
- No email verification needed for MVP

---

## 2. Architecture & Technical Decisions

### Tech Stack — What We Chose and Why

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| Backend Runtime | Node.js (v18+) | Fast async I/O, JavaScript full-stack consistency |
| Backend Framework | Express.js | Lightweight, flexible, industry standard for REST APIs |
| Database | PostgreSQL (Neon Serverless) | Robust relational DB; Neon provides free cloud hosting with serverless connectivity |
| ORM | Prisma | Type-safe schema definition, clean migrations, excellent developer experience |
| Authentication | JWT + bcryptjs | Stateless auth (no server sessions), secure password hashing |
| Real-time | Socket.io | Mature WebSocket library for expense chat feature |
| Frontend | Next.js 14 (App Router) | React-based, server-side rendering, file-based routing |
| Styling | Tailwind CSS v3 | Utility-first CSS, rapid iteration, consistent design |
| Color Theme | Shiraz (wine-red) palette | Custom brand identity, premium feel |
| Deployment | Vercel (Backend + Frontend) | Serverless deployment, auto-deploy from GitHub |
| Database Hosting | Neon | Serverless PostgreSQL, free tier, connects over HTTPS |

### Database Schema Design

**7 tables** with UUID primary keys, cascading deletes, and proper foreign key relationships:

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │────▶│ group_members│◀────│  groups  │
└──────────┘     └──────────────┘     └──────────┘
     │                                      │
     │           ┌──────────────┐           │
     ├──────────▶│   expenses   │◀──────────┤
     │           └──────────────┘           │
     │                  │                   │
     │           ┌──────────────┐           │
     ├──────────▶│expense_splits│           │
     │           └──────────────┘           │
     │           ┌──────────────┐           │
     ├──────────▶│ settlements  │◀──────────┤
     │           └──────────────┘           │
     │           ┌────────────────┐         │
     └──────────▶│expense_comments│         │
                 └────────────────┘         │
```

| Table | Purpose | Key Constraints |
|-------|---------|----------------|
| `users` | User accounts | Unique email, UUID PK |
| `groups` | Expense groups | FK to creator (users) |
| `group_members` | User ↔ Group mapping | Unique(group_id, user_id), admin/member roles |
| `expenses` | Expense records | FK to group, payer, creator; split_type enum |
| `expense_splits` | Individual shares per expense | Unique(expense_id, user_id), Decimal(12,2) |
| `settlements` | Payment records | FK to group, payer, payee |
| `expense_comments` | Chat messages on expenses | FK to expense, user |

Full schema with column types: see [AI_CONTEXT.md](./AI_CONTEXT.md) §5

### API Design

RESTful API with **20+ endpoints** across 7 resource groups:

| Resource Group | Base Path | Endpoints |
|---------------|-----------|-----------|
| Auth | `/api/auth/*` | Register, Login, Get Profile |
| Users | `/api/users/*` | Search by email/name |
| Groups | `/api/groups/*` | CRUD groups + member management |
| Expenses | `/api/groups/:id/expenses/*` | CRUD expenses with splits |
| Expense Detail | `/api/expenses/:id/*` | Get/update/delete individual expenses |
| Balances | `/api/groups/:id/balances`, `/api/balances` | Group & overall balances |
| Settlements | `/api/groups/:id/settlements` | Record & list settlements |
| Comments | `/api/expenses/:id/comments` | Real-time chat on expenses |

Full endpoint table: see [README.md](./README.md) and [AI_CONTEXT.md](./AI_CONTEXT.md) §6

### Balance Calculation Algorithm

```
For each group:
  1. Iterate all expenses
  2. For each expense: payer is owed money by each split participant
  3. Net balance = SUM(what you paid) - SUM(what you owe)
  4. Subtract settlements already made
  5. Simplify debts: greedy algorithm — match largest creditor with largest debtor

Example:
  - $90 dinner paid by Alice, split equally among Alice, Bob, Charlie
  - Each share = $30
  - Bob owes Alice $30, Charlie owes Alice $30
  - Alice net = +$60, Bob net = -$30, Charlie net = -$30
```

### Frontend Architecture

- **Next.js 14 App Router** with file-based routing
- **Component-driven architecture**: `ui/`, `layout/`, `groups/`, `expenses/`
- **Context API** for authentication state management (AuthContext)
- **Axios** for API calls with JWT token interceptor
- **Socket.io client** for real-time expense chat

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Hero page with CTA |
| Login | `/login` | Email + password login |
| Register | `/register` | New user signup |
| Dashboard | `/dashboard` | Groups list + balance summary |
| Create Group | `/groups/new` | Group creation form |
| Group Detail | `/groups/[id]` | Expenses, members, balances |
| Add Expense | `/groups/[id]/add` | Expense form with split selector |

### Deployment Architecture

```
┌─────────────┐     HTTPS     ┌──────────────────┐     WebSocket     ┌──────────────┐
│   Browser    │──────────────▶│  Vercel (Frontend)│                   │  Neon DB      │
│  (Next.js)   │               │  Next.js 14       │                   │  PostgreSQL   │
└─────────────┘               └──────────────────┘                   └──────────────┘
       │                                                                     ▲
       │ API calls                                                           │
       ▼                                                                     │
┌──────────────────┐                                                         │
│ Vercel (Backend)  │─────── Prisma + Neon Serverless Adapter ──────────────┘
│ Express.js API    │    (connects over HTTPS, not TCP port 5432)
└──────────────────┘
```

---

## 3. AI Collaboration Process

### AI Tool Used
**Gemini (Google DeepMind)** via **Antigravity IDE** — an agentic AI coding assistant that can read/write files, run terminal commands, search the web, and generate images.

### How the AI Was Instructed
1. AI was given the **full assignment prompt** and told to act as a junior engineer
2. AI was instructed **NOT to assume requirements** and to ask questions first
3. AI was told to create `AI_CONTEXT.md` as the **single source of truth** before writing any code
4. AI maintained documentation throughout the entire build process

### Questions the AI Asked Before Writing Code

The AI asked **20+ clarifying questions** before implementation, including:

| # | Category | Question |
|---|----------|----------|
| 1 | Product Scope | What are the target users and use cases? |
| 2 | Product Scope | Which split methods should be supported? |
| 3 | Tech Stack | Backend framework preference (Express vs Fastify vs Koa)? |
| 4 | Tech Stack | Database choice (PostgreSQL vs MySQL vs MongoDB)? |
| 5 | Tech Stack | Authentication approach (JWT vs sessions vs OAuth)? |
| 6 | Tech Stack | Real-time technology (Socket.io vs SSE vs polling)? |
| 7 | Architecture | How should group invites work (email vs link vs code)? |
| 8 | Architecture | What happens when removing a member with outstanding balances? |
| 9 | Architecture | Should split amounts allow decimal precision? |
| 10 | UX/Design | Frontend framework and styling preference? |
| 11 | UX/Design | Color theme and design inspiration? |
| 12 | Deployment | Deployment targets (Vercel, Railway, Render)? |

### How Answers Shaped the Architecture
- **User chose Node.js + Express + Prisma** → backend-first development approach
- **User chose Next.js 14 + Tailwind CSS** → App Router with utility-first styling
- **User specified Shiraz color theme** → custom wine-red palette throughout
- **User wanted 21.dev-inspired UI** → premium, production-grade design with animations
- **Assignment requirements** drove feature scope (4 split methods, real-time chat, balances)

### AI_CONTEXT.md — The Single Source of Truth
- **Created at project start** with full scope: product understanding, tech stack, database schema, API design, project structure, screens, deployment plan
- **Updated after each major decision** throughout the build
- **Updated during implementation** when schema or logic changed
- **424 lines** of comprehensive documentation covering 14 sections
- Any developer or AI agent can **rebuild the same app** from this file alone

### AI Contribution Summary
| Phase | What the AI Did |
|-------|----------------|
| Research | Reverse-engineered Splitwise workflows, identified 4 split methods, designed balance algorithm |
| Planning | Created AI_CONTEXT.md (schema, API, structure), BUILD_PLAN.md (phases, trade-offs) |
| Backend | Implemented Express server, Prisma schema, all routes/controllers/services, Socket.io chat |
| Frontend | Built Next.js app, Tailwind styling, auth flow, dashboard, group/expense pages, landing page |
| Database | Configured Neon serverless PostgreSQL, created all 7 tables, set up Prisma adapter |
| Deployment | Configured Vercel deployment, fixed Prisma serverless issues, set up CI/CD via GitHub |
| Debugging | Fixed Vercel export errors, Prisma version mismatches, network connectivity issues |

---

## 4. Build Phases — Implementation Timeline

### Phase 1: Planning & Backend Foundation (Day 1 — First Half)
- [x] Reverse-engineer Splitwise and define product scope
- [x] Create AI_CONTEXT.md with full scope, schema, API design
- [x] Create BUILD_PLAN.md with architecture and phases
- [x] Initialize Node.js + Express project
- [x] Define Prisma schema (7 tables, 2 enums)
- [x] Implement auth routes (register, login, JWT middleware)

### Phase 2: Backend Features (Day 1 — Second Half)
- [x] Group CRUD + member management (add/remove by email)
- [x] Expense CRUD + split calculation logic (4 split methods)
- [x] Balance calculation engine (net balances + debt simplification)
- [x] Settlement recording and listing
- [x] Expense comments + Socket.io real-time chat
- [x] Request validation middleware
- [x] Error handling (custom error classes, global error handler)

### Phase 3: Frontend Foundation (Day 2 — First Half)
- [x] Next.js 14 setup with Tailwind CSS + Shiraz theme
- [x] Design system: custom colors, typography (Inter + Anton fonts), glassmorphism
- [x] Auth pages (Login, Register) with form validation
- [x] AuthContext provider with JWT token management
- [x] Axios API client with token interceptor
- [x] Dashboard page — groups list with balance overview
- [x] Navbar + Footer layout components

### Phase 4: Frontend Features + Deployment (Day 2 — Second Half)
- [x] Landing page with hero section and 3D illustration
- [x] Create Group page with member search
- [x] Group Detail page — expenses list, members, balances
- [x] Add Expense page with split method selector
- [x] Responsive design (mobile + desktop)
- [x] Smooth animations and micro-interactions
- [x] Neon serverless PostgreSQL setup (HTTPS-based, bypasses port 5432 blocks)
- [x] Prisma + Neon serverless adapter configuration
- [x] Deploy backend to Vercel (serverless functions)
- [x] Deploy frontend to Vercel (auto-deploy from GitHub)
- [x] Push all code to GitHub with comprehensive README

---

## 5. Trade-offs & Design Decisions

### What We Built (and Why)

| Decision | Reasoning |
|----------|-----------|
| **4 split methods** | Core Splitwise feature — equal, unequal, percentage, share-based |
| **JWT stateless auth** | Simpler than sessions, works well with serverless deployment |
| **Prisma ORM** | Type-safe queries, clean schema definition, good migration tooling |
| **Greedy debt simplification** | Good enough for MVP; optimal min-transactions requires graph algorithms |
| **Socket.io for chat** | Mature WebSocket library, easy to integrate with Express |
| **Neon serverless adapter** | Bypasses port 5432 network blocks by connecting over HTTPS |

### What We Simplified

| Simplification | Why |
|---------------|-----|
| Single currency only (₹) | Multi-currency adds significant complexity (exchange rates, formatting) |
| One payer per expense | Splitwise default behavior; multi-payer is a rare edge case |
| Greedy debt simplification | Optimal algorithm (graph-based) adds complexity without much user-facing benefit |
| No expense categories/icons | Time constraint — simple text descriptions suffice for MVP |
| Groups only (no friend-to-friend) | Simpler data model; all expenses are group-based |

### What We Hardcoded
- Currency symbol (₹)
- Default split type (equal)
- JWT expiry (7 days)
- Max file upload size (10MB)

### What We Explicitly Avoided
- Email verification / password reset
- Push notifications / email notifications
- Receipt scanning / OCR
- Multi-currency conversion
- Payment gateway integration (Stripe, Razorpay)
- Google OAuth / social login
- Dark mode toggle

### What We'd Improve With More Time

| Improvement | Impact |
|------------|--------|
| Expense categories with icons | Better UX, visual expense identification |
| Optimal debt simplification (graph-based) | Fewer transactions to settle all debts |
| Email notifications on new expenses | Users stay informed without opening the app |
| Google OAuth | Faster signup, fewer passwords to manage |
| Dark mode toggle | User preference, better night usage |
| PWA support | Mobile app-like experience |
| Comprehensive test suite (Jest) | Code reliability, regression prevention |
| Friend-to-friend expenses | Non-group expenses, like Splitwise supports |
| Activity feed / timeline | See recent group activity at a glance |
| Export to CSV/PDF | Useful for expense reporting |

---

## 6. Challenges Faced & Solutions

| Challenge | Solution |
|-----------|----------|
| **Port 5432 blocked on network** | Used Neon's serverless driver (`@neondatabase/serverless`) which connects over HTTPS (port 443) instead of TCP |
| **Prisma can't connect to Neon** | Installed `@prisma/adapter-neon` with WebSocket support (`ws` package) for Prisma client |
| **Schema push failed (P1001)** | Created a custom Node.js script to push DDL directly via Neon's HTTP API |
| **Vercel "invalid export" error** | Changed `module.exports = { app, server }` to `module.exports = app` — Vercel needs the Express app as default export |
| **`server.listen()` on Vercel** | Wrapped in `if (!process.env.VERCEL)` — Vercel manages the server lifecycle |
| **Prisma not found in production** | Moved `prisma` from devDependencies to dependencies + added `postinstall` script |
| **Frontend nested `.git`** | Removed `frontend/.git` to prevent Git submodule issue |
| **Version mismatch (adapter)** | Pinned `@prisma/adapter-neon@5.22.0` to match `@prisma/client@5.22.0` |

---

## 7. Key Documentation Files

| File | Lines | Purpose |
|------|-------|---------|
| [README.md](./README.md) | 290+ | Setup instructions, API docs, features, AI tool documentation |
| [AI_CONTEXT.md](./AI_CONTEXT.md) | 424 | **Single source of truth** — full scope, schema, API design, implementation log |
| [BUILD_PLAN.md](./BUILD_PLAN.md) | This file | Architecture, AI collaboration, build phases, trade-offs |

---

*This plan is a living document. Last updated: 2026-06-12*
