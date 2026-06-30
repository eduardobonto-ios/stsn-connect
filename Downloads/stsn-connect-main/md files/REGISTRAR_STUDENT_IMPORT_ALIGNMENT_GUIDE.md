# Registrar Student Masterlist Import Alignment Guide

**Project:** STSN Connect / Theresian Connect  
**Target module:** Registrar  
**Recommended file path:** `src/features/registrar/REGISTRAR_STUDENT_IMPORT_ALIGNMENT_GUIDE.md`  
**Source Excel reviewed:** `SY 2026-2027 TF ASSESSMENT.xlsx`  
**Primary sheet to use:** `DATABASE`

---

## 1. Purpose

This guide defines the production-safe approach for importing the listed students from the Excel masterlist into the current STSN Connect database through the Registrar module.

The import should not directly insert spreadsheet rows into `students`. The correct production approach is:

1. Upload and parse the Excel file.
2. Save the parsed rows into Registrar import staging tables.
3. Validate and normalize the data.
4. Preview errors, warnings, duplicates, and ready rows.
5. Commit only validated rows into the official tables.
6. Store an import audit trail for traceability and rollback investigation.

---

## 2. Current Project Findings

Based on the current `stsn-connect.zip`, the Registrar module already has a Bulk Import tab, but it is still a mock flow.

Current relevant files:

```text
src/features/registrar/pages/RegistrarModulePage.tsx
src/services/store.ts
src/services/dataLoader.ts
src/services/supabaseCrud.ts
src/types/index.ts
src/types/database.types.ts
supabase/migrations/0001_schema.sql
supabase/migrations/0004_additional_data.sql
```

### 2.1 Progress update - 2026-06-24

Status:

```text
Phase 1 database migration completed; type wiring, Grade 11 SHS Registrar enrollment grouping,
Class Sectioning SHS fallback, CSV template, CSV import preview, and valid-row upload completed.
Supabase staging service, transactional RPC commit, and XLSX parsing are not implemented yet.
```

Completed in this review:

```text
- Re-read this Registrar import alignment guide.
- Re-read AI_PROJECT_CODING_STANDARD.md and confirmed scope rules.
- Inspected source touchpoints for Grade 11 / Grade 12, SHS, strand/track, enrollment, assessment, sectioning, and reporting.
- Created Registrar import staging/profile migration files after the current latest migration.
- Added TypeScript domain/database types for students.lrn, student_registrar_profiles, registrar_import_batches, and registrar_import_rows.
- Updated student loading to include students.lrn.
- Updated Registrar Basic Ed enrollment grouping so Grade 11 and Grade 12 are classified by Senior High School academic level and use Strand / Track.
- Confirmed Cashier, Accounting, Reports, and Curriculum do not currently require code changes for the Grade 11 SHS alignment.
- Adjusted Class Sectioning Senior High detection fallback so Grade 11/12 names are treated as SHS even when setup numeric levels differ.
- Added a Registrar student masterlist CSV template under public/templates for Registrar copy/paste import preparation.
- Added a CSV parser/normalizer for the template with LRN duplicate checks, required field checks, and Grade 11/12 strand validation.
- Replaced the mock import drop action with CSV file selection/drop preview and validation summary.
- Added commit handling for valid/warning rows only through the existing student creation path.
- Excluded error and duplicate rows from upload and added CSV downloads for correction/review.
- Kept Supabase staging/RPC commit work pending for the next production hardening phase.
```

Important scope decision:

```text
The Grade 11 move/classification adjustment was applied only where approved by the user:
Registrar enrollment/import alignment and Class Sectioning fallback validation.
Cashier, Accounting, Reports, and Curriculum were reviewed but not changed.
```

Current migration numbering note:

```text
The project now contains migrations through 0026_hr_demo_data_optional.sql.
Registrar import migrations were added using the next available prefixes:
- 0027_registrar_student_import_staging.sql
- 0028_registrar_student_import_rls.sql
Do not reuse older suggested numbers such as 0020-0022 because those numbers already exist.
```

Current Registrar bulk import behavior:

```text
RegistrarModulePage.tsx
- activeSubTab supports: directory | bulk_import
- Bulk Import accepts the official CSV template and parses local preview rows
- Validation summary shows total, ready, warning, error, and duplicate counts
- Commit uploads only valid and warning rows into official student records
- Rows with status error or duplicate are excluded from upload
- Error and duplicate rows can be downloaded as CSV files for correction
- No XLSX parsing yet; xlsx dependency was not added
- No Supabase staging/import RPC commit yet
```

