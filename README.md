# SplitBuddy — Shared Expenses App (Splitwise Clone)

> A production-grade, full-stack expense splitting application inspired by Splitwise.  
> Built as part of an internship assignment using AI-assisted development.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)

---

## 🔗 Live Demo & Repository

| Resource | Link |
|----------|------|
| **GitHub Repository** | [github.com/yaswanth756/Assignment-Build-a-Shared-Expenses-App](https://github.com/yaswanth756/Assignment-Build-a-Shared-Expenses-App) |
| **Backend API (Vercel)** | [assignment-build-a-shared-expenses.vercel.app/api/health](https://assignment-build-a-shared-expenses.vercel.app/api/health) |
| **Frontend (Vercel)** | *(Deployed separately — see Deployment section)* |

---

## 🍷 Overview

**SplitBuddy** is a full-stack shared expenses app that allows users to:
- Create groups and add members by email
- Add expenses with **4 split methods** (Equal, Unequal, Percentage, Share-based)
- View real-time balances — who owes whom and how much
- Settle debts by recording payments
- Chat on expenses in real-time via WebSockets

This project was reverse-engineered from Splitwise, scoped to an MVP, and built in a 2-day sprint using AI-assisted development.

---

## 🤖 AI Tool Used

| Detail | Info |
|--------|------|
| **AI Tool** | **Gemini (Google DeepMind) — via Antigravity IDE** |
| **Role** | AI acted as a junior engineer / pair programmer |
| **How it was used** | The AI was given the full assignment prompt. It asked 20+ clarifying questions before writing any code — covering product scope, tech stack, database design, UX patterns, and deployment strategy. It then helped implement the full backend and frontend. |
| **Context File** | `AI_CONTEXT.md` — maintained as the single source of truth throughout development |
| **Build Plan** | `BUILD_PLAN.md` — documents architecture decisions, AI collaboration process, and trade-offs |

### AI Collaboration Process
1. **Research Phase** — AI reverse-engineered Splitwise's core workflows and asked clarifying questions
2. **Planning Phase** — AI created `AI_CONTEXT.md` (full scope, schema, API design) and `BUILD_PLAN.md`
3. **Implementation Phase** — AI built backend (Express + Prisma) and frontend (Next.js + Tailwind) with human review at each step
4. **Deployment Phase** — AI configured Neon PostgreSQL (serverless), Vercel deployment, and fixed production issues

### Key Prompts Used
```
Prompt 1 (Initial): "You are a junior engineer helping me complete an internship assignment.
The assignment is to reverse engineer Splitwise, scope a realistic 2-day version,
and build a working deployed app..."

Prompt 2 (Tech Decisions): "Backend: Node.js + Express, Frontend: Next.js + Tailwind CSS,
Color theme: Shiraz palette, UI inspiration: 21.dev, professional grade"
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend Runtime** | Node.js (v18+) | Fast, async, JavaScript ecosystem |
| **Backend Framework** | Express.js | Industry standard, lightweight |
| **Database** | PostgreSQL (Neon Serverless) | Robust relational DB, cloud-hosted |
| **ORM** | Prisma | Type-safe queries, clean schema |
| **Authentication** | JWT + bcryptjs | Stateless auth, secure password hashing |
| **Real-time** | Socket.io | WebSocket library for expense chat |
| **Frontend** | Next.js 14 (App Router) | React-based, SSR, file-based routing |
| **Styling** | Tailwind CSS v3 | Utility-first, rapid UI development |
| **Color Theme** | Shiraz (wine-red palette) | Custom premium brand identity |
| **Deployment** | Vercel (Backend + Frontend) | Serverless, auto-deploy from GitHub |
| **Database Hosting** | Neon | Serverless PostgreSQL, free tier |

---

## 📁 Project Structure

```
Assignment-Build-a-Shared-Expenses-App/
├── README.md              # This file — setup & AI documentation
├── AI_CONTEXT.md          # Full project context (single source of truth)
├── BUILD_PLAN.md          # Architecture, phases, trade-offs
├── backend/
│   ├── package.json
│   ├── vercel.json        # Vercel serverless config
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema (7 tables)
│   │   └── seed.js        # Test data seeder
│   └── src/
│       ├── index.js           # Express app entry point
│       ├── config/db.js       # Prisma + Neon serverless client
│       ├── middleware/
│       │   ├── auth.js        # JWT verification middleware
│       │   └── validate.js    # Request validation
│       ├── routes/
│       │   ├── auth.js        # Register, Login, Profile
│       │   ├── groups.js      # Group CRUD + members
│       │   ├── expenses.js    # Expense CRUD + splits
│       │   ├── balances.js    # Balance calculations
│       │   └── settlements.js # Debt settlement recording
│       ├── controllers/       # Business logic for each route
│       ├── services/
│       │   ├── balanceService.js  # Balance calculation engine
│       │   └── splitService.js    # Split calculation logic
│       ├── socket/chat.js     # Socket.io real-time chat
│       └── utils/             # Error classes, helpers
└── frontend/
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.js     # Shiraz color theme
    └── src/
        ├── app/               # Next.js App Router pages
        │   ├── page.js        # Landing page
        │   ├── login/         # Login page
        │   ├── register/      # Registration page
        │   ├── dashboard/     # Dashboard with groups & balances
        │   └── groups/
        │       ├── new/       # Create group
        │       └── [id]/      # Group detail + add expense
        ├── components/
        │   ├── ui/            # Reusable: Button, Card
        │   └── layout/        # Navbar, Footer
        ├── context/AuthContext.js  # Auth state management
        └── lib/api.js         # Axios API client
```

---

## 🚀 Setup Instructions (Run Locally)

### Prerequisites
- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** — Either local install or use [Neon](https://neon.tech) (free cloud PostgreSQL)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yaswanth756/Assignment-Build-a-Shared-Expenses-App.git
cd Assignment-Build-a-Shared-Expenses-App
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Database — Use your own PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# JWT Secret — Change this to any strong random string
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5001
NODE_ENV=development

# CORS — Frontend URL
CORS_ORIGIN="http://localhost:3000"
```

Then run:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# (Optional) Seed test data
npm run prisma:seed

# Start the backend server
npm run dev
```

The backend will be running at: **http://localhost:5001**

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Then run:

```bash
npm run dev
```

The frontend will be running at: **http://localhost:3000**

### Step 4: Verify Everything Works

| Check | URL |
|-------|-----|
| Frontend | http://localhost:3000 |
| Backend Health | http://localhost:5001/api/health |
| Register | http://localhost:3000/register |
| Login | http://localhost:3000/login |

### Test Credentials (after seeding)

| Email | Password |
|-------|----------|
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |
| `charlie@example.com` | `password123` |

---

## 📊 Database Schema

7 tables with UUID primary keys, cascading deletes, and proper foreign key relationships:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (name, email, password hash) |
| `groups` | Expense groups (name, description, creator) |
| `group_members` | Many-to-many: users ↔ groups (with admin/member roles) |
| `expenses` | Expense records (amount, payer, split type, group) |
| `expense_splits` | Individual share per user per expense |
| `settlements` | Payment records between two users to clear debts |
| `expense_comments` | Real-time chat messages on expenses |

Full schema details: see [AI_CONTEXT.md](./AI_CONTEXT.md) §5

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (name, email, password) |
| POST | `/api/auth/login` | Login → returns JWT token |
| GET | `/api/auth/me` | Get current user profile (protected) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?email=` | Search users by email or name |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create a new group |
| GET | `/api/groups` | List all groups for current user |
| GET | `/api/groups/:id` | Get group details with members |
| PUT | `/api/groups/:id` | Update group info |
| DELETE | `/api/groups/:id` | Delete group (admin only) |
| POST | `/api/groups/:id/members` | Add member by email |
| DELETE | `/api/groups/:id/members/:userId` | Remove member |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups/:groupId/expenses` | Create expense with splits |
| GET | `/api/groups/:groupId/expenses` | List group expenses |
| GET | `/api/expenses/:id` | Get expense details |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Balances & Settlements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups/:id/balances` | Get group-wise balances |
| GET | `/api/balances` | Overall user balance summary |
| POST | `/api/groups/:groupId/settlements` | Record a settlement payment |
| GET | `/api/groups/:groupId/settlements` | List settlements |

### Expense Chat (Real-time)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/:id/comments` | Get comments on an expense |
| POST | `/api/expenses/:id/comments` | Add comment (also broadcasts via Socket.io) |

---

## 🎨 Features Implemented

### Core Features (MVP)
- ✅ **User Authentication** — Register, login, JWT-protected routes
- ✅ **Group Management** — Create, edit, delete groups; add/remove members by email
- ✅ **Expense Tracking** — Create, edit, delete expenses within groups
- ✅ **4 Split Methods** — Equal, Unequal (exact amounts), Percentage, Share-based
- ✅ **Balance Calculation** — Per-group balances showing who owes whom
- ✅ **Debt Settlement** — Record payments to clear debts
- ✅ **Expense Chat** — Real-time comment threads on expenses via Socket.io
- ✅ **User Search** — Find and add members by email

### UI/UX
- ✅ Premium Shiraz (wine-red) color theme
- ✅ Responsive design (mobile + desktop)
- ✅ Smooth animations and micro-interactions
- ✅ Card-based layouts with glassmorphism effects
- ✅ Professional landing page with 3D hero illustration

---

## 🚢 Deployment

### Backend — Vercel (Serverless)
- Deployed as serverless functions via `vercel.json`
- Prisma + Neon serverless adapter (connects over HTTPS, not TCP)
- Environment variables configured in Vercel dashboard

### Frontend — Vercel
- Auto-deployed from GitHub on push
- Root directory set to `frontend/`
- `NEXT_PUBLIC_API_URL` points to backend deployment

### Database — Neon (Serverless PostgreSQL)
- Cloud-hosted PostgreSQL 18
- Connection via `@neondatabase/serverless` driver (WebSocket/HTTPS)
- 7 tables created and verified

---

## ⚖️ Trade-offs & Known Limitations

| Decision | Reason |
|----------|--------|
| No email verification | Time constraint — MVP focus |
| No push notifications | Out of scope for 2-day build |
| No multi-currency | Complexity, single currency (₹) |
| Single payer per expense | Splitwise default, simpler model |
| Groups only (no friend-to-friend) | Simpler data model |
| Greedy debt simplification | Good enough for MVP (not optimal min-transactions) |
| No expense categories | Time constraint |
| No receipt scanning/OCR | Out of scope |

---

## 📄 Key Documentation Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Setup instructions, features, AI tool documentation |
| [AI_CONTEXT.md](./AI_CONTEXT.md) | **Single source of truth** — Full product scope, database schema, API design, project structure, and implementation log |
| [BUILD_PLAN.md](./BUILD_PLAN.md) | Build phases, architecture decisions, AI collaboration process, trade-offs, and future improvements |

---

## 👤 Author

**Yaswanth** — Built as part of an internship assignment  
GitHub: [@yaswanth756](https://github.com/yaswanth756)

---

*Last updated: 2026-06-12*
