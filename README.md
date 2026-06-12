# SplitBuddy — Splitwise Clone

A production-grade expense splitting application inspired by Splitwise, built with modern web technologies.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)

## 🍷 Overview

SplitBuddy is a full-stack expense splitting app that lets groups track shared expenses, calculate balances, and settle debts. It supports 4 split methods (equal, unequal, percentage, share), real-time chat on expenses via WebSockets, and simplified debt calculations.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Shiraz theme |
| Deployment | Railway (API) + Vercel (UI) |

## 📁 Project Structure

```
splitbuddy/
├── backend/          # Express.js API server
│   ├── prisma/       # Schema + migrations + seed
│   └── src/
│       ├── config/       # DB client
│       ├── middleware/   # Auth, validation
│       ├── routes/       # API route definitions
│       ├── controllers/  # Business logic
│       ├── services/     # Balance & split calculations
│       ├── socket/       # Socket.io chat handler
│       └── utils/        # Error classes, helpers
├── frontend/         # Next.js frontend
├── AI_CONTEXT.md     # Full project context (source of truth)
├── BUILD_PLAN.md     # Build plan and architecture decisions
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repo-url>
cd splitbuddy
```

### 2. Backend Setup
```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed test data (optional)
npm run prisma:seed

# Start the backend
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit with your API URL

# Start the frontend
npm run dev
```

### 4. Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

### Test Credentials (after seeding)
- Email: `alice@example.com`
- Password: `password123`

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| GET | `/api/users/search?email=` | Search users |
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | List groups |
| GET | `/api/groups/:id` | Group details |
| POST | `/api/groups/:id/members` | Add member |
| DELETE | `/api/groups/:id/members/:userId` | Remove member |
| POST | `/api/groups/:gid/expenses` | Create expense |
| GET | `/api/groups/:gid/expenses` | List expenses |
| GET | `/api/expenses/:id` | Expense details |
| POST | `/api/expenses/:id/comments` | Add comment |
| GET | `/api/groups/:id/balances` | Group balances |
| GET | `/api/balances` | Overall balances |
| POST | `/api/groups/:gid/settlements` | Record settlement |

## 🤖 AI Tool Used

This project was built using **Gemini (Antigravity IDE)** as the AI development collaborator. The AI acted as a junior engineer, asking detailed questions before implementation and maintaining `AI_CONTEXT.md` as the source of truth throughout the build process.

## 📄 Key Files
- [AI_CONTEXT.md](./AI_CONTEXT.md) — Full project context, decisions, and implementation details
- [BUILD_PLAN.md](./BUILD_PLAN.md) — Architecture, phases, trade-offs, and AI collaboration log