Current database tables that can already receive some imported data:

```text
students
student_guardians
requirements
enrollments
assessments / assessment-related tables, if later needed
```

Important existing table notes:

```text
students.student_no is required and unique.
students.legacy_id is unique but optional.
students currently has no dedicated lrn column.
student_guardians already exists and can store parent/guardian details.
requirements already exists and can store submitted/pending document status.
```

Because the Excel has an official LRN column, the project should add a proper `lrn` storage strategy instead of forcing LRN into `student_no` only.

---

## 3. Excel DATABASE Sheet Summary

The `DATABASE` sheet should be treated as the source of truth for this import.

Observed structure:

```text
Header grouping row: Row 1
Actual column header row: Row 2
Student data starts: Row 3
Last observed row: Row 997
Detected student-like records: 917
Last detected column: AX
```

The workbook also contains these sheets:

```text
DATABASE
ONLINE
ACCTNG
1 ADMISSION
LEDGER
ENROLLEES
GMC
MANUAL (K-10)
MANUAL (SHS)
ID
SUMMARY
Accounting
SUMMARY 2
NAMES
ESC
```

For the first production import, use only `DATABASE`. Other sheets can be reviewed later for accounting ledger, enrolled-only lists, manual assessment, and ID generation.

---

## 4. Data Quality Findings from DATABASE Sheet

These checks were observed from the uploaded workbook and should be included in the validation process.

| Check | Result |
|---|---:|
| Total student-like rows | 917 |
| Rows with missing or placeholder LRN | 20 |
| Duplicate LRN values found | 2 duplicate LRN groups |
| Rows with missing email | 11 |
| Rows with invalid-looking email | 13 |
| Rows with missing birth date | 1 |
| Rows with missing gender | 1 |
| Rows with missing grade level | 1 |

Observed student status values:

```text
Continuing
New Student
```

Observed gender values need normalization:

```text
Male
Female
FEMALE
```

Observed grade/year-level values include:

```text
Kinder 1
Kinder 2
Grade 1
Grade 2
Grade 3
Grade 4
Grade 5
Grade 6
Grade 7
Grade 8
Grade 9
Grade 10
Grade 11
Grade 11 - Academics
Grade 11 - Tech-Pro
Grade 12
Grade 12 - HUMSS
Grade 12 - STEM
```

Recommended normalization:

```text
Grade 11 - Academics -> yearLevel: Grade 11, trackOrCourse: Academics
Grade 11 - Tech-Pro   -> yearLevel: Grade 11, trackOrCourse: Tech-Pro
Grade 12 - HUMSS      -> yearLevel: Grade 12, trackOrCourse: HUMSS
Grade 12 - STEM       -> yearLevel: Grade 12, trackOrCourse: STEM
Kinder 1              -> yearLevel: Kinder 1, trackOrCourse: Preschool
Kinder 2              -> yearLevel: Kinder 2, trackOrCourse: Preschool
Grade 1 to Grade 6    -> trackOrCourse: Elementary
Grade 7 to Grade 10   -> trackOrCourse: Junior High
Grade 11 to Grade 12  -> use STRAND column when available, otherwise infer from grade suffix
```

Grade 11 / SHS alignment decision:

```text
Grade 11 must be treated as Senior High School for Basic Education workflows.
Grade 11 should keep yearLevel = Grade 11.
The strand/track should come from AE Strand when present, otherwise from the grade suffix or import mapping.
Do not classify Grade 11 under Junior High School.
```

The import normalizer should therefore map:

```text
Grade 11              -> yearLevel: Grade 11, academicStage: Senior High School, trackOrCourse: AE Strand if present
Grade 11 - Academics  -> yearLevel: Grade 11, academicStage: Senior High School, trackOrCourse: Academics
Grade 11 - Tech-Pro   -> yearLevel: Grade 11, academicStage: Senior High School, trackOrCourse: Tech-Pro
```

If a future implementation introduces a dedicated academic stage field, use a normalized value such as:

```text
academicStage: Senior High School
```

Until then, the project should continue using the existing fields:

```text
department: Basic Education
yearLevel: Grade 11
trackOrCourse: strand/track value
```

---

## 5. DATABASE Sheet Column Mapping

Use row 2 as the actual header row.

