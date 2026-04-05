# AHTTAK Membership System – Project Overview

A **membership and organization management platform** for organizations (e.g. cooperatives, associations) to manage members, events, payments, savings, and contributions. Built with **Django (backend)** and **React + TypeScript + Tailwind CSS (frontend)**.

---

Table of Contents
1. [Architecture](#architecture)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Backend – Apps & Models](#backend--apps--models)
5. [API Endpoints](#api-endpoints)
6. [Frontend – Pages & Features](#frontend--pages--features)
7. [Authentication & Access](#authentication--access)
8. [Configuration](#configuration)

---

Architecture

```
┌─────────────────────┐          ┌─────────────────────┐
│   React Frontend    │  HTTP    │   Django Backend    │
│  (localhost:5173)   │ ───────► │  (localhost:8000)   │
│  TypeScript+Tailwind│  /api/*  │  REST + Admin       │
└─────────────────────┘          └─────────┬───────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │   PostgreSQL        │
                                │   (or SQLite)       │
                                └─────────────────────┘
```

- **Frontend**: Single-page app at `http://localhost:5173`. Logged-in users see a sidebar with all modules.
- **Backend**: REST API at `http://127.0.0.1:8000/api/` and Django Admin at `/admin/`.
- **Database**: PostgreSQL by default (SQLite optional).
- **Auth**: Token-based for API; sessions for Admin. Same Django users for both.

---

## Quick Start

### 1. Database (PostgreSQL)

```bash
psql -U postgres -c "CREATE DATABASE ahtak;"
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env: set DB_PASSWORD (and DB_USER if needed)
```

### 3. Backend

```bash
cd ahtak
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # Username & password for login
python manage.py runserver
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Access

| Where | URL | Login |
|-------|-----|-------|
| **Frontend** | http://localhost:5173 | Superuser username & password |
| **Admin** | http://127.0.0.1:8000/admin/ | Same superuser |
| **API** | http://127.0.0.1:8000/api/ | Token from `POST /api/auth/token/` |

---

## Project Structure

```
ahtak/
├── ahtak/                 # Django project
│   ├── settings.py
│   ├── urls.py
│   └── celery.py
├── core/                  # Shared: audit log, user profile, PDF utils
├── members/               # Members, membership types, documents
├── events/                # Events, registrations, check-ins
├── payments/              # Payments, receipts
├── savings/               # Savings accounts, transactions
├── contributions/         # Contribution types, monthly contributions
├── notifications/         # Email helpers, Celery tasks
├── reports/               # Excel/PDF report exports
├── frontend/              # React app
│   ├── src/
│   │   ├── pages/         # Main screens
│   │   ├── components/    # Layout, ProtectedRoute
│   │   ├── contexts/      # AuthContext
│   │   └── lib/           # api.ts (API client)
│   └── package.json
├── manage.py
├── requirements.txt
├── .env.example
└── setup_db.sh
```

---

## Backend – Apps & Models

### `core`
- **AuditLog** – User actions, model changes, IP, timestamps
- **UserProfile** – Role (super_admin, admin, loan_officer, member), optional link to Member

### `members`
- **MembershipType** – Regular, Associate, Lifetime, Student, Corporate (fees, validity)
- **Member** – Full KYC (name, DOB, ID, KRA, contacts, employment, next of kin), status (pending/active/expired/etc), membership_expiry
- **MemberDocument** – Photo, ID front/back, KRA PIN, etc.

### `events`
- **Event** – Title, description, dates, venue, pricing (member/non-member, early bird), capacity
- **EventRegistration** – Ticket (TKT-XXXXXXXX), member or guest, amount, paid flag
- **EventCheckIn** – Check-in record (QR/manual) per registration

### `payments`
- **Payment** – Receipt (RCP-000001), member, type (registration, renewal, event, savings, contribution, etc.), amount, method (cash/mpesa)

### `savings`
- **SavingsAccountType** – Regular, Fixed Deposit, Emergency Fund
- **SavingsAccount** – Per member per type, balance
- **SavingsTransaction** – Deposit, withdrawal, interest

### `contributions`
- **ContributionType** – Welfare, Development, Building Fund
- **MonthlyContribution** – Per member per type per month
- **ContributionPayment** – Links contribution to Payment

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/token/` | Login → `{token}` |
| GET | `/api/auth/me/` | Current user, role, member_id |
| GET | `/api/dashboard/kpis/` | KPI counts (members, events, savings, payments, etc.) |
| | **Members** | |
| GET/POST | `/api/members/` | List, create members |
| GET/PATCH | `/api/members/{id}/` | Get, update member |
| POST | `/api/members/{id}/approve/` | Approve pending member, send welcome email |
| GET | `/api/members/{id}/id_card/` | Download member ID card PDF |
| GET/POST | `/api/documents/` | List, upload member documents |
| GET | `/api/membership-types/` | List membership types |
| | **Events** | |
| GET/POST | `/api/events/` | List, create events |
| GET | `/api/registrations/` | List registrations |
| POST | `/api/registrations/` | Register for event |
| POST | `/api/registrations/check-in/` | Check in by `ticket_number` |
| | **Payments** | |
| GET/POST | `/api/payments/` | List, create payments |
| GET | `/api/payments/{id}/receipt_pdf/` | Download receipt PDF |
| POST | `/api/payments/{id}/email_receipt/` | Email receipt to member |
| | **Savings** | |
| GET | `/api/account-types/`, `/api/accounts/`, `/api/transactions/` | Savings data |
| | **Contributions** | |
| GET | `/api/contributions/types/`, `/api/contributions/monthly/` | Contribution data |
| | **Reports** | |
| GET | `/api/reports/` | List reports |
| GET | `/api/reports/members/excel/` | Members Excel (query: start_date, end_date) |
| GET | `/api/reports/payments/excel/` | Payments Excel |
| GET | `/api/reports/summary/pdf/` | Summary PDF |

---

## Frontend – Pages & Features

| Route | Page | What you can do |
|-------|------|------------------|
| `/login` | Login | Enter Django username & password |
| `/` | Dashboard | View KPIs (members, events, savings, payments, defaulters) |
| `/members` | Members | List, search, filter by status; "Add member" |
| `/members/new` | Add member | Create member (name, email, phone, ID, KRA, membership type) |
| `/members/:id` | Member detail | View info; approve (if pending); download ID card PDF; upload documents (photo, ID, KRA) |
| `/membership-types` | Membership types | View types (fees, validity) – configure in Admin |
| `/events` | Events | List events; "Register" for published events |
| `/events/:id/register` | Event registration | Register as member or guest; dietary/special needs |
| `/events/:id/ticket/:regId` | Ticket | View ticket number for check-in |
| `/check-in` | Check-in | Enter ticket number to record attendance |
| `/payments` | Payments | List payments; PDF download; Email receipt |
| `/savings` | Savings | List savings accounts |
| `/contributions` | Contributions | View contribution types and monthly contributions |
| `/reports` | Reports | Date range; download Members Excel, Payments Excel, Summary PDF |

**Sidebar**: "My account" appears when the user has a linked member (role = member); links to their member profile.

---

## Authentication & Access

- **Frontend login**: Uses `POST /api/auth/token/` with username & password. Token stored in `localStorage`. Sent as `Authorization: Token <token>` on API calls.
- **Admin login**: Standard Django admin session at `/admin/`.
- **Same user**: One superuser can log in to both frontend and admin.
- **Protected routes**: All app routes (except `/login`) require authentication. Unauthenticated users are redirected to login.
- **Role-based access**: See [ROLES.md](./ROLES.md) for role definitions (super_admin, admin, loan_officer, member). Nav and API are filtered by role.

---

## Configuration

### Environment (`.env`)

```env
DB_ENGINE=postgresql      # or sqlite
DB_NAME=ahtak
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### Commands

| Command | Purpose |
|---------|---------|
| `python manage.py migrate` | Apply migrations |
| `python manage.py createsuperuser` | Create admin/frontend user |
| `python manage.py backup_db` | Backup DB + media to `backup/` |
| `celery -A ahtak worker -l info` | Run Celery worker |
| `celery -A ahtak beat -l info` | Run Celery beat (scheduled tasks) |

Celery Tasks (optional)
- **check_membership_expiry** – Daily: 90/60/30/7-day email reminders; set Pending Renewal / Expired
- **generate_monthly_contributions** – Daily: Create `MonthlyContribution` for active members

---

First-Time Setup Checklist

1. Create PostgreSQL database `ahtak`
2. Copy `.env.example` to `.env` and set `DB_PASSWORD`
3. `pip install -r requirements.txt`
4. `python manage.py migrate`
5. `python manage.py createsuperuser`
6. Add Membership types, Contribution types, Savings account types in Django Admin (optional but useful)
7. Run backend: `python manage.py runserver`
8. Run frontend: `cd frontend && npm run dev`
9. Open http://localhost:5173 and log in with superuser credentials
