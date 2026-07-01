# STSN Connect Demo PDF — Demo-Ready Revision (Change Summary)

_Revision date: 2026-07-01 · Source edited: `scripts/generate-demo-pdf/generate.js` · Output regenerated: `STSN_Connect_Demo.pdf` (108 physical pages)_

---

## 1. What changed (at a glance)

| Area | Before | After |
| --- | --- | --- |
| Per-module **Forms** section | Listed internal form names + field chips | **Removed** |
| Per-module **Modals & Dialogs** section | Listed internal modal/dialog names | **Removed** |
| Replacement content | — | **Demo Highlights** (What to Say & Show · Recommended Demo Flow · Operational Value / Who Benefits) + **Automation & Notifications** note where relevant |
| Communication summary | None | New dedicated page **"Communication Automation: SMS, Email & In-App Notifications"** (appended last) |
| Branding, layout, header/footer, colors, screenshots, module structure | — | **Unchanged / preserved** |

The edit is confined to the PDF generator's content/render logic. Cover page, System
Overview, role header pages, the screenshot placeholder boxes (82 preserved), the Key
Features / Workflow / Tabs info-cards, and the Reports section are all untouched.

---

## 2. Removed sections

For **every** module page the renderer previously emitted:

- **`Forms`** — a `section-title` heading followed by `form-card`s, each exposing internal
  field names as chips (e.g. "LRN (Learner Reference Number)", "Tuition Fee", database-style
  field labels). These were technical and not useful to a school audience.
- **`Modals & Dialogs`** — a `section-title` heading followed by `modal-card`s naming internal
  UI components (e.g. "COR Preview", "Approval Detail Panel", "Import Preview").

Both the headings and all their contents were removed from the rendered output. The
underlying `forms`/`modals` data arrays remain in the source object literals (harmless, no
longer rendered) to keep the diff minimal and reversible.

## 3. Replacement sections (per module page)

A new **Demo Highlights** block renders in the same position, containing:

1. **What to Say & Show** — 3 concise, school-facing talking points.
2. **Recommended Demo Flow** — 3–5 short, plain-language steps for the live demo.
3. **Operational Value / Who Benefits** — the problem the module solves and the office/role
   that benefits.
4. **Automation & Notifications** (only where relevant) — three clearly separated, colour-coded
   tiers: **Currently implemented** (green) · **Partial / mock-only** (amber) · **Recommended
   next** (grey).

Content is **curated** for the 15 demo-critical modules (Action Center, Enrollment, Accounting,
Cashiering, Teacher Board, Grades, Grade Encoding, HR, Payroll, Clinic, Guidance, Consultation,
User Access, Student Portal, Parent Portal) and **synthesised** from each remaining module's own
`purpose` / `features` / `workflow` so no page is left blank.

## 4. Changed pages

- **All 81 module page instances** across all role sequences now show Demo Highlights
  (verified: 81 pages contain "Demo Highlights"; 0 pages contain "Modals"/"Dialogs").
- **37 module page instances** additionally show an Automation & Notifications note (the
  curated, communication-relevant modules, repeated across the roles that can access them).
- **1 new page** appended at the end: *Communication Automation: SMS, Email & In-App
  Notifications* (trigger matrix for all 9 functional areas).

Page indices for cover (1), System Overview (2), and every existing module page are
**unchanged** — the new page was appended last specifically so the screenshot-injection
pipeline stays aligned.

---

## 5. Project inspection — SMS, Email & In-App Notification findings

This was checked directly in the codebase before writing any communication claims.

### ✅ Currently implemented — In-app notifications (session-scoped)
- A working in-app notification system: `src/components/common/NotificationBell.tsx`
  (bell icon, unread badge, role-filtered) backed by `src/services/store.ts`
  (`addNotification` / `markNotificationRead`).