### 5.1 Core student fields

| Excel Column | Excel Header | Target |
|---|---|---|
| B | Learner's Reference Number (LRN) | `students.lrn` or `student_registrar_profiles.lrn` |
| C | Student's Last Name | `students.last_name` |
| D | Student's Given Name | `students.first_name` |
| E | Student's Middle Name | `students.middle_name` |
| F | Name Extension | `student_registrar_profiles.name_extension` |
| G | Student Status | `student_registrar_profiles.student_status` |
| H | Birth Date | `students.birthday` |
| I | Age | Do not store as source of truth; compute from birthday if needed |
| J | Birth Place | `students.birthplace` |
| K | Gender | `students.gender` |
| L | Citizenship | `students.nationality` |
| M | Religion | `students.religion` |
| N | Complete Address | `students.address` |
| U | Email of Parent/Guardian | `students.email` only if student email is unavailable; better store under guardian email |
| V | Grade / Level | `students.year_level` and possibly `students.track_or_course` |

### 5.2 Parent and guardian fields

| Excel Column | Excel Header | Target |
|---|---|---|
| O | Father's Full Name | `student_guardians.guardian_name`, relationship `Father` |
| P | Father's Contact Number | `student_guardians.contact_no` |
| Q | Mother's Full Name | `student_guardians.guardian_name`, relationship `Mother` |
| R | Mother's Contact Number | `student_guardians.contact_no` |
| S | Guardian | `student_guardians.relationship` or primary guardian remarks |
| T | Guardian's Contact Number | `student_guardians.contact_no` for primary guardian |
| U | Email of Parent/Guardian | `student_guardians.email` |

Recommended production logic:

```text
1. Create father guardian row if father name is present.
2. Create mother guardian row if mother name is present.
3. Mark primary guardian using the Guardian column when it clearly indicates Mother/Father/Guardian.
4. If primary guardian cannot be confidently resolved, set Mother as primary when present, otherwise Father, otherwise create one generic Guardian row.
5. Do not overwrite existing guardian records without duplicate detection.
```

### 5.3 Academic and enrollment remarks

| Excel Column | Excel Header | Target |
|---|---|---|
| AD | Grade / Level | Backup/validated grade level source |
| AE | Strand | `students.track_or_course` or `student_registrar_profiles.strand` |
| AF | Student Status | `student_registrar_profiles.student_status` |
| AG | ESC/QVR No | `student_registrar_profiles.esc_qvr_no` |
| AH | Voucher Status | `student_registrar_profiles.voucher_status` |
| AI | With Admission Slip | `student_registrar_profiles.admission_slip_status` |
| AJ | Enrolled | map to `students.enrollment_status` carefully |
| AR | Previous School | `student_registrar_profiles.previous_school` |
| AS | Referral | `student_registrar_profiles.referral_source` |

Recommended enrollment status mapping:

```text
AJ = ENROLLED  -> students.enrollment_status = Enrolled
AJ = RESERVED  -> students.enrollment_status = Pending
AJ = WITHDRAW  -> students.enrollment_status = Rejected or Draft, depending on school decision
Blank AJ       -> if AF/G is New Student or Continuing, keep Pending until Registrar validates
```

### 5.4 Payment preference and accounting remarks

| Excel Column | Excel Header | Target |
|---|---|---|
| W-AA | Preferred Mode of Payment | `student_registrar_profiles.preferred_mode_of_payment` |
| AK | Discount / Reservation Description | `student_registrar_profiles.discount_description` |
| AL | Amount Discount | `student_registrar_profiles.discount_amount` |
| AM | Amount Reservation | `student_registrar_profiles.reservation_amount` |
| AN | Accounting Mode of Payment | `student_registrar_profiles.accounting_mode_of_payment` |
| AO | Date | `student_registrar_profiles.accounting_or_date` |
| AP | OR Number | `student_registrar_profiles.accounting_or_number` |
| AQ | Assessed By | `student_registrar_profiles.assessed_by` |

Do not create official payments or ledger transactions from this first import unless the Accounting module explicitly validates and approves the records. For Registrar import, store these as historical/import remarks only.

### 5.5 Requirement fields

| Excel Column | Excel Header | Target requirement name |
|---|---|---|
| AT | Birth Certificate | Birth Certificate |
| AU | GMC | Good Moral Certificate |
| AV | SF9 | SF9 / Report Card |
| AW | Voucher Certificate | Voucher Certificate |
| AX | SF10 | SF10 |

