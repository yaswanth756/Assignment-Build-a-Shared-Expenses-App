# AI_CONTEXT.md — SplitBuddy (Splitwise Clone)

> **This file is the single source of truth for the entire project.**
> Another developer or AI agent should be able to rebuild the same app from this file.
> Last updated: 2026-06-12

---

## 1. Product Understanding

### What is Splitwise?
Splitwise is a bill-splitting app that lets users track shared expenses with friends, family, or groups. It calculates who owes whom and simplifies debts so users can settle up easily.

### Core Workflows (Reverse Engineered)
1. **Sign Up / Login** → Email + password
2. **Create Group** → Name, description, add members by email
3. **Add Expense** → Enter amount, select payer, choose split method, assign shares
4. **View Balances** → Group-wise and overall individual balances
5. **Settle Up** → Record a payment between two users to clear a debt
6. **Expense Chat** → Comment thread on each expense with real-time updates
7. **Activity Feed** → See recent expenses and settlements

### Product Assumptions
- Users are friends/colleagues splitting everyday expenses (food, rent, travel)
- No multi-currency support (single currency — INR or USD)
- No recurring expenses
- No receipt scanning or OCR
- No email/push notifications
- No expense categories beyond a simple label

---

## 2. Product Scope (MVP)

### In Scope (Must Have)
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

### Out of Scope
- Multi-currency
- Recurring expenses
- Receipt scanning / OCR
- Email notifications / push notifications
- Expense categories with icons
- Friend-to-friend expenses (non-group) — all expenses are group-based
- Payment gateway integration (settlements are manual recordings)
- Export to CSV/PDF
- Dark mode toggle (we use a fixed premium theme)

---

## 3. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend Runtime | Node.js (v18+) | Fast, async, JavaScript ecosystem |
| Backend Framework | Express.js | Industry standard, lightweight, flexible |
| Database | PostgreSQL | Robust relational DB, required by assignment |
| ORM | Prisma | Type-safe queries, clean migrations, great DX |
| Authentication | JWT + bcrypt | Stateless auth, secure password hashing |
| Real-time | Socket.io | WebSocket library for expense chat |
| Frontend | Next.js 14 (App Router) | React-based, SSR, file-based routing |
| Styling | Tailwind CSS v3 | Utility-first, fast iteration |
| Color Theme | Shiraz (wine-red palette) | Custom brand identity |
| Deployment (Backend) | Railway | Free tier, PostgreSQL addon |
| Deployment (Frontend) | Vercel | Native Next.js support |
| API Protocol | REST | Standard, simple, well-understood |

---

## 4. Color Theme — Shiraz Palette

```css
--color-shiraz-50: #fef2f3;
--color-shiraz-100: #fee5e7;
--color-shiraz-200: #fbd0d5;
--color-shiraz-300: #f8a9b2;
--color-shiraz-400: #f47889;
--color-shiraz-500: #ea4964;
--color-shiraz-600: #d6284d;
--color-shiraz-700: #ac1a3d;
--color-shiraz-800: #971a3c;
--color-shiraz-900: #821939;
--color-shiraz-950: #48091a;
```

### UI Design Principles
- **Inspiration**: 21.dev components, Google/Swiggy/Zomato level polish
- **Philosophy**: Premium, production-grade, customer-centric UX
- **Typography**: Inter (Google Fonts) — clean, modern, highly readable
- **Layout**: Card-based UI, generous whitespace, subtle shadows
- **Animations**: Smooth micro-animations on hover, transitions on navigation
- **Glassmorphism**: Subtle backdrop-blur on overlays and modals
- **Color Strategy**: Shiraz-600 as primary CTA, Shiraz-950 as dark background accents, neutral grays for text and borders

---

## 5. Database Schema

### Tables

#### `users`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default uuid_generate_v4() |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `groups`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | NULLABLE |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `group_members`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| group_id | UUID | FK → groups.id, ON DELETE CASCADE |
| user_id | UUID | FK → users.id |
| role | ENUM('admin','member') | DEFAULT 'member' |
| joined_at | TIMESTAMP | DEFAULT NOW() |
| | | UNIQUE(group_id, user_id) |

