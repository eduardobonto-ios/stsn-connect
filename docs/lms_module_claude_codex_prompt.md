# Claude/Codex Prompt — Build LMS Module from Reference Image

## Objective

Use the attached LMS reference image as the UI/UX guide and replicate the LMS module inside our current application.

Do **not** copy the screenshot as a static image. Build it as real, reusable, responsive application pages using our existing project structure, Metronic-inspired theme, layout, sidebar, cards, buttons, tables, badges, forms, and styling conventions.

The goal is to create a complete LMS experience that looks and feels consistent with our current application.

---

## Enhancement Status — 2026-07-02 (visual + UX polish pass)

The LMS module was already implemented end-to-end (`src/features/lms/`, module + sub-page renderer, own Supabase tables, `useLmsData` hook, RBAC seed). This work **enhanced** every reference screen for closer visual/UX fidelity to the reference image. `tsc --noEmit` clean; `vite build` succeeds (LMS chunk ~128 kB).

- **Pass 1 — visual/UX polish** across all 10 screens (rings, charts, KPI strips, certificate gallery, breakdowns, teacher panels).
- **Pass 2 — Lesson Player deepening:** tabbed content (Resources / My Notes / Discussion, both persisted to `localStorage`) and an in-place Module Assessments launcher backed by the shared assessment runner.
- **Pass 3 — Student-only academic-portfolio dashboard** (new reference image): a dedicated `StudentDashboard.tsx` shown to `STUDENT`-role users on the `dashboard` sub-page (teachers/admins keep the operational `LmsDashboard`). Identity header (name / student no / derived academic status / enrolled-since), **GPA trajectory** line chart + cumulative GPA, **Program Completion** ring (lessons across enrolled courses), Course Performance cards with **class rank** + grade + syllabus progress + an "enroll elective" tile, and an Earned Certificates preview (View Credential / Share, "Show All" → Progress). All metrics derive from live LMS data (results → GPA, enrollments → rank, lesson progress → completion, certificates) — **no new tables / migrations needed.** `StudentProgress.tsx` was refocused to the detailed tracker (syllabus completion + full certificate gallery + activity) so nothing duplicates the dashboard; the module KPI strip is hidden on the student dashboard.