Recommended requirement status mapping:

```text
OK   -> Submitted + Verified
ok   -> Submitted + Verified
PC   -> Pending, remarks: Photocopy / pending clear copy
TEMP -> Pending, remarks: Temporary copy
NSO  -> Submitted, remarks: NSO copy
OG   -> Submitted, remarks: Original copy
LCR/LRC -> Submitted, remarks: Local Civil Registrar copy
Blank -> Pending
```

---

## 6. Required Supabase Migration Files

Create new migration files under:

```text
supabase/migrations/
```

Recommended migration names from the original planning pass:

```text
0020_registrar_student_import_staging.sql
0021_registrar_student_import_rls.sql
0022_registrar_student_import_functions.sql
```

Adjust the numeric prefix if the project already has newer migrations.

Current repository note from the 2026-06-24 review:

```text
The repository already had migrations through 0026_hr_demo_data_optional.sql.
Registrar import Phase 1 migrations were added as 0027 and 0028.
```

---

## 7. Recommended Database Design

### 7.1 Add dedicated LRN support

Do not rely only on `legacy_id` for LRN. The LRN is a real learner identifier and should be queryable.

Recommended migration:

```sql
alter table public.students
add column if not exists lrn text;

create unique index if not exists uq_students_lrn_not_blank
on public.students (lrn)
where lrn is not null and trim(lrn) <> '';

create index if not exists idx_students_lrn
on public.students (lrn);
```

### 7.2 Add Registrar profile extension table

Use a separate extension table for Registrar-specific fields that do not belong in the core `students` table.

```sql
create table if not exists public.student_registrar_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  lrn text,
  name_extension text,
  student_status text,
  strand text,
  esc_qvr_no text,
  voucher_status text,
  admission_slip_status text,
  import_enrollment_marker text,
  preferred_mode_of_payment text,
  comments_inquiries text,
  confirmation_status text,
  discount_description text,
  discount_amount numeric,
  reservation_amount numeric,
  accounting_mode_of_payment text,
  accounting_or_date date,
  accounting_or_number text,
  assessed_by text,
  previous_school text,
  referral_source text,
  source_import_batch_id uuid,
  source_sheet_row int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_registrar_profiles_student
on public.student_registrar_profiles (student_id);

create index if not exists idx_student_registrar_profiles_lrn
on public.student_registrar_profiles (lrn);
```

### 7.3 Add import batch audit table

```sql
create table if not exists public.registrar_import_batches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  school_year text not null,
  academic_unit text not null default 'basic-ed',
  import_type text not null default 'student_masterlist',
  source_file_name text not null,
  source_sheet_name text not null default 'DATABASE',
  header_row int not null default 2,
  data_start_row int not null default 3,
  status text not null default 'draft'
    check (status in ('draft','validated','committing','committed','failed','cancelled')),
  total_rows int not null default 0,
  valid_rows int not null default 0,
  warning_rows int not null default 0,
  error_rows int not null default 0,
  duplicate_rows int not null default 0,
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  committed_by uuid references public.users(id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 7.4 Add import row staging table

```sql
create table if not exists public.registrar_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.registrar_import_batches(id) on delete cascade,
  sheet_row_number int not null,
  row_hash text,
  raw_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,
  import_status text not null default 'parsed'
    check (import_status in ('parsed','valid','warning','error','duplicate','skipped','committed')),
  matched_student_id uuid references public.students(id) on delete set null,
  committed_student_id uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, sheet_row_number)
);

create index if not exists idx_registrar_import_rows_batch
on public.registrar_import_rows (batch_id);

create index if not exists idx_registrar_import_rows_status
on public.registrar_import_rows (import_status);

create index if not exists idx_registrar_import_rows_lrn
on public.registrar_import_rows ((normalized_data->>'lrn'));
```

---

## 8. Production Import Flow

### Step 1: Upload file in Registrar module

Target page:

```text
src/features/registrar/pages/RegistrarModulePage.tsx
```

The first real upload interaction is now in place for the CSV template preview.
The remaining work is to replace the temporary state names with production
batch/staging state and wire Supabase staging/commit actions.

Current temporary preview state still to refactor:

```text
mockFileName
mockRowsPreview
bulkImportSuccess
```

Recommended replacement state:

```ts
type ImportStep = 'idle' | 'parsed' | 'validated' | 'committing' | 'committed' | 'failed';