#### `expenses`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| group_id | UUID | FK → groups.id, ON DELETE CASCADE |
| description | VARCHAR(255) | NOT NULL |
| amount | DECIMAL(12,2) | NOT NULL |
| paid_by | UUID | FK → users.id |
| split_type | ENUM('equal','unequal','percentage','share') | NOT NULL |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `expense_splits`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| expense_id | UUID | FK → expenses.id, ON DELETE CASCADE |
| user_id | UUID | FK → users.id |
| amount | DECIMAL(12,2) | NOT NULL (calculated share in $) |
| percentage | DECIMAL(5,2) | NULLABLE (for percentage split) |
| shares | INTEGER | NULLABLE (for share-based split) |

#### `settlements`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| group_id | UUID | FK → groups.id |
| paid_by | UUID | FK → users.id (person paying) |
| paid_to | UUID | FK → users.id (person receiving) |
| amount | DECIMAL(12,2) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `expense_comments`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| expense_id | UUID | FK → expenses.id, ON DELETE CASCADE |
| user_id | UUID | FK → users.id |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 6. API Design (REST)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/search?email= | Search users by email |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/groups | Create group |
| GET | /api/groups | Get user's groups |
| GET | /api/groups/:id | Get group details |
| PUT | /api/groups/:id | Update group |
| DELETE | /api/groups/:id | Delete group (admin only) |
| POST | /api/groups/:id/members | Add member by email |
| DELETE | /api/groups/:id/members/:userId | Remove member |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/groups/:groupId/expenses | Create expense |
| GET | /api/groups/:groupId/expenses | List group expenses |
| GET | /api/expenses/:id | Get expense details |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |

### Expense Comments (Chat)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses/:id/comments | Get comments |
| POST | /api/expenses/:id/comments | Add comment |

> **Real-time**: Socket.io events for new comments broadcast to all users viewing that expense.

### Balances
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/groups/:id/balances | Group-wise balances |
| GET | /api/balances | Overall user balance summary |

### Settlements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/groups/:groupId/settlements | Record a settlement |
| GET | /api/groups/:groupId/settlements | List settlements |

---

## 7. Balance Calculation Logic

### Algorithm
1. For each group, iterate all expenses
2. For each expense, the payer is owed money by each split participant
3. Net balance = SUM(what you paid) - SUM(what you owe)
4. Subtract settlements already made
5. **Simplify debts**: Use greedy algorithm — match largest creditor with largest debtor

### Example
- Expense: $90 dinner, paid by Alice, split equally among Alice, Bob, Charlie
- Each person's share = $30
- Bob owes Alice $30, Charlie owes Alice $30
- Alice's net = +$60, Bob's net = -$30, Charlie's net = -$30

---

## 8. Project Structure (Monorepo)

```
splitbuddy/
├── AI_CONTEXT.md
├── BUILD_PLAN.md
├── README.md
├── backend/
│   ├── package.json
│   ├── .env
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.js          # Express app entry point
│       ├── config/
│       │   └── db.js         # Prisma client singleton
│       ├── middleware/
│       │   ├── auth.js       # JWT verification
│       │   └── validate.js   # Request validation
│       ├── routes/
│       │   ├── auth.js
│       │   ├── groups.js
│       │   ├── expenses.js
│       │   ├── balances.js
│       │   └── settlements.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── groupController.js
│       │   ├── expenseController.js
│       │   ├── balanceController.js
│       │   └── settlementController.js
│       ├── services/
│       │   ├── balanceService.js   # Balance calculation engine
│       │   └── splitService.js     # Split calculation logic
│       ├── socket/
│       │   └── chat.js        # Socket.io expense chat handler
│       └── utils/
│           ├── errors.js      # Custom error classes
│           └── helpers.js
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── public/
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── layout.js
│   │   │   ├── page.js        # Landing / redirect
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   ├── groups/
│   │   │   │   ├── [id]/
│   │   │   │   └── new/
│   │   │   └── expenses/
│   │   │       └── [id]/
│   │   ├── components/
│   │   │   ├── ui/            # Reusable: Button, Card, Input, Modal, Avatar
│   │   │   ├── layout/        # Sidebar, Navbar, Footer
│   │   │   ├── groups/        # GroupCard, MemberList, AddMemberModal
│   │   │   ├── expenses/      # ExpenseForm, SplitSelector, ExpenseCard
│   │   │   ├── balances/      # BalanceSummary, DebtCard
│   │   │   └── chat/          # ChatThread, ChatMessage
│   │   ├── lib/
│   │   │   ├── api.js         # Axios instance + API functions
│   │   │   └── socket.js      # Socket.io client
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useSocket.js
│   │   └── context/
│   │       └── AuthContext.js
│   └── globals.css
└── .gitignore
```

