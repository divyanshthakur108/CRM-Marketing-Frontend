# REALCRM — MASTER AUDIT, ARCHITECTURAL GAP ANALYSIS & IMPLEMENTATION ROADMAP
## Comprehensive Evaluation Against Nobogent AI Enterprise Specifications

**Document Identifier:** `frontend/PROJECT_ANALYSIS.md`  
**Evaluation Standard:** Nobogent AI Enterprise Specification ([nobogent.com](https://www.nobogent.com/) | [app.nobogent.com/dashboard](https://app.nobogent.com/dashboard))  
**Auditor:** Principal SaaS Solutions Architect & Systems Engineer  
**Audit Date:** October 2026  
**System Status:** 166 Backend Tests Passing (100%), 8 Playwright E2E Tests Passing (100%), 0 TypeScript Compilation Errors  

---

## 1. Executive Summary & Nobogent Benchmark Context

### 1.1 Project Objective
**RealCRM** is an AI-powered real estate marketing automation and CRM SaaS platform built for Indian real estate developers, property marketing agencies, and brokerage networks. The objective of this audit is to conduct an uncompromising code-level inspection of the entire codebase, contrast it against **Nobogent AI** (the industry benchmark for real estate marketing automation and voice/WhatsApp lead qualification), document all verified implementations, expose unverified or inaccurate claims from past reports, catalog feature gaps, and define a clear, prioritized implementation roadmap.

### 1.2 Nobogent AI Architectural Benchmark
Nobogent AI positions itself as an integrated growth engine for real estate developers and agencies with five primary pillars:
1. **Server-Side Tracking & Conversions API (CAPI):** Direct server-to-server event dispatch to Meta/Google to bypass ad-blockers and iOS privacy restrictions.
2. **Instant Inbound Lead Qualification:** Fast lead ingestion via Meta Webhooks, landing page forms, and portal APIs.
3. **Conversational Nurturing (WhatsApp & Voice AI):** Automated brochure delivery, floor plan dispatch, and human-like voice qualification calls.
4. **Lead CRM Pipeline & Site-Visit Booking:** Kanban CRM tracking buyers from initial lead to physical site inspection with conflict-safe calendar slots.
5. **Compliant Ad Creative Studio:** Automated ad copy and creatives enforcing RERA disclosures and anti-discriminatory housing regulations (Meta Special Ad Category: Housing).

---

## 2. Current Project Architecture

### 2.1 Repository Structure
The repository strictly conforms to the two-root-directory mandate:
```
realcrm/
├── backend/                       # Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/                # Environment variables, DB manager, permissions, logger
│   │   ├── middleware/            # JWT auth, tenant resolver, RBAC authorize, rate limiters
│   │   ├── models/                # 28 Mongoose models with compound indexes
│   │   ├── modules/               # 16 domain feature modules
│   │   ├── queue/                 # MongoDB-backed resilient job queue & worker
│   │   ├── scheduler/             # Rolling 30-day marketing plan scheduler
│   │   ├── storage/               # Local filesystem storage adapter (S3-compatible interface)
│   │   └── utils/                 # Token generator, password hasher, crypto, error classes
│   └── tests/                     # 12 Vitest suites (166 integration & unit tests)
├── frontend/                      # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── e2e/                       # Playwright E2E testing suites (8 automated tests)
│   ├── src/
│   │   ├── components/            # Design system (Button, Card, Badge, Modal, Input, etc.)
│   │   ├── hooks/                 # TanStack Query hooks for all modules
│   │   ├── layouts/               # AppShell (authenticated layout) & AuthLayout
│   │   ├── lib/                   # Axios API client with transparent token rotation
│   │   ├── pages/                 # 30 application views
│   │   ├── routes/                # ProtectedRoute, AdminRoute, OnboardingRoute
│   │   └── store/                 # Zustand authentication store
│   └── PROJECT_ANALYSIS.md        # This master audit and specification document
```

### 2.2 Technology Stack
- **Frontend:** React 18.2, TypeScript 5.2, Vite 5.2, Tailwind CSS 3.4, Lucide React, TanStack Query v5, Recharts, Zod, React Hook Form.
- **Backend:** Node.js 20+, Express 4.19, TypeScript 5.4, Mongoose 8.3, MongoDB 7+, Pino Logger, Helmet, CORS, Cookie-Parser, BcryptJS, Jose / JsonWebToken.
- **Testing:** Vitest 1.6 with `mongodb-memory-server` (Backend), Playwright 1.43 with Chromium (Frontend).
- **Design Aesthetic:** High-contrast architectural monochrome (solid `#000000`, crisp `#FFFFFF`, neutral grayscale, 1px sharp borders, uppercase headers, monospaced metadata badges).

---

## 3. Database Schema Audit (All 28 Mongoose Models)

Every organization-owned model is scoped with `organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }` and indexed via compound keys in [`backend/src/models/initIndexes.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/initIndexes.ts):

| # | Model | Schema File | Key Indexes & Scoping | Purpose in RealCRM |
|---|---|---|---|---|
| 1 | `Organization` | [`Organization.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Organization.ts) | `{ slug: 1 }` (unique), `{ status: 1 }` | Root tenant entity with onboarding state. |
| 2 | `User` | [`User.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/User.ts) | `{ email: 1 }` (unique) | Platform users (admins, agency staff, clients). |
| 3 | `Membership` | [`Membership.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Membership.ts) | `{ organizationId: 1, userId: 1 }` (unique) | Multi-tenant RBAC link defining roles per organization. |
| 4 | `Invitation` | [`Invitation.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Invitation.ts) | `{ tokenHash: 1 }`, `{ email: 1, organizationId: 1 }` | Secure 48-hour onboarding invitation tokens. |
| 5 | `RefreshToken` | [`RefreshToken.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/RefreshToken.ts) | `{ token: 1 }`, `{ userId: 1 }`, `{ expiresAt: 1 }` | Token rotation ledger with replay attack protection. |
| 6 | `Project` | [`Project.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Project.ts) | `{ organizationId: 1, slug: 1 }` (unique) | Master real estate development (RERA, location, specs). |
| 7 | `PropertyUnit` | [`PropertyUnit.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/PropertyUnit.ts) | `{ organizationId: 1, projectId: 1, unitNumber: 1 }` | Individual inventory units (1BHK, 2BHK, 3BHK, Villas). |
| 8 | `MediaAsset` | [`MediaAsset.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/MediaAsset.ts) | `{ organizationId: 1, projectId: 1 }` | Uploaded images, floor plans, renders, brochures. |
| 9 | `BrandProfile` | [`BrandProfile.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/BrandProfile.ts) | `{ organizationId: 1 }` (unique) | Developer brand colors, logos, tones, RERA disclaimers. |
| 10 | `AudienceBrief` | [`AudienceBrief.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/AudienceBrief.ts) | `{ organizationId: 1, projectId: 1 }` | Demographic profiles, buyer personas, income brackets. |
| 11 | `Budget` | [`Budget.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Budget.ts) | `{ organizationId: 1, month: 1, year: 1 }` (unique) | Monthly spend limit and project-wise allocations. |
| 12 | `Plan` | [`Plan.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Plan.ts) | `{ organizationId: 1, month: 1, year: 1 }` | 30-day marketing schedule container. |
| 13 | `PlanItem` | [`PlanItem.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/PlanItem.ts) | `{ organizationId: 1, scheduledDate: 1 }`, `{ version: 1 }` | Individual scheduled posts with optimistic locking. |
| 14 | `Creative` | [`Creative.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Creative.ts) | `{ organizationId: 1, planItemId: 1 }` | Generated marketing copy, headlines, image/video URLs. |
| 15 | `Approval` | [`Approval.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Approval.ts) | `{ organizationId: 1, status: 1 }` | Statutory compliance and client approval queue. |
| 16 | `MetaConnection`| [`MetaConnection.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/MetaConnection.ts) | `{ organizationId: 1 }` (unique) | AES-256-GCM encrypted Meta OAuth tokens and Page IDs. |
| 17 | `Campaign` | [`Campaign.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Campaign.ts) | `{ organizationId: 1, externalCampaignId: 1 }` | Meta Ad Campaigns, AdSets, Ads with Fair Housing tags. |
| 18 | `PublishedPost` | [`PublishedPost.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/PublishedPost.ts) | `{ organizationId: 1, externalPostId: 1 }` | Organic publishing history with social network permalinks. |
| 19 | `Lead` | [`Lead.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Lead.ts) | `{ organizationId: 1, dedupeKey: 1 }` (unique), `{ stage: 1 }` | CRM buyer records with stages and consent tracking. |
| 20 | `LeadActivity` | [`LeadActivity.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/LeadActivity.ts) | `{ organizationId: 1, leadId: 1, createdAt: -1 }` | Audit timeline of calls, notes, status changes, visits. |
| 21 | `Conversation` | [`Conversation.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Conversation.ts) | `{ organizationId: 1, customerPhone: 1 }` (unique) | Two-way WhatsApp message threads with bot handoff state. |
| 22 | `Appointment` | [`Appointment.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Appointment.ts) | `{ organizationId: 1, projectId: 1, slotStart: 1 }` | Physical site-visit calendar with double-booking lock. |
| 23 | `Job` | [`Job.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Job.ts) | `{ status: 1, nextRunAt: 1 }`, `{ key: 1 }` (unique) | MongoDB-backed background queue for rendering & publishing. |
| 24 | `AuditLog` | [`AuditLog.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/AuditLog.ts) | `{ organizationId: 1, entityId: 1 }` | Security audit trail for sensitive system mutations. |
| 25 | `Notification` | [`Notification.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Notification.ts) | `{ organizationId: 1, userId: 1, isRead: 1 }` | In-app team alerts for approvals, revisions, leads. |
| 26 | `Insight` | [`Insight.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Insight.ts) | `{ organizationId: 1, date: 1 }` (unique) | Daily aggregated analytics (impressions, clicks, CPL). |
| 27 | `UsageLedger` | [`UsageLedger.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/UsageLedger.ts) | `{ organizationId: 1, month: 1 }` | AI token and render computation usage tracking. |
| 28 | `Subscription` | [`Subscription.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Subscription.ts) | `{ organizationId: 1 }` (unique) | Tenant SaaS tier, billing limits, and feature flags. |

---

## 4. Backend Routing & Middleware Audit

Mounted inside [`backend/src/app.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/app.ts):
- `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `POST /api/v1/auth/invitations/:token/accept`: Accepts raw invitation token, verifies against `tokenHash`, checks expiration, hashes client password, and activates client account.
- `GET/POST /api/v1/admin/organizations`: Platform-admin-only organization creation and listing.
- `POST /api/v1/admin/organizations/:id/resend-invite`: Regenerates and emails client invitation.
- `PATCH /api/v1/admin/organizations/:id/status`: Suspends/activates organization.
- `GET /api/v1/onboarding`, `PUT /api/v1/onboarding/steps/:step`, `POST /api/v1/onboarding/submit`: Client onboarding engine.
- `CRUD /api/v1/projects`: Real estate project master catalog.
- `CRUD /api/v1/projects/:projectId/units`: Unit inventory (1BHK, 2BHK, 3BHK, etc.).
- `CRUD /api/v1/media`: Property media upload, aspect ratio tagging, deletion.
- `GET/PUT /api/v1/brand`: Brand guidelines, colors, logos, disclaimers.
- `CRUD /api/v1/audience-briefs`: Demographic personas and targeting briefs.
- `GET/PUT /api/v1/budgets/:month`: Monthly marketing budget caps and project splits.
- `POST /api/v1/plans/generate`, `GET /api/v1/plans`: Deterministic 30-day marketing plan generator.
- `PATCH /api/v1/plan-items/:id`: Optimistic locking on calendar edits (`version` concurrency check).
- `GET/POST /api/v1/approvals`: Statutory RERA compliance checklists and decision logging.
- `POST /api/v1/ai/generate-caption`, `POST /api/v1/ai/generate-creative`: Copywriting and creative engine.
- `GET/POST/DELETE /api/v1/meta/*`: OAuth connection, token encryption, status check.
- `POST /api/v1/publishing/organic`, `GET /api/v1/publishing/logs`: Worker-backed post publishing.
- `POST /api/v1/campaigns`: Meta paid campaign deployment with Fair Housing Act compliance enforcement.
- `CRUD /api/v1/leads`: Lead CRM, stage progression, deduplication, activity logs.
- `GET/POST /api/v1/conversations`: WhatsApp two-way messaging, consent enforcement, bot handoff.
- `CRUD /api/v1/appointments`: Site-visit appointments with double-booking detection.
- `GET /api/v1/analytics/*`: Overview, campaigns, content performance, and lead conversion timeseries.
- `POST /api/v1/webhooks/meta`: Inbound Meta lead webhook with SHA-256 HMAC verification.

---

## 5. Security & Multi-Tenancy Architecture

1. **Strict Context Scoping:** [`resolveTenant.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/middleware/resolveTenant.ts) verifies that the user possesses an active membership in the requested organization. Platform admins can inspect target tenants; cross-tenant attempts by normal users trigger immediate `403 Forbidden` (`TENANT_ACCESS_DENIED`).
2. **Access & Refresh Cycle:** Access tokens expire in 15 minutes and remain strictly in memory on the frontend. Refresh tokens are stored in `httpOnly`, `sameSite: 'lax'`, `path: '/'` cookies. On refresh, the previous token is marked `isRevoked: true` and a new token is generated. Token reuse triggers revocation of all sessions for that user.
3. **AES-256-GCM Token Cryptography:** Meta integration access tokens are encrypted before saving to MongoDB using a 256-bit key with random IV and authentication tag (`backend/src/utils/crypto.ts`). Unencrypted tokens are never stored or logged.
4. **Fair Housing & RERA Statutory Guardrails:** [`housingPolicy.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/meta/housingPolicy.ts) blocks discriminatory age restrictions, gender restrictions, and postal PIN code redlining. Ad campaigns must begin in `PAUSED` status. Unapproved creatives cannot be published (rejected with `422 Unprocessable Entity`).

---

## 6. Audit Findings: Verified vs. Inaccurate Past Claims

| Feature Claimed in Previous Reports | Actual Source Code Verification | Audit Finding |
|---|---|---|
| **Phase A: Platform Admin & Client Onboarding** | Implemented in `backend/src/modules/admin`, `backend/src/modules/onboarding`, `frontend/src/pages/AdminOrganizationsPage.tsx`, `OnboardingPage.tsx`, `AcceptInvitePage.tsx`. Covered by 24 backend tests and 6 E2E tests. | **VERIFIED IMPLEMENTED** |
| **Multi-Tenancy & Role Matrix** | Verified in `resolveTenant.ts`, `permissions.ts`, `role_matrix.test.ts` (7 roles tested). | **VERIFIED IMPLEMENTED** |
| **Phase 9: Sharp Compositing & FFmpeg 9:16 Video Engine** | Inspected `backend/tests/phase9.test.ts` and `backend/package.json`. Phase 9 actually implemented CRUD for Projects, Units, Media, Brand, and Audience. Neither `sharp` nor `fluent-ffmpeg` is installed in `backend/package.json`. Media compositing is currently handled via CSS overlays and mock asset rendering. | **INACCURATE PAST CLAIM** (Image/video rendering engine was claimed but is currently handled via Mock/CSS canvas previews) |
| **Dashboard Metrics** | Inspected `frontend/src/pages/DashboardPage.tsx`. Discovered `import { MOCK_DASHBOARD_STATS, MOCK_UPCOMING_ITEMS, MOCK_BUDGET_SUMMARY } from '../mocks'`. Although backend analytics endpoints (`/api/v1/analytics/overview`) exist, the Dashboard UI was relying on mock data constants. | **PARTIALLY IMPLEMENTED / CONTAINS MOCK DATA** |
| **Meta Conversions API (CAPI)** | Inbound webhooks exist (`webhooksRouter`), but outbound server-side event dispatch (`POST graph.facebook.com/.../events`) is not implemented. | **NOT IMPLEMENTED** |
| **AI Voice Qualification (Auto-Dialer)** | Voice calling infrastructure does not exist in backend or frontend. | **NOT IMPLEMENTED (NOBOGENT BENCHMARK GAP)** |
| **Public Property Landing Pages** | Project catalog is internal to authenticated users. No public buyer-facing landing page builder or route exists. | **NOT IMPLEMENTED (NOBOGENT BENCHMARK GAP)** |

---

## 7. Master Feature Gap Matrix

| Feature | Existing Status | Evidence | Missing Work | Priority | Dependencies | Test Requirements |
|---|---|---|---|---|---|---|
| **Platform Admin & Client Onboarding** | **VERIFIED IMPLEMENTED** | [`AdminOrganizationsPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/AdminOrganizationsPage.tsx), [`OnboardingPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/OnboardingPage.tsx), [`AcceptInvitePage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/AcceptInvitePage.tsx), [`admin_onboarding.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/admin_onboarding.test.ts) | None. Fully connected to Phase A APIs. | High | Backend Auth & Onboarding APIs | E2E Playwright test passing (6/6). |
| **Tenant Data Isolation & Security** | **VERIFIED IMPLEMENTED** | [`resolveTenant.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/middleware/resolveTenant.ts), [`tenant_isolation.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/tenant_isolation.test.ts) | None. Every query scoped by `organizationId`. | Critical | Mongoose models | Tenant boundary test passing. |
| **Agency Dashboard Metrics** | **PARTIALLY IMPLEMENTED** | [`DashboardPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/DashboardPage.tsx), [`analyticsRouter`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/analytics/routes.ts) | Replace `MOCK_DASHBOARD_STATS` and `MOCK_UPCOMING_ITEMS` with live queries to `GET /api/v1/analytics/overview`, `GET /api/v1/projects`, `GET /api/v1/leads`, `GET /api/v1/approvals`. Label remaining fallbacks with `[MOCK]`. | **Highest (Immediate)** | Analytics & Projects APIs | Dashboard real data integration test. |
| **Property & Unit Inventory Catalog** | **VERIFIED IMPLEMENTED** | [`ProjectsPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/ProjectsPage.tsx), [`ProjectEditorPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/ProjectEditorPage.tsx), [`Project.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/models/Project.ts), [`phase9.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase9.test.ts) | Category-specific fields for Commercial vs Residential can be made more explicit in UI. | Medium | Project & Unit models | Category validation test. |
| **Brand Management** | **VERIFIED IMPLEMENTED** | [`BrandProfilePage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/BrandProfilePage.tsx), [`brandRouter`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/brand/routes.ts) | None. Real colors, logos, tones, and disclaimers save to DB. | Medium | BrandProfile model | CRUD integration test. |
| **Media Library** | **VERIFIED IMPLEMENTED** | [`MediaLibraryPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/MediaLibraryPage.tsx), [`mediaRouter`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/media/routes.ts) | 50MB ceiling, MIME check, aspect ratio tagging working. Real S3 cloud adapter for production. | Medium | Storage adapter | Upload and deletion tests passing. |
| **Budget & 30-Day Marketing Plan** | **VERIFIED IMPLEMENTED** | [`BudgetPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/BudgetPage.tsx), [`CalendarPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/CalendarPage.tsx), [`plans/service.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/plans/service.ts), [`phase10.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase10.test.ts) | None. Optimistic locking on calendar drag/reschedule verified. | High | Plan & PlanItem models | Concurrency conflict test passing. |
| **Statutory Approvals & Governance** | **VERIFIED IMPLEMENTED** | [`ApprovalsQueuePage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/ApprovalsQueuePage.tsx), [`approvals/service.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/approvals/service.ts), [`phase10.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase10.test.ts) | None. Checklist verification and unapproved creative rejection verified. | High | Approval model | 422 unapproved rejection test passing. |
| **Fair Housing Ad Policy Compliance** | **VERIFIED IMPLEMENTED** | [`housingPolicy.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/meta/housingPolicy.ts), [`phase12.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase12.test.ts) | None. Prohibited age/gender/PIN-code redlining blocks verified. | High | Campaign model | Policy validation tests passing. |
| **Lead CRM Pipeline** | **VERIFIED IMPLEMENTED** | [`LeadsPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/LeadsPage.tsx), [`leadService.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/leads/leadService.ts), [`phase13.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase13.test.ts) | None. Kanban + Table, stages, deduplication, and activity history verified. | High | Lead & LeadActivity models | Deduplication test passing. |
| **WhatsApp AI Bot & Appointments** | **VERIFIED IMPLEMENTED** | [`ConversationsPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/ConversationsPage.tsx), [`AppointmentsPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/AppointmentsPage.tsx), [`phase14.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase14.test.ts) | Consent enforcement and site-visit conflict safety verified. Production WhatsApp Business API credentials required for real messages. | High | Conversation & Appointment models | Double-booking rejection test passing. |
| **Meta Integration & Publishing** | **BLOCKED (SANDBOX)** | [`MetaConnectionsPage.tsx`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/frontend/src/pages/MetaConnectionsPage.tsx), [`publishingService.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/publishing/publishingService.ts), [`phase12.test.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/tests/phase12.test.ts) | Mock adapter active. Requires real Meta Developer App credentials and Page Access Tokens to publish live ads. | Medium | Meta Graph API credentials | Encrypted token storage & mock publish tests passing. |
| **Meta Conversions API (CAPI)** | **NOT IMPLEMENTED** | Missing in backend. Nobogent benchmark pillar. | Implement outbound CAPI adapter to dispatch `Lead`, `PageView`, `Schedule` events to Meta Graph CAPI endpoint (`POST /{pixel_id}/events`) with deduplication event IDs. | High | Meta Pixel ID & CAPI Token | CAPI payload validation and mock delivery test. |
| **Public Property Landing Pages** | **NOT IMPLEMENTED** | Internal catalog exists; public lead-capture landing page does not. Nobogent benchmark pillar. | Create public route `/p/:slug` rendering luxury property showcase, brochure download lead capture form, and WhatsApp direct contact button. Submitting form creates Lead and triggers CAPI. | High | Projects & Leads API | Public landing page E2E test. |
| **AI Voice Qualification (Auto-Dialer)** | **PROPOSED / NOT IMPLEMENTED** | Not present in codebase. Signature Nobogent feature. | Outbound call qualification module (Twilio / Exotel integration + Voice LLM agent) to call leads within 60s of form submission. | Low (External dependency) | Telephony Provider API key | Simulated call qualification test. |
| **Real Generative AI Engine** | **BLOCKED (SANDBOX)** | [`mockProvider.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/ai/providers/mockProvider.ts), [`geminiProvider.ts`](file:///c:/Users/Lenovo/OneDrive/Pictures/my%20document/Project/realcrm/backend/src/modules/ai/providers/geminiProvider.ts) | Mock copywriting and image preview active. Requires `GEMINI_API_KEY` in `backend/.env` for live LLM generation. | Medium | Google Gemini API Key | Live provider fallback test. |

---

## 8. Prioritized Implementation Roadmap

Following the prompt's instruction: *"Do not rewrite the entire project. Do not begin implementing every missing module in one operation. Start with the highest-priority verified gap and complete it before proceeding to the next phase."*

### Phase 1: Dashboard Real-Data Integration & Mock Labeling (Highest Priority - Immediate)
- **Problem:** `DashboardPage.tsx` currently imports `MOCK_DASHBOARD_STATS`, `MOCK_UPCOMING_ITEMS`, and `MOCK_BUDGET_SUMMARY` from `frontend/src/mocks.ts` despite the existence of real backend endpoints.
- **Action:**
  1. Connect `DashboardPage.tsx` to `useAnalyticsOverview()`, `useProjects()`, `useLeads()`, and `useApprovals()`.
  2. Display real counts for active projects, incoming leads, pending approvals, and monthly marketing spend.
  3. Clearly label any remaining calculated estimates or placeholder items with `[MOCK]`.
  4. Ensure loading, error, and empty states function smoothly.
- **Verification:** Playwright test verifying real numbers render on the dashboard.

### Phase 2: Public Property Landing Pages & Lead Ingestion (Nobogent Pillar)
- **Problem:** Real estate marketing automation requires an external destination for ad clicks. Currently, all project pages require authentication.
- **Action:**
  1. Build a public route `/p/:slug` (e.g. `/p/emerald-bay-towers`) displaying project highlights, amenities, location, RERA registration, and gallery.
  2. Implement a high-converting buyer inquiry form (Name, Phone, Email, Budget, Configuration).
  3. Connect submission to `POST /api/v1/leads` (source: `LANDING_PAGE`) with consent recording.
  4. Instant download link for brochure media asset.
- **Verification:** Automated test for public lead capture and CRM pipeline synchronization.

### Phase 3: Meta Conversions API (CAPI) Server-Side Dispatch
- **Problem:** Lead capture forms currently rely on client-side tracking or webhooks; ad-blockers prevent Meta pixel execution on landing pages.
- **Action:**
  1. Build `backend/src/modules/meta/capiService.ts` implementing Meta CAPI server-to-server event dispatch.
  2. Dispatch `Lead` and `ViewContent` events with hashed user data (`em`, `ph`), client IP, and user-agent.
  3. Include event deduplication (`event_id`).
  4. Mock mode when CAPI credentials are not configured.
- **Verification:** Unit tests verifying CAPI payload hashing, event formatting, and mock transmission.

### Phase 4: Property Category Specialization (Commercial vs Residential Fields)
- **Problem:** Project Editor currently shows residential-only fields (e.g., BHK configurations) even if a project is classified as Commercial or Industrial.
- **Action:**
  1. Conditionally render configuration options: Commercial (Leasable Floor Area, Floor Plate, Retail/Office, Cap Rate) vs. Residential (BHK, Carpet Area, Balcony, Furnishing).
  2. Validate appropriate schema fields per category.
- **Verification:** Component test verifying category-based field visibility.

---

## 9. Definition of Done Checklist

Every feature implemented during this enhancement roadmap must satisfy:
- [ ] Backend route and service layer exist and enforce multi-tenant `organizationId` scoping.
- [ ] Frontend page/component connects to real backend API via TanStack Query.
- [ ] Database operations, compound indexes, and validations are enforced.
- [ ] Role-based authorization is enforced in backend middleware (not just frontend conditional rendering).
- [ ] Loading skeleton, empty state, success notification, and error retry states are handled.
- [ ] Responsive design verified at 375px (mobile), 768px (tablet), and 1280px (desktop).
- [ ] Automated tests (Vitest backend unit/API tests + Playwright E2E tests) pass.
- [ ] Any external third-party integration without live credentials operates via an honest mock adapter labeled `[MOCK]` with clear UI disclaimer.