const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
const [importBatchId, setImportBatchId] = useState<string | null>(null);
const [importRowsPreview, setImportRowsPreview] = useState<RegistrarImportPreviewRow[]>([]);
const [importSummary, setImportSummary] = useState<RegistrarImportSummary | null>(null);
const [importStep, setImportStep] = useState<ImportStep>('idle');
```

### Step 2: Parse Excel DATABASE sheet

Recommended new files:

```text
src/features/registrar/types/studentImport.types.ts
src/features/registrar/utils/studentImportColumnMap.ts
src/features/registrar/utils/studentImportParser.ts
src/features/registrar/utils/studentImportNormalizer.ts
src/features/registrar/services/registrarStudentImportService.ts
```

The current project does not include an Excel parser dependency. Add one of these approaches:

Preferred for current React-only architecture:

```bash
npm install xlsx
```

Then parse the workbook client-side and stage normalized rows through Supabase.

Alternative stronger production approach:

```text
Upload file to Supabase Storage / import bucket
Call a Supabase Edge Function or backend endpoint to parse the workbook server-side
Write import batch + rows inside the backend process
```

Use the client-side approach first only if no backend/edge function is planned yet.

### Step 3: Validate rows before committing

Minimum required validations:

```text
Required:
- lastName
- firstName
- gender
- birthday
- grade/yearLevel

LRN validation:
- LRN should be required for official DepEd records when available
- rows with blank LRN may be allowed only as warning if the student is new and Registrar confirms
- duplicate LRN in same batch = error or duplicate status
- LRN already existing in students = matched existing student, not automatic duplicate insert

Email validation:
- invalid email should be warning, not hard stop
- parent/guardian email should be stored in guardian profile unless confirmed as student email

Phone validation:
- normalize to PH-style digits where possible
- keep original in raw_data

Grade validation:
- normalize Grade 11/12 suffixes into yearLevel + trackOrCourse
- use AE Strand column when available

Requirement validation:
- normalize requirement values into Submitted/Pending/Rejected + remarks
```

### Step 4: Preview with STSNDataTable

Use the reusable DataTable component:

```text
src/components/common/STSNDataTable.tsx
```

Preview columns should include:

```text
Row No.
LRN
Student Name
Gender
Birthdate
Grade Level
Track/Strand
Student Status
Import Status
Errors
Warnings
Matched Existing Student
```

Do not use native alert/confirm. Use the existing modern dialog pattern:

```text
src/components/common/useAppDialog.tsx
src/components/common/AppConfirmDialog.tsx
src/components/common/AppPromptDialog.tsx
src/components/common/AppToast.tsx
```

### Step 5: Commit using a database function

For production safety, commit the batch using one Supabase RPC/Postgres function so the operation can be transactional.

Recommended function name:

```sql
public.commit_registrar_student_import_batch(p_batch_id uuid, p_committed_by uuid)
```

Expected commit behavior:

```text
1. Lock the selected import batch.
2. Reject commit if batch is already committed.
3. Commit only rows with status valid or warning.
4. For each row:
   - Find existing student by lrn if present.
   - If no LRN, match cautiously by normalized name + birthday + grade level.
   - Insert or update students.
   - Upsert student_registrar_profiles.
   - Upsert guardian records.
   - Upsert requirement records.
5. Mark committed rows as committed.
6. Update batch status and counters.
7. Return committed/updated/skipped/error counts.
```

Do not create payments, ledger entries, or official accounting records during Registrar import unless the Accounting module has a separate approval flow for those values.

---

## 9. Store and Data Loader Updates

### 9.1 Types

Update:

```text
src/types/index.ts
src/types/database.types.ts
```

Add types:

```ts
export interface StudentRegistrarProfile {
  id: string;
  studentId: string;
  lrn?: string;
  nameExtension?: string;
  studentStatus?: string;
  strand?: string;
  escQvrNo?: string;
  voucherStatus?: string;
  admissionSlipStatus?: string;
  importEnrollmentMarker?: string;
  preferredModeOfPayment?: string;
  commentsInquiries?: string;
  confirmationStatus?: string;
  discountDescription?: string;
  discountAmount?: number;
  reservationAmount?: number;
  accountingModeOfPayment?: string;
  accountingOrDate?: string;
  accountingOrNumber?: string;
  assessedBy?: string;
  previousSchool?: string;
  referralSource?: string;
}

