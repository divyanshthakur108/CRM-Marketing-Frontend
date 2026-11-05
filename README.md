# RealCRM Frontend Application

> **Start here:** `docs/OVERVIEW.md` (setup, architecture). Video docs live in the backend repo under `docs/`.

Enterprise Multi-Tenant AI Real Estate Marketing Automation + CRM Web Client.  
Built with **React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, and Playwright**.

---

## 1. Architectural Highlights

- **Strict Monochrome Design System:** Built on a strict black-and-white enterprise palette (`#000000`, `#FFFFFF`, neutral grays). Client brand accents are strictly confined to generated creative previews.
- **Enterprise CRM & ERP Workflows:**
  - **Property Catalog & Inventory:** Residential & commercial specifications with RERA compliance and unit-level status tracking.
  - **Media Asset Library:** Media ingestion with aspect-ratio tagging (1:1, 4:5, 9:16) and direct uploads.
  - **Brand & Audience Strategy:** Brand guideline builder and buyer persona profiling.
  - **Budget & Marketing Calendar:** Monthly budget allocation with cap enforcement and 30-day scheduled marketing campaigns.
  - **Statutory Approvals Queue:** RERA compliance sign-off workflow with multi-role audit logging.
  - **Creative Studio:** AI-assisted ad copy generation and poster preview rendering.
  - **Meta Campaigns & Publishing:** Ad campaign staging, housing policy compliance checks, and publishing history.
  - **Leads CRM Pipeline:** Dual-mode pipeline (Interactive Kanban + sortable Table) with automated deduplication and stage transitions.
  - **WhatsApp Concierge & Appointments:** Consent-guarded conversational timeline, automated bot replies with agent handoff, and double-booking safe site-visit scheduling.
  - **Analytics Suite:** Performance attribution across spend, impressions, CPL, CTR, creative format ROI, and lead funnels.
- **Responsive Layout:** Optimized and verified across mobile (375px), tablet (768px), and desktop (1280px+).
- **Zero Bundle Secrets:** All third-party secrets, encryption keys, and database credentials reside strictly on the backend.

---

## 2. Directory Structure

```
frontend/
├── src/
│   ├── api/                    # Axios HTTP client & tenant token interceptors
│   ├── components/             # Reusable UI primitives (Buttons, Cards, Inputs, Modals, Badges)
│   ├── layouts/                # DashboardLayout (Sidebar + Header) & AuthLayout
│   ├── pages/                  # 16 Enterprise application views
│   │   ├── LoginPage.tsx       # Verified reference login view with demo account chips
│   │   ├── SignupPage.tsx      # Tenant agency registration
│   │   ├── DashboardPage.tsx   # Workspace metrics & activity telemetry
│   │   ├── ProjectsPage.tsx    # Property developments catalog
│   │   ├── UnitsPage.tsx       # Property unit-level inventory
│   │   ├── MediaLibraryPage.tsx# Digital asset management
│   │   ├── BrandProfilePage.tsx# Developer brand guidelines & disclaimers
│   │   ├── AudiencesPage.tsx   # Target audience personas
│   │   ├── BudgetPage.tsx      # Monthly ad budget allocation
│   │   ├── CalendarPage.tsx    # 30-day marketing schedule & plan items
│   │   ├── ApprovalsPage.tsx   # Statutory RERA sign-off queue
│   │   ├── CreativeStudioPage.tsx # AI copywriter & creative previewer
│   │   ├── CampaignsPage.tsx   # Meta ad deployment & delivery controls
│   │   ├── PublishingLogPage.tsx # Publication history & error retry
│   │   ├── LeadsPage.tsx       # Lead pipeline (Kanban & Table)
│   │   ├── ConversationsPage.tsx # WhatsApp customer messaging
│   │   ├── AppointmentsPage.tsx # Site-visit slots & visitor passes
│   │   └── AnalyticsPage.tsx   # Timeseries charts & format ROI
│   ├── services/               # Modular REST API service functions
│   ├── store/                  # Zustand global state (Auth session, active tenant)
│   └── types/                  # Shared TypeScript interfaces
├── e2e/                        # Playwright automated end-to-end tests
├── playwright.config.ts        # Playwright test configuration
└── PROJECT_ANALYSIS.md         # Master architectural specification
```

---

## 3. Environment Setup

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API service | `http://localhost:5000` |

---

## 4. Running Locally

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Start Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

### 4.3 Production Build & Typecheck
```bash
npm run build
npm run preview
```

---

## 5. Running End-to-End (E2E) Tests

Playwright automates the complete enterprise workflow:
`Login -> Catalog -> Media -> Budget -> Plan -> Approval -> Studio -> Campaigns -> Leads -> Analytics` as well as multi-viewport responsiveness (375px, 768px, 1280px).

Ensure the backend server is running on `http://localhost:5000` (e.g. via `npm run e2e:server` in `backend/`), then run:

```bash
npx playwright test
```

To run tests with UI or Chromium headed mode:
```bash
npx playwright test --headed
```

---

## 6. Demo Accounts Available on Login Screen

The login screen features pre-configured 1-click credential chips:
- **Org 1 Owner:** `owner@apex-luxury.in` / `Password123!`
- **Org 1 Manager:** `manager@apex-luxury.in` / `Password123!`
- **Org 1 Approver:** `approver@apex-luxury.in` / `Password123!`
- **Org 1 Sales Agent:** `sales@apex-luxury.in` / `Password123!`
- **Org 1 Viewer:** `viewer@apex-luxury.in` / `Password123!`
- **Org 2 Owner:** `owner@zenith-commercial.in` / `Password123!`