---

## 9. Frontend Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Landing | / | Hero + CTA → redirect if logged in |
| Login | /login | Email + password form |
| Register | /register | Name, email, password form |
| Dashboard | /dashboard | Groups list, overall balance summary |
| Create Group | /groups/new | Group name, description, add members |
| Group Detail | /groups/[id] | Expenses list, members, group balances |
| Add Expense | /groups/[id]/add-expense | Expense form with split selector |
| Expense Detail | /expenses/[id] | Expense info + chat thread |
| Settle Up | /groups/[id]/settle | Record a payment |

---

## 10. Deployment Plan

### Backend (Railway)
- PostgreSQL addon on Railway
- Node.js service connected to GitHub
- Environment variables: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN

### Frontend (Vercel)
- Connect GitHub repo, auto-deploy from `frontend/` directory
- Environment variable: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL

---

## 11. Testing Plan

### Backend
- Manual API testing with Postman/Thunder Client
- Test all split calculation edge cases
- Test balance computation accuracy
- Test auth flows (register, login, protected routes)

### Frontend
- Manual E2E testing across all screens
- Test responsive layouts (mobile, tablet, desktop)
- Test real-time chat updates

---

## 12. Known Limitations & Trade-offs

| Trade-off | Decision | Reason |
|-----------|----------|--------|
| No email verification | Skip | Time constraint, MVP focus |
| No push notifications | Skip | Out of scope for 2-day build |
| No multi-currency | Skip | Complexity, out of scope |
| Single payer per expense | Yes | Splitwise default, simpler |
| No friend-to-friend expenses | Groups only | Simpler data model |
| Simplified debt algorithm | Greedy matching | Good enough for MVP |
| No expense categories | Simple text description | Time constraint |
| No image uploads | Skip | Time constraint |

---

## 13. Implementation Log

| Date | Phase | What Changed |
|------|-------|-------------|
| 2026-06-12 | Planning | Initial AI_CONTEXT.md created with full scope |
| 2026-06-12 | Backend | Starting backend implementation |
| 2026-06-12 | Frontend | Initialized Next.js app, configured Shiraz high-end editorial design system (Anton/Inter fonts, 5rem radius, noise overlay), and built out core layout UI (Dashboard, Groups, Expenses). |
| 2026-06-12 | Integration | Configured Axios client, AuthContext, wired Login/Register pages, connected Dashboard to API endpoints, and finalized the Landing Page design sections. |
| 2026-06-12 | Dynamic Polish | Made Group details and Add Expense pages fully dynamic. Generated and embedded premium 3D hero image in Landing Page. App is production-ready. |

---

## 14. Key Prompts Used

### Prompt 1 — Initial Setup
```
"You are a junior engineer helping me complete an internship assignment.
The assignment is to reverse engineer Splitwise, scope a realistic 2-day version,
and build a working deployed app..."
```
*(Full prompt from assignment pasted)*

### Prompt 2 — Tech Decisions
```
"Backend: Node.js + Express, Frontend: Next.js + Tailwind CSS,
Color theme: Shiraz palette, UI inspiration: 21.dev, professional grade"
```

---

*This file will be updated continuously as the project evolves.*