- **Pass 4 — removed the redundant global KPI strip** in `LmsModulePage`. Every sub-page already renders its own contextual KPIs (or the catalog's count hero), so the module-level strip above the tabs was stacking a second row of tiles on top of each section's own — most visible on Assessments (module strip + To Do/Submitted/Graded/Avg Score). The global strip is gone; each section keeps its purpose-built KPIs.

- **Pass 5 — Course Modules (lesson grouping + sequential unlock).** New **migration** `supabase/migrations/20260703120000_lms_course_modules.sql` adds the spec's missing `lms_course_modules` table + a nullable `lms_course_lessons.module_id` (idempotent, permissive demo RLS, and a guarded backfill that groups each seeded course's lessons into "Module 1 — Foundations" / "Module 2 — Advanced Concepts"). Types (`LmsCourseModule`, `LmsLesson.moduleId`), `useLmsData` (load + `moduleById`/`modulesByCourse` + module CRUD), and the Lesson Player outline now render **collapsible module groups** with per-module completion counts and **sequential locking** (a module is locked with a 🔒 until the previous module's required lessons are complete — only when enrolled; the player shows a "module locked" state and selection is blocked). Lessons without a module fall into a trailing "Additional Lessons" group; `LessonForm` gains an optional Module selector. Matches the reference Lesson Player's Module 1 / Module 2 (locked) sidebar.

Passes 1–4: no schema/data changes. Pass 5 adds one new table via migration (no existing table altered beyond an additive nullable column). All work is LMS-only.

**New reusable primitives** (`components/shared.tsx`): `ProgressRing` (brand navy→gold SVG donut), `MiniBarChart` (compact vertical bars), and `LineChart` (responsive SVG trend line w/ gold area fill).

| # | Screen | Status | What was enhanced |
|---|--------|--------|-------------------|
| 1 | LMS Dashboard | ✅ | **Role-aware:** students get `StudentDashboard` (academic portfolio — identity, GPA trajectory `LineChart`, Program Completion ring, course performance + class rank, certificates preview); teachers/admins get `LmsDashboard` (engagement ring, Upcoming Deadlines, Institutional Progress `MiniBarChart`, Active Enrollments) |
| 2 | Lesson Player (CourseDetails) | ✅ | "X / Y lessons complete" indicator; **tabbed content (Resources / My Notes / Discussion)** persisted to `localStorage`; **Module Assessments launcher** (embedded runner: Start Quiz → auto-grade → View Results in-place); **collapsible module outline with sequential unlock** (`lms_course_modules`, 🔒 locked modules, per-module completion) |
| 3 | Course Catalog | ✅ | Added catalog hero header + summary count cards (Published / My Courses / Subjects) above existing search, category/difficulty filters, and course grid |
| 4 | Student Progress | ✅ | Refocused as the detailed learning tracker (KPI strip, per-course **Syllabus Completion**, full **Earned Certificates gallery**, activity timeline) — portfolio/GPA/grades/ranks now live on the student dashboard to avoid duplication |
| 5 | Assignments & Assessments | ✅ | Added summary KPI strip (To Do / Submitted / Graded / Avg Score) above existing tabbed, searchable, status-aware list |
| 6 | Quiz & Exam Center | ✅ | Surfaced **Average Score** KPI; upcoming exams, recent results, exam tips already present |
| 7 | Active Examination Interface | ✅ | Added answered-progress bar in header + flagged-count in navigator (timer/auto-submit, flag, navigator grid + legend, confirm modal already present) |
| 8 | Assessment Results & Feedback | ✅ | Added **Performance Breakdown** (mastery per question type) + **Certification Readiness** card (score banner, KPIs, per-question review already present) |
| 9 | Question Builder & Assessment Mgmt | ✅ | Added summary KPI strip (Assessments / Published / Questions / To Grade); table, detail view, question editor, grading queue already present |
| 10 | Teacher Board / Content Mgmt | ✅ | Added **Student Enrollments** panel + **Live Activity** feed (KPI summary, quick tools, course table, recent submissions already present) |

---

## Important Context

We already have an existing application with a Metronic-inspired design/theme. Any new LMS page, component, table, route, or permission must follow the same architecture and styling approach already used in the project.

Before creating anything new, inspect the current project first:

- Existing routes
- Existing layouts
- Existing sidebar/menu structure
- Existing reusable components
- Existing Supabase migrations
- Existing RBAC/page rights implementation
- Existing tables that may already support LMS-like data
- Existing services/API patterns
- Existing demo seed data approach

Do not duplicate existing tables or components if they can be safely reused or extended.

---

## Reference Image Pages to Replicate

Create the LMS module based on the reference image. The image contains these pages/screens:

### 1. LMS Dashboard

Create a student LMS dashboard that includes:

- Welcome card
- Active enrollment summary
- Course progress widgets
- Active enrollments section
- Upcoming deadlines
- Institutional progress chart
- Recent activity list
- Quick action cards/buttons

### 2. Lesson Player

Create a lesson player page that includes:

- Video/content player area
- Course title and lesson title
- Lesson description/details
- Module/lesson sidebar
- Lesson completion state
- Previous/next lesson navigation
- Start quiz / continue lesson button
- Course progress indicator

### 3. Course Catalog

Create a course catalog page that includes:

- Catalog hero/header section
- Search bar
- Filters/categories
- Course cards
- Course thumbnails
- Course status badges
- Enroll/watch/continue buttons
- Summary count cards
- Empty state handling

### 4. Student Progress

Create a student progress page that includes:

- Academic performance portfolio layout
- Overall completion percentage
- Learning analytics summary
- Individual course performance cards
- Earned certificates section
- Performance chart/graph area
- Completion and grade indicators

### 5. Assignments & Assessments

Create an assignments and assessments page that includes:

- Academic hub layout
- Assignment list
- Assessment list
- Due date indicators
- Completion/submission status
- Action buttons such as View, Submit, Manage, or Continue
- Tabs or filters for upcoming, completed, overdue, and graded items

### 6. Quiz & Exam Center

Create an exam center dashboard that includes:

- Assessment center summary
- Average score
- Passed/failed/completed count
- Upcoming examinations
- Recent results
- Exam tips card
- Start exam buttons
- View schedule / view results buttons

### 7. Active Examination Interface

Create an active exam-taking interface that includes:

- Current question area
- Answer choices
- Question navigator grid
- Timer
- Flag for review option
- Previous/next navigation
- Submit exam button
- Answered/unanswered/flagged indicators
- Confirmation before final submission

### 8. Question Builder & Assessment Management

Create a teacher/admin question builder page that includes:

- Assessment/question management layout
- Question type selector
- Question editor form
- Answer options editor
- Correct answer selector
- Points field
- Difficulty/status fields
- Assessment settings sidebar
- Question preview section
- Save/add/update question buttons

### 9. Assessment Results & Feedback

Create an assessment results page that includes:

- Final score card
- Pass/fail status
- Time spent
- Performance breakdown
- Certification readiness card
- Review answers section
- Correct/incorrect answer indicators
- Explanation/feedback area
- Retake or back-to-dashboard actions

### 10. Teacher Board / Content Management

Create a teacher board page that includes:

- Content management dashboard
- Course/content list
- Student enrollments panel
- Live activity section
- Quick tools
- Course status badges
- Edit/manage actions
- Analytics summary cards

---

## Implementation Requirements

### UI/UX Requirements

- Follow the current Metronic-inspired theme.
- Reuse existing cards, tables, dropdowns, badges, tabs, buttons, modals, and layout components.
- Keep spacing, typography, border radius, shadows, and color usage consistent with the existing app.
- Use the reference image as design guidance, but adapt it to our current design system.
- Make all pages responsive for desktop and laptop demo usage.
- Avoid introducing a completely different design language.
- Do not hardcode everything into one page. Use reusable components.

### Routing/Menu Requirements

Add LMS routes and sidebar/menu entries for the following:

- LMS Dashboard
- Course Catalog
- Lesson Player
- Student Progress
- Assignments & Assessments
- Quiz & Exam Center
- Assessment Results
- Teacher Board / Content Management
- Question Builder / Assessment Management

Make sure routes follow the current route naming and folder conventions.

### RBAC / Page Rights Requirements

If the application already has RBAC, page assignment, or role permission logic:

- Add LMS pages to the page rights/permission system.
- Make sure permissions are wired properly.
- Ensure permissions take effect on next login if that is how the current app works.
- Suggested access:
  - Students: Dashboard, Catalog, Lesson Player, Progress, Assignments, Quiz Center, Results
  - Teachers: Teacher Board, Content Management, Question Builder, Assessment Management, Results
  - Admin/SuperAdmin: Full LMS access

Do not bypass existing authorization patterns.

---

## Supabase / Database Requirements

Before creating new tables, inspect all existing Supabase migrations first.

Create new Supabase migration files only for missing LMS data structures. Do not duplicate tables if similar ones already exist.

Recommended LMS tables to check or create:

### Core LMS Tables

- `lms_courses`
- `lms_course_modules`
- `lms_lessons`
- `lms_lesson_resources`
- `lms_enrollments`
- `lms_student_progress`

### Assignment and Assessment Tables

- `lms_assignments`
- `lms_assignment_submissions`
- `lms_assessments`
- `lms_assessment_questions`
- `lms_assessment_question_options`
- `lms_assessment_attempts`
- `lms_assessment_answers`
- `lms_assessment_results`

### Certificate and Activity Tables

- `lms_certificates`
- `lms_student_certificates`
- `lms_activity_logs`

### Optional Teacher/Admin Tables

- `lms_content_categories`
- `lms_course_tags`
- `lms_course_instructors`

---

## Suggested Table Design Guidelines

Use existing project conventions for:

- Primary keys
- UUID vs bigint IDs
- Created/updated timestamps
- Created by / updated by fields
- Soft delete fields if used in the project
- Status fields
- Foreign key naming
- Index naming
- RLS policies if the project uses Supabase RLS

Each table should include the proper relationships. For example:

- A course has many modules.
- A module has many lessons.
- A student can enroll in many courses.
- A lesson can be completed by many students.
- An assessment can have many questions.
- A question can have many options.
- A student can have many assessment attempts.
- An attempt can have many answers.
- Results should be linked to attempts and assessments.

Add indexes for fields commonly used in filtering and joins, such as:

- `course_id`
- `module_id`
- `lesson_id`
- `student_id`
- `assessment_id`
- `attempt_id`
- `status`
- `due_date`

---

## Seed Data Requirements

Create demo seed data suitable for school demo presentation.

Seed data should include:

- Sample courses
- Sample modules
- Sample lessons
- Sample assignments
- Sample assessments
- Sample questions and options
- Sample student enrollments
- Sample progress records
- Sample assessment attempts/results
- Sample certificates
- Sample activity logs

Use realistic but generic education-related content, such as:

- Algebra Basics
- Earth Science
- Public Speaking
- Computer Fundamentals
- Research Writing
- Constitutional Law
- Biology Quiz

Seed data should be enough to make every LMS page display meaningful data during the demo.

---

## Backend / Service Requirements

Follow the current backend/service/API pattern in the project.

Create or update services/API calls for:

- Fetching LMS dashboard summary
- Fetching course catalog
- Fetching course details
- Fetching lesson/module structure
- Updating lesson progress
- Enrolling in a course
- Fetching student progress
- Fetching assignments
- Submitting assignments if applicable
- Fetching assessments
- Starting an assessment attempt
- Saving assessment answers
- Submitting assessment attempts
- Calculating assessment results
- Fetching teacher board summary
- Managing questions and assessments

Do not create random patterns that are inconsistent with the project.

---

## Frontend Component Suggestions

Create reusable LMS components where applicable:

- `LmsStatCard`
- `CourseCard`
- `LessonPlayer`
- `LessonModuleSidebar`
- `ProgressRing`
- `AssignmentList`
- `AssessmentCard`
- `QuestionNavigator`
- `QuestionEditor`
- `AnswerOptionEditor`
- `AssessmentResultSummary`
- `CertificateCard`
- `TeacherCourseTable`
- `LmsActivityFeed`

Use existing shared components first before creating new ones.

---

## Data State and UX Behavior

Implement proper UI states:

- Loading state
- Empty state
- Error state
- Saving/submitting state
- Success message/toast
- Confirmation modal before submitting exam
- Validation messages for required fields

For the active exam interface:

- Prevent accidental final submission.
- Show confirmation modal before submit.
- Track answered, unanswered, and flagged questions.
- Keep navigation easy and visible.

---

## Development Phases

Do not implement everything in one messy change. Work by phases.

### Phase 1 — Project and Database Analysis

- Inspect current project structure.
- Inspect existing Supabase migrations.
- Identify reusable components and patterns.
- Identify existing RBAC/page rights logic.
- Provide a short implementation plan before changing files.

### Phase 2 — Database and Seed Data

- Create missing LMS migration tables.
- Create seed data for demo.
- Avoid duplicate tables.
- Add proper relationships and indexes.

### Phase 3 — LMS Routes and Layout

- Add LMS routes.
- Add LMS sidebar/menu entries.
- Wire routes to placeholder pages first if needed.
- Ensure layout follows existing app shell.

### Phase 4 — Student LMS Pages

Implement:

- LMS Dashboard
- Course Catalog
- Lesson Player
- Student Progress
- Assignments & Assessments

### Phase 5 — Assessment Pages

Implement:

- Quiz & Exam Center
- Active Examination Interface
- Assessment Results & Feedback

### Phase 6 — Teacher/Admin Pages

Implement:

- Teacher Board / Content Management
- Question Builder & Assessment Management

### Phase 7 — RBAC, Testing, and Cleanup

- Wire LMS pages to RBAC/page rights.
- Test route access per role.
- Test responsive layout.
- Test seed data display.
- Remove unused code.
- Provide final summary and manual test steps.

---

## Expected Output

After implementation, provide the following:

1. Summary of completed changes
2. List of created/modified files
3. List of Supabase migration files created
4. List of LMS tables created or reused
5. List of routes added
6. List of permissions/page rights added
7. Demo seed data summary
8. Manual testing steps
9. Known limitations or follow-up items

---

## Manual Testing Checklist

Please verify the following after implementation:

### Student Flow

- Student can open LMS Dashboard.
- Student can view available courses.
- Student can enroll or continue a course.
- Student can open lesson player.
- Student can move between lessons.
- Student progress updates correctly.
- Student can view assignments and assessments.
- Student can start an exam.
- Student can answer questions.
- Student can flag questions.
- Student can submit exam after confirmation.
- Student can view results and feedback.
- Student can view certificates/progress.

### Teacher/Admin Flow

- Teacher can open Teacher Board.
- Teacher can view managed courses/content.
- Teacher can open Question Builder.
- Teacher can create/edit questions.
- Teacher can manage assessment details.
- Teacher can view student progress/results.

### RBAC Flow

- Student users cannot access teacher/admin-only LMS pages.
- Teacher users can access teacher LMS pages.
- Admin/SuperAdmin users can access all LMS pages.
- LMS menu visibility follows existing permission logic.
- Permission changes take effect based on the current app behavior.

### UI/UX Flow

- Pages are responsive.
- Cards, tables, badges, and buttons match the current app style.
- Loading, empty, and error states are handled.
- No console errors.
- No broken routes.
- No duplicate menu items.

---

## Important Reminders

- Use the screenshot as a visual reference only.
- Do not create a static screenshot replica.
- Build real functional pages.
- Retain the current Metronic-inspired theme.
- Reuse existing components and styles.
- Inspect existing migrations before creating new tables.
- Create Supabase migrations for any new tables.
- Add seed data for demo purposes.
- Wire the LMS module into the actual app routes, menus, services, and permissions.
- Keep the implementation clean, modular, and maintainable.
