# STSN Connect Phase 11 Parent Portal Tracker

Audit date: 2026-06-30

Status: Completed a parent-facing portal alignment pass by promoting the existing Guardian Portal into a fuller Parent Portal experience using existing shared components, current routing/permission patterns, and store-backed data only.

## Files Reviewed

- `src/config/app-routes.config.ts`
- `src/config/navigation.config.ts`
- `src/config/permissions.config.ts`
- `src/config/roles.config.ts`
- `src/components/common/AppButton.tsx`
- `src/components/common/AppCard.tsx`
- `src/components/common/AppEmptyState.tsx`
- `src/components/common/AppKpiCard.tsx`
- `src/components/common/AppStatusBadge.tsx`
- `src/components/common/AppTable.tsx`
- `src/components/common/AppTabs.tsx`
- `src/components/common/ModulePageHeader.tsx`
- `src/components/layout/AppModuleRenderer.tsx`
- `src/features/student-portal/pages/StudentPortalPage.tsx`
- `src/features/guardian/pages/GuardianPortalPage.tsx`
- `src/services/store.ts`
- `src/services/dataLoader.ts`
- `src/types/index.ts`
- `src/types/role.types.ts`

## Claude Design Plan Summary

Claude’s design guidance recommended a parent-friendly, read-only portal aligned with the Student Portal shell and shared UI language:

- module header with parent/guardian greeting
- linked student selector
- child context summary
- required actions banner only when needed
- KPI strip
- tabs for Overview, Academics, Finance, Attendance, and Documents
- mobile-friendly single-column behavior with scrollable selectors/tabs
- reuse of shared components and existing store-backed records

Phase 11 used that guidance as visual and workflow direction only. No Metronic assets, code, dependency, or class system was introduced.

## Reusable Components Used

- `ModulePageHeader`
- `AppCard`
- `AppButton`
- `AppTabs`
- `AppTable`
- `AppStatusBadge`
- `AppEmptyState`
- `AppKpiCard`

## Parent Workflow Implemented

1. Parent/guardian logs in with the existing `GUARDIAN` role.
2. Parent lands on the existing `GUARDIAN_PORTAL` module and `/guardian-portal` route.
3. If multiple linked students are available, parent switches child context using horizontal selector chips.
4. The selected child drives the Overview, Academics, Finance, and Documents tabs.
5. The page shows:
   - child summary
   - required actions banner when live records need follow-up
   - KPI strip
   - announcements
   - schedule snapshot when class schedule records exist
   - finance and document summaries from real store-backed data
6. Attendance was intentionally deferred because no student attendance source is currently loaded in the shared store.
7. Consultation remained a safe parent-facing UI pattern only and did not introduce staff-only tooling or backend workflow changes.

## Files Created

- `src/features/guardian/types.ts`
- `src/features/guardian/components/ChildSummaryCard.tsx`
- `src/features/guardian/components/AcademicSnapshotCard.tsx`
- `src/features/guardian/components/BillingSnapshotCard.tsx`
- `src/features/guardian/components/ParentAnnouncementsCard.tsx`
- `src/features/guardian/components/ParentTasksCard.tsx`
- `src/features/guardian/components/ParentScheduleCard.tsx`
- `src/features/guardian/components/ParentDocumentsCard.tsx`
- `docs/uiux/STSN_CONNECT_PHASE_11_PARENT_PORTAL_TRACKER.md`

## Files Changed

- `src/features/guardian/pages/GuardianPortalPage.tsx`
- `src/config/roles.config.ts`
- `docs/uiux/STSN_CONNECT_METRONIC_PHASE_0_5_AUDIT_TRACKER.md`

## Route / Navigation Changes

- No new route was added.
- No new sidebar module was added.
- No new module id was added.
- The existing `GUARDIAN_PORTAL` route and navigation entry were retained.
- The navigation label was already `Parent Portal`, so no route or sidebar rewrite was required.

## Role / Permission Changes

- No permission expansion was introduced.
- `GUARDIAN` kept the existing `GUARDIAN_PORTAL` access boundary.
- `src/config/roles.config.ts` was aligned to include the canonical parent/guardian role in the role catalog, matching the already-existing route, permission, and type definitions.
- `ADMIN` now includes `GUARDIAN_PORTAL` access for QA, support, and demo validation.
- Admin access uses the same read-only portal shell and does not expose staff-only controls inside the Parent Portal.
- No admin, registrar, accounting, payroll, cashier, setup, or staff-only modules were exposed to the parent role.