export interface RegistrarImportBatch {
  id: string;
  schoolId?: string;
  schoolYear: string;
  academicUnit: string;
  importType: string;
  sourceFileName: string;
  sourceSheetName: string;
  status: 'draft' | 'validated' | 'committing' | 'committed' | 'failed' | 'cancelled';
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
}

export interface RegistrarImportPreviewRow {
  id?: string;
  sheetRowNumber: number;
  lrn?: string;
  fullName: string;
  gender?: string;
  birthday?: string;
  yearLevel?: string;
  trackOrCourse?: string;
  studentStatus?: string;
  importStatus: 'parsed' | 'valid' | 'warning' | 'error' | 'duplicate' | 'skipped' | 'committed';
  errors: string[];
  warnings: string[];
  matchedStudentId?: string;
}
```

### 9.2 Store actions

Update:

```text
src/services/store.ts
```

Add actions:

```ts
createRegistrarImportBatch: (payload) => Promise<RegistrarImportBatch>;
stageRegistrarImportRows: (batchId, rows) => Promise<void>;
validateRegistrarImportBatch: (batchId) => Promise<RegistrarImportSummary>;
commitRegistrarImportBatch: (batchId) => Promise<RegistrarImportSummary>;
loadRegistrarImportRows: (batchId) => Promise<RegistrarImportPreviewRow[]>;
```

Keep heavy parsing/normalization out of `RegistrarModulePage.tsx`.

### 9.3 Data loader

Update:

```text
src/services/dataLoader.ts
```

Load only official committed data by default:

```text
students
student_guardians
requirements
student_registrar_profiles
```

Do not load all import row staging data on app startup. Import rows can be loaded only when Registrar opens a specific batch.

---

## 9A. Grade 11 Senior High School Alignment Impact Review

This section tracks the requested Grade 11 adjustment. It is intentionally a review/approval gate before any code changes outside this guide.

### 9A.1 Requested business rule

```text
Grade 11 belongs to Senior High School.
Grade 11 students should use Strand / Track values.
Enrollment and adjacent modules should not treat Grade 11 as Junior High School.
```

### 9A.2 Source areas found during review

Potentially affected files/modules:

```text
src/features/registrar/pages/RegistrarModulePage.tsx
- New student enrollment form defaults to Senior High School / Grade 11 / STEM for Basic Ed.
- BE_STRANDS_BY_LEVEL maps Senior High School year levels to Basic Education courses with durationYears = 2.
- Subject loading filters Basic Education subjects by trackOrCourse and yearLevel.
- Clear & Enroll section matching uses department + yearLevel + trackOrCourse.

src/services/store.ts
- submitNewEnrollment currently treats non-College students as Basic Education and labels tuition as SHS Tuition Fee (Flat).
- Requirement defaults differ only by College vs Basic Education, not by Preschool/Elementary/JHS/SHS.

src/services/mockAssessmentService.ts
- Grade 11 and Grade 12 already receive SHS lab fee adjustment behavior by strand/program code.
- Tuition fallback currently uses Grade 11 when no exact tuition fee schedule row is found.

src/features/class-sectioning/pages/ClassSectioningModulePage.tsx
- Senior High detection already uses academicLevel containing senior/shs or numeric level 11/12.
- Available strand list is shown for Senior High year levels and matched by strandOrTrack.

src/features/curriculum/pages/CurriculumManagementPage.tsx
- Subject/curriculum records use department, yearLevel, and track/course fields.
- Any Grade 11 SHS adjustment may require validating subject and curriculum setup data.

src/features/cashier/pages/CashierModulePage.tsx
- Academic display lines use Basic Ed vs College labels from accounting config.
- No direct Grade 11 classification change should be made without confirming billing wording.

src/features/accounting/pages/AccountingModulePage.tsx
- Accounting derives Basic Ed vs College from student.department.
- Grade 11 remains Basic Education, but billing and assessment labels may need SHS-specific wording.

src/features/reports/data/registrarReports.ts
- Enrollment reports group by department, yearLevel, section, status, and track/course.
- If a separate Senior High grouping is desired, report grouping needs explicit approval.

src/config/schools.config.ts
src/types/school.types.ts
src/services/academicUnitScopeService.ts
- Current top-level academic units are only basic-ed and college.
- Senior High is currently a Basic Education stage, not a separate academic unit.
```

### 9A.3 Approval required before code changes

Before changing Enrollment or adjacent modules, confirm which scope is approved:

```text
[ ] Registrar import normalization only:
    Normalize Grade 11 rows as Basic Education + Grade 11 + strand/track.

