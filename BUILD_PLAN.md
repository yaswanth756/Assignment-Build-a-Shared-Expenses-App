# BUILD_PLAN.md — SplitBuddy (Splitwise Clone)

> Build plan for a production-grade Splitwise-inspired expense splitting app.
> Timeline: 2 days | AI-assisted development

---

## 1. Product Research

### How We Studied Splitwise
- Reverse-engineered core workflows: signup → create group → add expense → split → view balance → settle up
- Identified 4 split methods: equal, unequal, percentage, share-based
- Studied the balance calculation model: net amounts per user, simplified debts
- Analyzed UX patterns: card-based layouts, quick-add flows, summary dashboards

### Key Workflows Identified
1. **Authentication** — Email/password registration and login
2. **Group Management** — Create groups, add/remove members by email
3. **Expense Management** — Add expenses with 4 split types, edit, delete
4. **Balance Tracking** — Per-group balances and overall summary
5. **Settlements** — Record payments to settle debts
6. **Expense Chat** — Real-time comment thread on each expense

### Product Assumptions
- Single currency (no multi-currency conversion)
- One payer per expense (no multi-payer)
- All expenses belong to a group (no friend-to-friend)
- Settlements are manual recordings (no payment gateway)
- No email verification or notifications

---

## 2. Architecture

### Tech Stack
| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Shiraz color theme |
| Deploy (API) | Railway |
| Deploy (UI) | Vercel |

### Database Schema
6 tables: `users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`, `expense_comments`

- UUIDs as primary keys
- Cascading deletes on group/expense removal
- Unique constraint on (group_id, user_id) in group_members
- Decimal(12,2) for monetary amounts

See `AI_CONTEXT.md` §5 for full schema.

### API Design
RESTful API with these resource groups:
- `/api/auth/*` — Register, login, profile
- `/api/users/*` — Search users
- `/api/groups/*` — CRUD groups + member management
- `/api/groups/:id/expenses/*` — CRUD expenses
- `/api/expenses/:id/comments/*` — Chat/comments
- `/api/groups/:id/balances` — Group balances
- `/api/balances` — Overall user balances
- `/api/groups/:id/settlements` — Record settlements

See `AI_CONTEXT.md` §6 for full API table.

### Frontend Structure
- Next.js App Router with file-based routing
- Component-driven architecture (ui/, layout/, groups/, expenses/, balances/, chat/)
- Context API for auth state
- Custom hooks for auth and socket management
- Axios for API calls, Socket.io client for real-time

### Deployment Approach
1. **Backend** → Railway (Node.js service + PostgreSQL addon)
2. **Frontend** → Vercel (auto-deploy from GitHub)
3. **Environment**: Separate .env for dev and production

---

## 3. AI Collaboration Process

### How the AI Was Instructed
- AI was given the full assignment prompt and told to act as a junior engineer
- AI was instructed NOT to assume requirements and to ask questions first
- AI asked 20+ questions across product scope, tech stack, UX, and architecture

### Questions the AI Asked
1. Target users and product scope
2. Backend framework choice
3. Database preference (PostgreSQL vs MySQL)
4. Authentication approach (JWT vs sessions)
5. Real-time technology (Socket.io vs SSE vs polling)
6. Group invite mechanism
7. Edge cases (removing members with balances)
8. Split method implementation details
9. Frontend framework and styling
10. Deployment targets

### How Answers Shaped the Plan
- User chose Node.js + Next.js + Tailwind
- User specified Shiraz color theme
- User wanted professional UI inspired by 21.dev
- User wanted backend-first development approach
- Assignment requirements drove feature scope

### AI_CONTEXT.md Maintenance
- Created at project start with full scope
- Updated after each major decision
- Updated during implementation when schema/logic changed
- Serves as the single source of truth

---

## 4. Build Phases

### Phase 1: Backend Foundation (Day 1 - First Half)
- [x] Project setup, AI_CONTEXT.md, BUILD_PLAN.md
- [ ] Initialize Node.js + Express + Prisma
- [ ] Define Prisma schema
- [ ] Run migrations
- [ ] Implement auth (register, login, JWT middleware)

### Phase 2: Backend Features (Day 1 - Second Half)
- [ ] Group CRUD + member management
- [ ] Expense CRUD + split calculation logic
- [ ] Balance calculation engine
- [ ] Settlement recording
- [ ] Expense comments + Socket.io real-time

### Phase 3: Frontend Foundation (Day 2 - First Half)
- [ ] Next.js setup with Tailwind + Shiraz theme
- [ ] Auth pages (login, register)
- [ ] Dashboard layout (sidebar, navbar)
- [ ] Group pages (list, detail, create)

### Phase 4: Frontend Features + Polish (Day 2 - Second Half)
- [ ] Expense forms with split selector UI
- [ ] Balance visualization
- [ ] Settle up flow
- [ ] Real-time chat integration
- [ ] Responsive design + animations
- [ ] Deploy to Railway + Vercel

---

## 5. Trade-offs

### What We Simplified
- Single currency only
- One payer per expense
- Greedy debt simplification (not optimal minimum transactions)
- No expense categories or icons

### What We Hardcoded
- Currency symbol (₹ or $)
- Default split type (equal)

### What We Avoided
- Email verification / password reset
- Push notifications
- Receipt scanning / OCR
- Multi-currency conversion
- Payment gateway integration

### What We'd Improve With More Time
- Add expense categories with icons
- Implement optimal debt simplification (graph-based)
- Add email notifications
- Add Google OAuth
- Dark mode toggle
- PWA support for mobile
- Comprehensive test suite
- Friend-to-friend expenses (non-group)
- Activity feed / timeline

---

*This plan is a living document. Updated as the project evolves.*