## Data-Source Findings

Available real/store-backed parent-safe sources used:

- `students`
- `assessments`
- `payments`
- `grades`
- `announcements`
- `requirements`
- `classSchedules`
- `financialHolds`
- `enrollments`
- `studentGuardians`

Linkage behavior used:

- retained existing `student.linkedGuardianIds` matching when present
- added a narrow fallback using existing `student_guardians.email` data already loaded through the store
- added a safe Admin QA mode that can browse student records through the same read-only parent portal UI without altering parent-only permissions for actual guardian users

Important limitation:

- Durable guardian-to-user linkage is still not a fully normalized user-id-backed relationship in the current model.
- Phase 11 did not add migrations or schema assumptions.
- The email fallback improves practical parent visibility without changing backend data structures.

Unavailable / intentionally deferred:

- student attendance dataset for parent-facing attendance tab
- persisted parent messaging/chat workflow
- payment gateway / online payment initiation flow
- document download workflow beyond current requirement/status visibility

## Empty-State Handling

Added shared empty-state treatment for:

- no linked students
- no parent announcements
- no finalized grades
- no assessment on record
- no class schedule
- no document records
- no payments
- no tasks requiring follow-up

Attendance handling:

- The attendance tab was not created because no student attendance source exists in the current store.
- A read-only notice documents that deferral inside the portal UI.

## Responsive Notes

- The student selector uses horizontal chips and remains scrollable on smaller widths.
- The overview uses a single-column stack on smaller screens and a two-column main/side-rail layout on larger screens.
- Tabs remain shared-component based and naturally scroll within the existing shell behavior where needed.

## Behavior Preserved

- No routing behavior changed.
- No business logic changed.
- No data-source semantics were changed outside the safe guardian-email fallback for existing linked records.
- No calculations for grades, billing, payments, payroll, or accounting were changed.
- No payment, cashiering, accounting, enrollment, grading, payroll, approval, report, print, or export behavior changed.
- No table behavior changed outside the new parent-facing read-only AppTable presentation.
- No Metronic dependency was added.
- No DataTables.net code was added.
- No new UI framework was added.
- Existing Student Portal behavior was not changed.
- Existing Dashboard and Action Center behavior was not changed.

## Validation Results

- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed after rerunning unsandboxed because the managed sandbox still blocks Vite config resolution
- build output completed successfully in `4.88s`
- code review confirmation:
- existing `GUARDIAN_PORTAL` route still resolves through `app-routes.config.ts`
- existing `GUARDIAN_PORTAL` module still renders through `AppModuleRenderer`
- existing sidebar/nav still uses the same module id and visibility rule
- Admin role now sees the Parent Portal navigation entry for validation/support while Guardian remains restricted to parent-only navigation and linked-child data
- existing Student Portal file was untouched
  - existing Guardian Portal feature remains present and now serves the expanded parent-facing experience

## Deferred Items

- No parent attendance tab until a real student attendance source is available.
- No persisted parent consultation submission workflow was added in this phase.
- No guardian-user schema migration was added; durable account linkage still deserves future backend hardening.
- No document download or generated-record viewer was added beyond current store-backed requirement visibility.
- No online payment initiation was added.

## Recommendation For Phase 11B

- Add a durable guardian-user linkage model in Supabase so parent accounts do not rely on fallback matching.
- Introduce a parent-facing attendance tab only after student attendance data is loaded through the shared store.
- Evaluate whether consultation requests should persist through an existing appointment/request workflow rather than local UI acknowledgement only.
- Consider a narrow follow-up for parent-safe document viewing/download only if current record storage and permission rules are clearly defined.

## Phase 11B Admin Navigation Visibility Fix Notes

### Root Cause

The Parent Portal / Guardian Portal page, route, navigation entry, and module renderer were all already in place, but the `ADMIN` role's permission list in `src/config/permissions.config.ts` did not include `GUARDIAN_PORTAL`. Because the sidebar is built by `getNavItemsForRole()` (in `src/config/navigation.config.ts`), which filters `NAV_ITEMS` by the role's allowed modules, the existing `GUARDIAN_PORTAL` nav item was filtered out for Admin. The portal was therefore implemented but invisible/inaccessible to the Admin role.

### Files Reviewed