[ ] Registrar Enrollment section:
    Ensure the Basic Ed enrollment form, subject selection, and Clear & Enroll flow consistently treat Grade 11 as Senior High School.

[ ] Class Sectioning:
    Validate or adjust Grade 11 section creation and student assignment so Grade 11 requires SHS strand/track matching.

[ ] Curriculum / Subjects:
    Validate or adjust Grade 11 subject/curriculum filters so SHS strands drive subject availability.

[ ] Cashier / Accounting assessment display:
    Review labels and fee display for Grade 11 as Senior High School without changing official accounting records unexpectedly.

[ ] Registrar Reports:
    Add Senior High-specific grouping/filtering if reports need to separate Preschool, Elementary, Junior High, and Senior High inside Basic Education.
```

Recommended first implementation scope:

```text
Start with Registrar import normalization and Registrar Enrollment section only.
Do not modify Cashier, Accounting, Curriculum, Sectioning, or Reports until specifically approved.
```

---

## 10. UI / UX Requirements for Registrar Module

Replace the mock import page with a production-grade flow:

```text
1. Select Import Type
   - Student Masterlist
   - Advisory Roster Assignments, later phase only

2. Upload Excel
   - Show selected file name
   - Validate extension .xlsx/.xls/.csv
   - Show source sheet selection default DATABASE

3. Parse Preview
   - Show first 20-50 rows
   - Show total row count
   - Show detected column mapping

4. Validation Summary
   - Total rows
   - Ready to commit
   - Warnings
   - Errors
   - Duplicate LRN
   - Existing student matches

5. Error Review
   - Use STSNDataTable
   - Add filters: All, Ready, Warnings, Errors, Duplicates
   - Error column should be readable and wrapped

6. Commit
   - Use modern confirm dialog
   - Disable commit if there are hard errors
   - Commit only valid/warning rows after confirmation

7. Completion
   - Show committed count
   - Show skipped count
   - Refresh student directory
   - Keep import batch history accessible
```

Recommended UI cards:

```text
Total Rows
Ready Rows
Warning Rows
Error Rows
Duplicate LRN
Existing Student Matches
```

---

## 11. Important Production Rules

Follow these rules strictly:

```text
Do not insert directly into students from the file drop event.
Do not use mock rows after implementing real import.
Do not overwrite existing students without match detection.
Do not treat blank LRN rows as safe inserts without warning.
Do not create accounting payments or ledger entries from Registrar import.
Do not expose raw PII in console logs.
Do not store uploaded files permanently unless a clear retention policy exists.
Do not use native alert/confirm.
Do not modify unrelated modules.
```

Production-safe behavior:

```text
Raw spreadsheet row is preserved in registrar_import_rows.raw_data.
Normalized data is preserved in registrar_import_rows.normalized_data.
Every batch has uploaded_by, uploaded_at, committed_by, committed_at.
Every row has source sheet row number.
Every commit result can be audited later.
```

---

## 12. Suggested Implementation Phases

### Phase 1: Database staging and profile migration

Scope:

```text
- Add students.lrn
- Add student_registrar_profiles
- Add registrar_import_batches
- Add registrar_import_rows
- Add indexes
- Add RLS policies following current project pattern
```

Do not change UI yet except types if needed.

### Phase 2: Excel parser and mapper

Scope:

```text
- Add xlsx dependency if using client-side parser
- Create studentImportColumnMap.ts
- Create studentImportParser.ts
- Create studentImportNormalizer.ts
- Parse DATABASE sheet row 2 headers and row 3+ data
- Convert Excel serial birth dates to ISO date yyyy-mm-dd
- Normalize gender, grade/yearLevel, strand, phones, email, payment terms, requirements
```

### Phase 3: Registrar import service and store actions

Scope:

```text
- Create registrarStudentImportService.ts
- Create batch
- Stage rows
- Validate rows
- Load preview rows
- Commit batch through Supabase RPC
- Update store actions
```

### Phase 4: Registrar UI replacement

Scope:

```text
- Replace temporary CSV-only preview state names with production import state
- Expand file input/drop handling to XLSX or backend parsing when approved
- Add STSNDataTable preview
- Add summary cards
- Add filter chips
- Add modern confirmation dialog
- Add success/error toast
- Refresh student directory after successful commit
```

### Phase 5: Requirements and guardians mapping

Scope:

```text
- Create/update student_guardians from father/mother/guardian fields
- Create/update requirements from AT-AX
- Avoid duplicate guardian records
- Preserve original values in import raw data
```

### Phase 6: Accounting-safe handoff

Scope:

```text
- Keep AK-AQ values in student_registrar_profiles only
- Do not create payment records
- Later Accounting module can review imported reservation/discount/payment remarks and approve them into official accounting tables
```

---

## 13. Credit-Efficient Claude/Codex Prompt

Use this prompt after placing this MD file in the Registrar module.

```text
You are working on STSN Connect.

