# CRM System — Complete Project Documentation

## What Is This Project?

This is a **Customer Relationship Management (CRM) System** — a web application that helps a sales team manage their entire sales process from the first contact with a potential customer all the way through closing a deal and getting paid.

Think of it as a single place where the sales team can:
- Track every person and company they are talking to
- Manage potential sales opportunities
- Assign tasks and reminders to themselves or teammates
- Write notes against any customer record
- See the full history of what has happened
- Subscribe to a paid plan to use the platform

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TanStack React Query, Zustand, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL with Sequelize ORM |
| **Auth** | JWT (access token 15 min + refresh token 7 days) |
| **Real-time** | Socket.IO (live notifications) |
| **File uploads** | Cloudinary |
| **Payments** | Razorpay |
| **Emails** | Brevo (Sendinblue) |

---

## How the Whole System Works (Simple Flow)

```
User visits the app
       ↓
Registers an account → verifies email via OTP
       ↓
Logs in → gets an access token (JWT, 15 min) + refresh token (7 days)
       ↓
Access token is sent with every API request in the Authorization header
       ↓
When access token expires → frontend silently refreshes it using the refresh token
       ↓
If refresh token also expires → user is logged out automatically
```

Once logged in, the user lands on the **Dashboard** and can use all CRM features based on their **Role**.

---

## Authentication & Security

### Registration
1. User signs up with name, email, and password.
2. An OTP (One-Time Password) is sent to their email.
3. They enter the OTP to verify their account.
4. Their account status changes from `pending` → `active`.

### Login
1. User enters email and password.
2. Server issues two tokens:
   - **Access Token** (JWT, expires in 15 minutes) — sent with every API call.
   - **Refresh Token** (stored in DB, expires in 7 days) — used only to get a new access token.
3. The frontend stores both tokens in `localStorage` via Zustand's persist middleware.

### Auto Token Refresh
The Axios HTTP client has an interceptor: whenever an API call returns `401 Unauthorized` (expired access token), the frontend automatically calls `POST /auth/refresh`, gets a new access token, and retries the original request. The user never sees a login screen unless the refresh token itself expires.

### Password Reset
User clicks "Forgot Password" → receives a 6-digit OTP by email → enters OTP + new password → password is reset.

---

## Roles & Permissions

Every user has exactly **one Role**. Roles control what the user can see and do.

### System Roles

| Role | Who it is | What they can access |
|---|---|---|
| `super_admin` | Platform owner | Everything — all users, all data, admin panel |
| `admin` | Company administrator | All CRM data, can manage users and roles |
| `manager` | Team manager | All CRM data for the team, can assign leads/deals |
| `customer` | Regular sales rep | Only their own records (leads, deals, companies they created) |

### How Permissions Work
- Each Role has a list of **Permissions** (e.g., `leads.create`, `deals.delete`, `users.manage`).
- The `authorize()` middleware on each route checks if the logged-in user's role slug is in the allowed list.
- **Data scoping**: `super_admin`, `admin`, and `manager` see ALL records. A `customer` only sees records where they are the `owner_id` (the creator).

---

## Core CRM Entities

### 1. Company
A **Company** is an organisation that the sales team deals with — e.g., "Acme Corp", "TechStart Pvt Ltd".

**Key fields:** name, website, industry, company size, annual revenue, phone, email, address, status (active / inactive), tags.

**Purpose:** Group contacts and deals under one organisation. When you view a company, you can see all the contacts who work there and all the deals linked to it.

---

### 2. Contact
A **Contact** is a real person — an individual who works at a company and is someone the sales team communicates with.

**Key fields:** first name, last name, email, phone, mobile, job title, department, linked company, source, notes, status, avatar.

**Purpose:** Track the people you are actually talking to. A contact belongs to a company. One company can have many contacts (e.g., a CEO, a procurement manager, a technical lead — all at the same company).

---

### 3. Lead
A **Lead** is a potential customer who has shown some interest but has NOT yet been qualified as a real sales opportunity.

**Key fields:** name, email, phone, company name, job title, source (where they came from — website, referral, ads, event, etc.), status, priority, estimated value, score, assigned salesperson, tags, notes.

**Lead Statuses:**
- `new` → just captured
- `contacted` → the sales rep has reached out
- `qualified` → confirmed to be a real opportunity
- `unqualified` → not a fit, dead end
- `converted` → turned into a Deal
- `lost` → no longer interested

**Converting a Lead:**
When a lead is qualified, you can **convert** it with one click. The system automatically:
1. Creates a **Company** record from the lead's company name.
2. Creates a **Contact** record from the lead's personal details.
3. Creates a **Deal** record with the provided deal title and value.
4. Marks the lead as `converted` and links it to the new deal.

**Other Lead Features:**
- **Bulk Import**: Upload a CSV of leads and they are all created at once.
- **Export**: Download all leads as a CSV file.
- **Stats**: See how many leads are in each status, and which sources bring the most leads.