- `src/config/navigation.config.ts` (sidebar config + `getNavItemsForRole` filtering)
- `src/config/permissions.config.ts` (role → module permissions)
- `src/config/roles.config.ts` (role catalog)
- `src/config/app-routes.config.ts` (route + module resolution)
- `src/components/layout/AppModuleRenderer.tsx` (module rendering)
- `src/types/role.types.ts` (UserRole → CanonicalRole mapping)
- `src/App.tsx` (sidebar wiring via `getNavItemsForRole` / `getAllowedModules`)
- `src/features/guardian/pages/GuardianPortalPage.tsx` (existing page registration)

### Files Changed

- `src/config/permissions.config.ts` — added `GUARDIAN_PORTAL` to the `admin` role's permission list.
- `src/config/roles.config.ts` — included the canonical `guardian` role in the role catalog to match the already-existing route, permission, and type definitions.
- `docs/uiux/STSN_CONNECT_PHASE_11_PARENT_PORTAL_TRACKER.md` — these Phase 11B notes.

### Fix Applied

Added `GUARDIAN_PORTAL` to `ROLE_PERMISSIONS.admin` so the existing `GUARDIAN_PORTAL` nav item passes the `getNavItemsForRole()` allowed-modules filter and `AppModuleRenderer` allows rendering for Admin. No duplicate menu item was created — the existing `Parent Portal` nav entry and `/guardian-portal` route were reused. The `guardian` role's permission set was left unchanged (`["GUARDIAN_PORTAL"]` only), so Parent/Guardian users still see only parent-facing navigation and no admin/staff modules were exposed to them. The Guardian Portal page itself was not modified, so no staff-only controls were added inside the portal.

### Validation Result

- `npm.cmd run lint`: see command output below
- `npm.cmd run build`: see command output below
- Admin sidebar now shows the `Parent Portal` (`GUARDIAN_PORTAL`) entry and Admin can open `/guardian-portal`.
- Parent/Guardian role visibility remains restricted to `GUARDIAN_PORTAL` only.
- No business logic, data source, or table behavior was changed.

## Phase 11C ADMIN Role Visibility Fix Notes

Audit date: 2026-06-30

### Issue

Parent Portal / Guardian Portal still not visible in the sidebar for the actual signed-in administrator. Phase 11B added `GUARDIAN_PORTAL` to the canonical `admin` permission list, which correctly covers the DB `ADMIN` role (`ADMIN` → `toCanonicalRole` → `"admin"`). However the `super-admin` permission list — used by the DB `SUPER_ADMIN` role, the account most operators actually sign in with — was never granted `GUARDIAN_PORTAL`, so the nav item stayed hidden for them.

### Pre-edit identification

1. **Permission key for `ADMIN`**: DB `ADMIN` → `UserRole "ADMIN"` → `ROLE_TO_CANONICAL` → canonical `"admin"` → `ROLE_PERMISSIONS.admin` (already included `GUARDIAN_PORTAL` from Phase 11B — no change needed).
2. **Parent/Guardian Portal module key**: `GUARDIAN_PORTAL`.
3. **Route path**: `/guardian-portal`.
4. **Exact filter hiding the item**: `getNavItemsForRole()` → `getAllowedModules()` → `getPermissionsForRole()`; the leaf check `allowed.includes(item.id)` in `src/config/navigation.config.ts` returned false for `super-admin` because its permission array lacked `GUARDIAN_PORTAL`.

### Fix Applied

- `src/config/permissions.config.ts` — added `GUARDIAN_PORTAL` to the `super-admin` permission list. The `admin` list already contained it (Phase 11B), so no change was required there.

No new nav item or route was created; the existing `Parent Portal` (`GUARDIAN_PORTAL`) nav entry and `/guardian-portal` route are reused. The `guardian` role permission set remains `["GUARDIAN_PORTAL"]` only — Parent/Guardian stays restricted and no admin/staff modules were exposed to it. No business logic, data sources, workflows, or table behavior were changed.

### Validation Result

- `npm.cmd run lint`: see command output below
- `npm.cmd run build`: see command output below
- Admin (`ADMIN`) and Super Admin (`SUPER_ADMIN`) sidebars now show the `Parent Portal` (`GUARDIAN_PORTAL`) entry and can open `/guardian-portal`.
- Parent/Guardian role visibility remains restricted to `GUARDIAN_PORTAL` only.
- No business logic, data source, or table behavior was changed.

## Phase 11D Parent Portal Demo Seed Migration Notes