Before making changes, read and follow:
- AI_PROJECT_CODING_STANDARD.md
- src/features/registrar/REGISTRAR_STUDENT_IMPORT_ALIGNMENT_GUIDE.md

Goal:
Implement the production-safe Registrar Student Masterlist Import for the Excel DATABASE sheet.

Important:
- Do not modify unrelated modules.
- Do not replace the whole Registrar page.
- Keep existing Registrar UI/UX styling and use STSNDataTable.
- Do not use native alert/confirm; use existing modern dialog/toast components.
- Do not insert spreadsheet rows directly into students from the file drop event.
- Use Supabase staging tables first, then validate, preview, and commit.
- Do not create accounting payments or ledger entries from the Registrar import.

Phase requested in this run:
[PUT ONLY ONE PHASE HERE]

Implementation standards:
- Database changes must be new files under supabase/migrations only.
- Use production-safe migration naming after the latest existing migration number.
- Preserve raw spreadsheet row data in registrar_import_rows.raw_data.
- Preserve normalized data in registrar_import_rows.normalized_data.
- Add row-level validation errors/warnings.
- Use students.lrn or student_registrar_profiles.lrn as the official LRN storage strategy.
- Support idempotent matching by LRN and cautious fallback matching by normalized name + birthday.
- Update src/types/database.types.ts and src/types/index.ts only as needed.
- Keep heavy parsing/mapping logic outside RegistrarModulePage.tsx.

Excel DATABASE mapping:
- Row 2 is the header row.
- Data starts at row 3.
- B = LRN
- C = Last Name
- D = Given Name
- E = Middle Name
- F = Name Extension
- G/AF = Student Status
- H = Birth Date
- J = Birth Place
- K = Gender
- L = Citizenship/Nationality
- M = Religion
- N = Complete Address
- O/P = Father name/contact
- Q/R = Mother name/contact
- S/T/U = Guardian relationship/contact/email
- V/AD = Grade Level
- AE = Strand
- AG = ESC/QVR No
- AH = Voucher Status
- AI = Admission Slip
- AJ = Enrolled marker
- AK-AM = Discount/reservation info
- AN-AQ = Accounting remarks only, not official payments
- AR-AS = Previous school/referral
- AT-AX = Requirements

After the change:
- Run npm run lint or npm run build if applicable.
- Provide a short summary of files changed and what was intentionally not changed.
```

---

## 14. Recommended First Claude/Codex Run

Start with Phase 1 only.

```text
Phase requested in this run:
Phase 1 only — create Supabase migrations for Registrar student import staging and profile support.

Create new migration files under supabase/migrations after the latest existing migration number.

Include:
1. students.lrn nullable column and unique index for non-blank LRN.
2. student_registrar_profiles table.
3. registrar_import_batches table.
4. registrar_import_rows table.
5. Practical indexes.
6. RLS policies following the current project's existing RLS pattern.
7. No seed/dummy student data.

Do not modify RegistrarModulePage.tsx yet.
Do not modify unrelated modules.
```

---

## 15. Final Recommendation

Yes, the uploaded Excel can be aligned with the current project, but it should be treated as a Registrar import workflow, not a one-time direct SQL insert.

The current system already has enough foundation for student records, guardians, requirements, and enrollment status, but it needs these production improvements first:

```text
1. Dedicated LRN handling.
2. Registrar import staging tables.
3. Registrar profile extension table.
4. Real Excel parser and validator.
5. Transaction-safe commit function.
6. Replacement of the mock Bulk Import UI.
```

This approach allows the school to import all listed students while keeping the database auditable, safer from duplicates, and ready for future Registrar/Accounting workflows.