---

### 4. Deal
A **Deal** is a confirmed sales opportunity — a potential sale that is actively being worked on.

**Key fields:** title, description, value (money amount), currency, stage, probability (% chance of winning), expected close date, linked company, linked contact, linked lead (if converted from a lead), assigned salesperson, tags.

**Deal Stages (Pipeline):**
```
Lead → Qualified → Proposal Sent → Negotiation → Won / Lost
```

**Kanban Board:** Deals are displayed as cards in a drag-and-drop Kanban board. You can drag a deal card from one stage column to another to update its stage. Each column shows the number of deals and the total value of deals in that stage.

**List View:** You can also switch to a simple list view of all deals.

---

### 5. Task
A **Task** is a to-do item or reminder — something a team member needs to do.

**Key fields:** title, description, type, status, priority, due date, reminder time, assigned user, linked record (can be linked to a Lead, Deal, Contact, or Company), recurring flag, recurrence pattern.

**Task Types:** call, email, meeting, follow-up, other.

**Task Statuses:** pending → in progress → completed / cancelled.

**Task Priority:** low, medium, high, urgent.

**Purpose:** Tasks keep the team organised. For example: "Call John Smith on Thursday", "Send proposal to Acme Corp by Friday", "Follow up with the TechStart deal next Monday."

Tasks can be **linked to any CRM record** (a specific lead, deal, contact, or company) so you always know why the task exists.

---

### 6. Note
A **Note** is a free-text comment or observation that a user writes against a CRM record.

**Key fields:** title (optional), content (required), linked record type, linked record ID, pinned (yes/no).

**Purpose:** Notes capture context that does not fit in structured fields. Examples: "Spoke to Jane — she said their budget is ₹5 lakh", "The client mentioned they are also evaluating Competitor X", "Decision will be made next quarter."

Notes must always be linked to a Lead, Deal, Contact, or Company. Pinned notes appear at the top.

---

### 7. Activity (Audit Log)
An **Activity** is an automatic record of something that happened in the system. Users do not create activities manually — the system creates them automatically.

**Examples of logged activities:**
- Lead assigned to a sales rep
- Lead converted to a deal
- Subscription activated

**Key fields:** type (e.g., `lead.assigned`), title (human-readable description), linked record, the user who performed the action, timestamp, extra metadata (JSON).

**Purpose:** The Activity feed on the Dashboard shows a live log of recent actions across the team, like a news feed for your CRM.

---

## Billing System