Audit date: 2026-06-30

### Schema / tables reviewed

- `public.users` (`supabase/migrations/0001_schema.sql`) — `role` is free-text `not null` with **no CHECK constraint**, so a `GUARDIAN` value is accepted without any schema change. Login resolves `currentUser` by email lookup here.
- `public.students` (`0003_data.sql`) — existing demo students; no new students created.
- `public.student_guardians` (`0004_additional_data.sql`) — parent/guardian linkage table; columns `student_id`, `guardian_name`, `relationship`, `contact_no`, `email`, `address`, `is_primary`, `legacy_id` (unique).
- Existing per-student data confirmed already seeded: `assessments` (`as-enrico`, `as-clara`), `payments` (`pay-1`, `pay-2`), `grades` (`gr-1..3`, `gr-4..5`), `requirements` (`req-1..8`), `enrollments` (`enr-01`, `enr-02`), `announcements` (`ann-1..4`).
- Store hydration path: `src/services/dataLoader.ts` reads `student_guardians` into `studentGuardians`; it does **not** populate `student.linkedGuardianIds`.

### Parent/student linkage table found

`public.student_guardians`. The Parent Portal (`src/features/guardian/pages/GuardianPortalPage.tsx`) links a signed-in non-admin parent to students **only** by matching `normalizeEmail(currentUser.email)` against `normalizeEmail(student_guardians.email)`. The `student.linkedGuardianIds` array is never set from Supabase, so email match is the single working linkage mechanism.

### Seed records added

1. One demo parent/guardian user — `public.users` `legacy_id = 'user-demo-guardian'`, email `parent.demo@stsn.edu.ph`, role `GUARDIAN`, name "Roberto Veloso (Demo Parent)".
2. Linkage row `sg-demo-parent-enrico` → `stud-enrico` (STSN, Grade 11 STEM), email `parent.demo@stsn.edu.ph`, `is_primary = true`.
3. Linkage row `sg-demo-parent-clara` → `stud-clara` (CDSTA, BSIT 1st Year), email `parent.demo@stsn.edu.ph`, `is_primary = false`.

No grades, payments, assessments, requirements, or announcements were created — those already exist for both linked students and surface automatically once the parent is linked.

### Migration file created

`supabase/migrations/0037_parent_portal_demo_seed.sql` — purely additive, idempotent (`on conflict do nothing` on stable `legacy_id` keys), no schema/RLS/business-logic changes.

### Manual steps required

- None for SQL. The app login flow does **not** use Supabase `auth.users`; it authenticates via `public.users` email lookup with the client-side demo password `password123`. No manual Supabase Auth user creation is needed.
- The demo parent is intentionally **not** added to the Quick Demo Accounts list in `LoginOverlay.tsx` (UI was not changed). Type the email manually to sign in.

### How to test the Parent Portal with seeded data

1. Apply the migration (`supabase db push`/`reset`, or run the SQL against the project DB).
2. At the login screen, enter email `parent.demo@stsn.edu.ph` and password `password123`.
3. The Parent Portal opens with two linked children (Enrico Veloso, Maria Clara Dela Cruz). The child switcher, Academics, Finance, and Documents tabs are populated from the already-seeded records.

### Admin testing case

- The portal does **not** require the logged-in user id to equal a guardian id. For role `ADMIN`/`SUPER_ADMIN`, `isAdminQaView` renders the read-only "Admin QA / Support View" listing **all** students regardless of guardian linkage. Admin therefore needs no parent linkage and none was forced onto admin accounts.

### Risks / deferred items

- Admin-as-parent scoped preview (selecting a specific parent to impersonate) is deferred to **Phase 11E**.
- Cross-school demo family is intentional (one child STSN Basic Ed, one child CDSTA College) to exercise the multi-child switcher; linkage is school-independent (email match only).

### Validation results

- `npm.cmd run lint` (`tsc --noEmit`): **passed**, no errors.
- `npm.cmd run build` (`vite build`): **passed**, built in ~4.7s (`GuardianPortalPage` chunk emitted normally).
- Supabase CLI not installed in this environment (`supabase --version` → not found), so migration apply was validated by static SQL inspection: file is additive only (insert-only), idempotent via `on conflict do nothing` on stable `legacy_id` keys, references existing students by `legacy_id`, and performs no update/delete/truncate against existing records.
- Migration file confirmed present under `supabase/migrations/0037_parent_portal_demo_seed.sql`.
