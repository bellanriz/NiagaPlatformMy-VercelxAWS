# Niaga Platform

> B2B cash flow intelligence platform for finance teams — built with Next.js 14, Amazon Aurora PostgreSQL, and deployed on Vercel.

Niaga Platform centralizes accounts receivable, accounts payable, invoice management, and cash flow forecasting for SMBs and mid-market companies. Production-ready in minutes.

---

## Features

- **Invoice Management** — Full lifecycle from draft → sent → paid with line items, tax, and discounts
- **Client Profiles** — Payment history, risk scoring, AR aging, and outstanding balances
- **Accounts Payable** — Track expenses by vendor and category with approval workflow
- **Payment Recording** — Transactional payment capture with automatic invoice balance sync
- **Cash Flow Analytics** — 6-month inflow/outflow charts with 3-month moving average forecast
- **AR Aging Reports** — Buckets: current, 1–30, 31–60, 61–90, 90+ days
- **Multi-tenant** — Org-scoped data isolation, role-based access (owner/admin/member/viewer)
- **Secure Auth** — NextAuth v5 with JWT sessions and bcrypt password hashing

---

## Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | Next.js 14 App Router, TypeScript         |
| Styling    | Tailwind CSS, Radix UI, shadcn/ui         |
| Charts     | Recharts                                  |
| Auth       | NextAuth v5 (Credentials + JWT)           |
| Database   | Amazon Aurora PostgreSQL (via `pg`)       |
| Deployment | Vercel                                    |
| Validation | Zod + React Hook Form                     |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/niaga-platform.git
cd niaga-platform/finflow
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-AURORA-ENDPOINT:5432/finflow"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up Aurora PostgreSQL

Create an Aurora PostgreSQL cluster in [AWS RDS](https://console.aws.amazon.com/rds):

1. Engine: Aurora (PostgreSQL-Compatible)
2. Create a database named `finflow`
3. Copy the cluster endpoint to `DATABASE_URL`

### 4. Run migrations and seed

```bash
npm run db:migrate   # Creates all tables
npm run db:seed      # Loads demo data
```

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

Demo login: `admin@acme.com` / `password123`

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Set environment variables in the Vercel dashboard:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your Vercel domain)
- `NEXT_PUBLIC_APP_URL` (your Vercel domain)

---

## Database Schema

```
organizations   — tenants (multi-tenant root)
users           — org members with roles
clients         — customer profiles with risk scores
invoices        — full invoice lifecycle with generated amount_due
invoice_items   — line items per invoice
payments        — payment records with transactional balance sync
expenses        — accounts payable / vendor expenses
cashflow_forecasts — monthly forecast storage
```

---

## Project Structure

```
finflow/
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Login page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── invoices/         # Invoice CRUD
│   │   │   ├── clients/          # Client management
│   │   │   ├── expenses/         # Expense tracking
│   │   │   ├── cashflow/         # Cash flow analytics
│   │   │   └── settings/         # Account & org settings
│   │   └── api/                  # REST API routes
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   ├── layout/               # Sidebar, header
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── invoices/             # Invoice components
│   │   ├── clients/              # Client components
│   │   ├── expenses/             # Expense components
│   │   ├── cashflow/             # Chart components
│   │   └── settings/             # Settings panels
│   ├── lib/
│   │   ├── auth.ts               # NextAuth config
│   │   ├── db.ts                 # pg Pool wrapper
│   │   └── utils.ts              # Formatters, helpers
│   └── types/index.ts            # TypeScript interfaces
├── scripts/
│   ├── migrate.js                # DB migration runner
│   └── seed.js                   # Demo data seeder
└── .env.example
```

---

## License

MIT