- **Real triggers wired** (`src/services/store.ts`): assessment **approved**/**returned**,
  void request **approved**/**rejected**, grade period **submitted**/**approved**/**returned**,
  leave request **approved**/**rejected**. Alerts are **role-targeted** (only relevant offices
  see them).
- **Announcements** are DB-backed (`announcements` table, migration `0001_schema.sql`) and
  broadcast to roles/schools — shown in the NotificationBell "Notices" tab.
- ⚠️ Note: in-app notifications themselves are held in the Zustand store (capped at 100) and
  are **not persisted to a notifications table** — there is no `notifications` migration. They
  are session/live, not a durable delivery log.

### ⚠️ Partial / mock-only — SMS
- `src/features/faculty/pages/FacultyPortalPage.tsx` (line ~315) shows a toast on attendance
  submission: *"…Dispatched automated SMS notifications to parents."* This is a **simulated UI
  message only** — there is **no SMS sent**, no provider, no SMS service, no queue, no log.

### ❌ Not implemented — Email & SMS delivery
- No email service, SMTP/provider integration (no Twilio, Semaphore, SendGrid, Nodemailer,
  Mailgun, etc.), no message templates, no delivery queue, and no delivery logs anywhere in
  `src/`, `supabase/migrations/`, or dependencies.

### Accurate positioning used in the PDF (verbatim)
> "STSN Connect is prepared for communication automation. The current system includes in-app
> workflow notifications, while SMS and Email delivery can be connected to provider services
> for production use."

The PDF **avoids** the prohibited claims (no "fully integrated SMS/email", no "messages are
automatically sent", no "production-ready messaging").

---

## 6. Communication Automation page — trigger matrix

A demo-friendly table covering all 9 areas (Enrollment/Admission, Accounting/Cashiering, Class
Sectioning/Scheduling, Attendance, Grades, Clinic, Guidance/Consultation, HR/Payroll, User
Access/Security) with **Trigger → Recipients → Channel → Status**. Status badges reflect the
inspection above:

- **Live (in-app):** Accounting/Cashiering (assessment & void approvals), Grades (period
  workflow), HR/Payroll (leave approvals).
- **Partial / mock-only:** Attendance (simulated SMS confirmation).
- **Recommended next:** all parent/student Email & SMS delivery (enrollment, payments,
  attendance alerts, clinic incidents, guidance appointments, payslips, access notices).

---

## 7. Recommended next steps (to make SMS/Email real)

1. **Add a provider integration** — e.g. an email provider (SMTP/SendGrid) and a PH-friendly
   SMS gateway (Semaphore/Twilio). Store credentials as environment config.
2. **Add a `notifications` (+ `notification_deliveries`) table** so in-app alerts persist and
   email/SMS sends get a delivery log and status.
3. **Add message templates** per trigger (enrollment approved, payment posted, absence alert,
   payslip ready, etc.).
4. **Wire the recommended triggers** listed on the Communication Automation page, starting with
   the highest-value parent touchpoints: enrollment status, payment confirmation, and same-day
   attendance alerts.
5. **Replace the mock attendance toast** in `FacultyPortalPage.tsx` with a real send (or relabel
   it explicitly as a preview) once the gateway is connected.

---

## 8. How to regenerate / reproduce

```bash
cd scripts/generate-demo-pdf
node generate.js          # writes demo-output.html + ../../STSN_Connect_Demo.pdf
```

**Screenshots:** `STSN_Connect_Demo.pdf` uses screenshot **placeholder boxes** (the 🖥 boxes).
The screenshot-injected deliverable, `STSN_Connect_Demo_Guide_With_Screenshots.pdf`, is produced
by the separate, manual `replace-screenshots.mjs` pipeline (it reads a downloaded copy from
`Downloads/demo.pdf` and injects images from `demo-screenshots/`). To refresh the
**with-screenshots** guide after this revision, re-run that capture/replace pipeline — the new
content does not remove or move any screenshot box, and the new Communication Automation page is
appended last so existing module-page screenshot positions are unaffected.

> Note: the PowerPoint generator (`scripts/generate-demo-pdf/generate-pptx.js`) is a separate
> artifact and was **not** modified by this task.

---

## 9. Validation performed

| Check | Result |
| --- | --- |
| `node --check generate.js` (syntax) | ✅ Pass |
| PDF regenerated | ✅ `STSN_Connect_Demo.pdf`, 108 pages |
| No "Modals"/"Dialogs" text in PDF (case-insensitive, all pages) | ✅ 0 pages |
| No "Forms" **section heading** | ✅ Only 2 prose uses ("paper enrollment forms") on the Enrollment page — allowed as explanation |
| "Demo Highlights" present on module pages | ✅ 81 pages |
| Automation & Notifications note present | ✅ 37 pages |
| Communication Automation page present | ✅ 1 page (appended) |
| Screenshot placeholder boxes preserved | ✅ 82 boxes |
| Branding / layout / header-footer / colors / module structure | ✅ Unchanged |
| SMS/Email claims match code (no over-claiming) | ✅ Verified against `src/` + migrations |