The platform itself is a **SaaS product** — users pay to use it. Billing is handled via **Razorpay** (India's leading payment gateway).

### Plans
The admin creates subscription Plans with:
- Name, price, currency (default INR), billing interval (monthly / yearly).
- Trial days (free trial period).
- Features list and limits (stored as JSON — can define things like max leads, max users, etc.).

### Subscription Flow
1. User goes to the **Billing** page and sees available plans.
2. They click "Subscribe" → Razorpay payment modal opens.
3. User pays → Razorpay sends a webhook confirmation to the backend.
4. Backend verifies the payment signature, activates the subscription, creates an **Invoice**, and records the **Payment**.
5. User receives a confirmation email with the invoice details.

**Subscription Statuses:** trial → active → past_due → canceled → expired.

### Free Plans
If a plan has price = 0, subscription is activated immediately without any payment flow.

### Invoices & Payments
- Every successful payment generates an `Invoice` record.
- Every Razorpay transaction is stored as a `Payment` record with the Razorpay order ID, payment ID, and signature for audit purposes.

---

## Support System (Tickets)

Users can raise support tickets if they have a problem or question.

**Ticket flow:**
1. User clicks "New Ticket" on the Support page.
2. They fill in subject, description, and priority.
3. A unique ticket number (e.g., `TKT-20240001`) is generated automatically.
4. Admin/support team sees the ticket, can reply via messages, and updates the status.

**Ticket Statuses:** open → in progress → resolved → closed.

Users can also read **FAQs** that the admin publishes on the support page.

---

## Notifications

The system sends **real-time notifications** to users via **Socket.IO** (WebSocket connection).

- When the user logs in, a Socket.IO connection is established using their access token.
- The server can push a notification to a specific user's browser instantly without the user needing to refresh the page.
- Notifications appear in the header bell icon with an unread count badge.
- Users can mark individual notifications as read or mark all as read.
- Notifications are also stored in the database so they persist across sessions.

---

## Dashboard

The Dashboard gives a quick overview of the sales pipeline. It shows:

| Metric | Description |
|---|---|
| Total Leads | Total number of leads in the system |
| Active Deals | Deals not yet won or lost |
| Won Deals | Deals marked as won |
| Lost Deals | Deals marked as lost |
| Pending Tasks | Tasks that are pending or in progress |
| Month Revenue | Total value of deals won in the last 30 days |
| Conversion Rate | % of leads that were converted to deals |

**Charts:**
- **Sales Chart** — monthly revenue bar chart (last 6 months of won deals).
- **Lead Sources** — pie/bar chart showing which channels (website, ads, referral, etc.) bring the most leads.
- **Recent Activities** — a live activity feed showing the last 20 actions taken by anyone on the team.

> **Data scoping on the Dashboard:** Admins and managers see the full team's numbers. Regular sales reps only see their own data.

---

## Announcements

Admins can publish **Announcements** (e.g., "System maintenance on Sunday", "New feature: bulk lead import is now live"). Announcements have a type (info / success / warning / critical), target audience (all / customers / admins), and an expiry date. Active announcements are shown across the app.

---

## Profile & Settings

### User Profile
Each user can:
- Update their first name, last name, phone number.
- Upload a profile avatar (stored on Cloudinary).
- Change their password.

### Settings
The admin can configure global settings for the platform (stored as key-value pairs in the `settings` table).

---

## API Overview

All API endpoints are prefixed with `/api/v1/`. The full interactive API documentation is available at `/api/v1/docs` (Swagger UI).

| Endpoint group | Purpose |
|---|---|
| `/auth` | Register, login, verify email, refresh token, logout, forgot/reset password |
| `/users` | User management (admin), self profile update |
| `/roles` | Role and permission management (admin) |
| `/companies` | CRUD for companies |
| `/contacts` | CRUD for contacts |
| `/leads` | CRUD for leads + assign, convert, bulk import, export CSV, stats |
| `/deals` | CRUD for deals + kanban view, move stage, pipeline stats |
| `/tasks` | CRUD for tasks |
| `/notes` | CRUD for notes |
| `/activities` | Read-only activity feed |
| `/attachments` | File attachments on CRM records |
| `/subscriptions` | Plans list, checkout, verify payment, cancel, invoices |
| `/notifications` | List, mark read, delete notifications |
| `/tickets` | Support ticket creation and messaging |
| `/faqs` | Public FAQ list |
| `/announcements` | Active announcements |
| `/settings` | Platform settings |
| `/dashboard` | Dashboard overview, sales chart, lead sources, recent activities |
| `/webhooks` | Razorpay payment webhook receiver |

---

## Data Relationships (How Everything Connects)

```
User
 ├── has a Role (with Permissions)
 ├── owns Companies
 ├── owns Contacts  ←── belongs to a Company
 ├── owns Leads
 ├── owns Deals     ←── linked to Company, Contact, Lead
 ├── owns Tasks     ←── linked to Lead / Deal / Contact / Company
 ├── writes Notes   ←── linked to Lead / Deal / Contact / Company
 ├── has one Subscription ←── belongs to a Plan
 │    ├── has many Invoices
 │    └── has many Payments
 └── has many Notifications
```

---

## Folder Structure

```
CRM_System/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── server.js           # HTTP + Socket.IO server entry point
│   │   ├── config/             # Database, Swagger, environment config
│   │   ├── core/               # BaseService, BaseController, queryBuilder, activityLogger
│   │   ├── middleware/         # auth, RBAC, validation, rate limiting, error handling, upload
│   │   ├── models/             # Sequelize models (one file per table)
│   │   ├── modules/            # Feature modules (auth, lead, deal, company, etc.)
│   │   ├── services/           # Third-party integrations (Razorpay, Cloudinary, Brevo)
│   │   └── utils/              # ApiError, ApiResponse, JWT helpers, asyncHandler
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                # Axios instance + all API endpoint functions
    │   ├── components/         # Reusable UI components (Button, Modal, Table, etc.)
    │   ├── pages/              # One folder per page (Dashboard, Leads, Deals, etc.)
    │   ├── stores/             # Zustand stores (auth state, theme)
    │   └── lib/                # Utility functions (formatCurrency, formatDate, etc.)
    └── package.json
```

---

## Key Design Decisions

1. **BaseService + BaseController pattern** — All CRUD modules (companies, contacts, leads, deals, tasks, notes) share a common `BaseService` that handles pagination, search, filtering, and data-scoping (owner vs. admin view). This removes ~80% of boilerplate from each module.

2. **JWT + Refresh Token** — Short-lived access tokens (15 min) limit exposure if a token is stolen. Long-lived refresh tokens (7 days) stored in the database can be revoked server-side.

3. **Axios interceptor for auto-refresh** — The frontend silently renews expired tokens. One global singleton `refreshing` promise prevents parallel refresh calls when multiple API requests expire at the same time.

4. **Validation at the middleware layer** — Joi schemas run in `validate.middleware.js` before any controller code executes. An `nullifyEmpty()` pre-processor converts HTML form empty strings (`""`) to `null` so that optional enum and number fields do not fail validation when left blank.

5. **Socket.IO for real-time notifications** — Instead of polling, the server pushes notifications directly to the user's browser the moment an event occurs.

6. **Razorpay for payments** — Payment signature verification happens server-side using the secret key, preventing any client-side tampering.
