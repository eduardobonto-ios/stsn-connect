/**
 * STSN Connect — Demo PDF Generator
 * Generates a comprehensive, professional demo guide for all system roles.
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// ─── Assets ──────────────────────────────────────────────────────────────────

const LOGO_PATH = path.join(__dirname, "../../public/stsn-crest.png");
const OUTPUT_PATH = path.join(__dirname, "../../STSN_Connect_Demo.pdf");

function getLogoBase64() {
  if (!fs.existsSync(LOGO_PATH)) return null;
  // Convert to a small 32x32 thumbnail to keep PDF size manageable.
  // We read the raw bytes and re-embed at native size — Puppeteer deduplicates
  // when we navigate to a saved HTML file instead of using setContent().
  return `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString("base64")}`;
}

function getLogoFileURL() {
  if (!fs.existsSync(LOGO_PATH)) return null;
  return `file:///${LOGO_PATH.replace(/\\/g, "/")}`;
}

// ─── Color Tokens ─────────────────────────────────────────────────────────────

const C = {
  brown:      "#5c4533",
  brownDark:  "#4a3728",
  brownDeep:  "#2e1c10",
  brownLight: "#634935",
  cream:      "#fffdf5",
  beige:      "#e5e0d5",
  gold:       "#c5a059",
  goldLight:  "#d6cfb5",
  text:       "#2d241e",
  textLight:  "#6b5242",
  white:      "#ffffff",
};

// ─── Role Definitions ─────────────────────────────────────────────────────────

const ROLES = [
  {
    id: "SUPER_ADMIN",
    name: "Super Administrator",
    tagline: "Full system access — all 29 modules and all academic contexts",
    color: C.gold,
    bg: C.brownDeep,
    responsibilities: [
      "Configure all system settings and academic parameters",
      "Manage user accounts, roles, and permission assignments",
      "Access every module across all academic units",
      "Review audit logs and system-wide reports",
      "Override approvals at any level",
      "Manage delegation of authority",
    ],
    modules: [
      "DASHBOARD", "ACTION_CENTER",
      "REGISTRAR", "STUDENT_DIRECTORY", "CLASS_SECTIONING", "SCHEDULING", "FACULTY_ADMIN", "CURRICULUM", "GRADING", "REGISTRAR_REPORTS",
      "ACCOUNTING", "ACCOUNTING_DASHBOARD", "BOOKS_SETUP",
      "CASHIER",
      "FACULTY_PORTAL",
      "STUDENT_PORTAL", "ONLINE_LEARNING",
      "HR_MANAGEMENT",
      "PAYROLL_MANAGEMENT", "PAYROLL_DASHBOARD",
      "NURSE_CLINIC", "CONSULTATION", "CLINIC_REPORTS",
      "GUIDANCE", "GUIDANCE_REPORTS",
      "ACCOUNTS_SECURITY", "ADMIN_REPORTS",
      "CORE_SETUP",
    ],
  },
  {
    id: "ADMIN",
    name: "School Administrator",
    tagline: "Operational oversight — HR, registrar, and admin reporting",
    color: C.brownLight,
    bg: "#3d2b1f",
    responsibilities: [
      "Monitor overall school operations across departments",
      "Oversee HR records, staffing levels, and attendance",
      "Approve HR-related pending actions",
      "View student directory and enrollment summaries",
      "Generate admin and registrar reports",
    ],
    modules: [
      "DASHBOARD", "ACTION_CENTER",
      "STUDENT_DIRECTORY",
      "HR_MANAGEMENT",
      "REGISTRAR_REPORTS", "ADMIN_REPORTS",
    ],
  },
  {
    id: "PRINCIPAL",
    name: "School Principal / Director",
    tagline: "Academic oversight — grading, faculty, curriculum, and scheduling",
    color: C.brownLight,
    bg: "#3d2b1f",
    responsibilities: [
      "Review and approve multi-level academic actions",
      "Monitor student grade records and academic standings",
      "Oversee faculty assignments and workload",
      "Manage curriculum and syllabus pathways",
      "Approve class schedules and section configurations",
      "Generate registrar reports for academic compliance",
    ],
    modules: [
      "ACTION_CENTER",
      "STUDENT_DIRECTORY",
      "GRADING", "CURRICULUM", "FACULTY_ADMIN", "SCHEDULING",
      "REGISTRAR_REPORTS",
    ],
  },
  {
    id: "REGISTRAR",
    name: "Registrar",
    tagline: "Admissions & records — enrollment, sectioning, and student management",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Process student enrollments and admissions for each term",
      "Manage student directory and enrollment status",
      "Create and configure class sections with advisers",
      "Build and maintain class schedules",
      "Manage faculty records and subject assignments",
      "Configure curriculum and syllabus pathways",
      "Access and manage grade directory records",
      "Generate official registrar reports including COR and masterlist",
    ],
    modules: [
      "ACTION_CENTER",
      "REGISTRAR", "STUDENT_DIRECTORY", "CLASS_SECTIONING", "SCHEDULING",
      "FACULTY_ADMIN", "CURRICULUM", "GRADING", "BOOKS_SETUP", "REGISTRAR_REPORTS",
    ],
  },
  {
    id: "ACCOUNTING",
    name: "Accounting Staff",
    tagline: "Finance & ledger — student billing, GL, AR/AP, and financial reporting",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Manage student financial ledgers and billing assessments",
      "Process and approve student discount applications",
      "Apply and release financial holds on student accounts",
      "Maintain the general ledger with journal entries",
      "Track accounts receivable and payable",
      "Generate financial statements and aging reports",
      "Configure the chart of accounts and cost centers",
    ],
    modules: [
      "ACTION_CENTER",
      "ACCOUNTING", "ACCOUNTING_DASHBOARD", "BOOKS_SETUP",
    ],
  },
  {
    id: "CASHIER",
    name: "Cashier",
    tagline: "Collections — payment processing, receipts, and cashiering reports",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Process student payments for approved fee assessments",
      "Generate and print official receipts for all transactions",
      "Manage daily collection queue and settlement",
      "View and reprint collection history",
      "Generate cashiering reports for daily reconciliation",
    ],
    modules: ["CASHIER"],
  },
  {
    id: "TEACHER",
    name: "Teacher / Faculty",
    tagline: "Instruction — grade encoding, class management, and online learning",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Enter and submit student grades for assigned classes",
      "View class rosters and student schedules",
      "Manage grade items, weights, and grading periods",
      "Reference curriculum and syllabus for lesson planning",
      "Access and manage online learning modules",
    ],
    modules: ["FACULTY_PORTAL", "GRADING", "CURRICULUM", "ONLINE_LEARNING"],
  },
  {
    id: "STUDENT",
    name: "Student",
    tagline: "Self-service portal — grades, fees, profile, enrollment, and e-learning",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "View personal academic records and report card",
      "Monitor financial ledger and outstanding balances",
      "Update personal profile and health information",
      "Access online learning modules assigned by teachers",
      "File self-service enrollment for the next term",
      "Book consultation appointments with advisers",
    ],
    modules: ["STUDENT_PORTAL", "CONSULTATION", "ONLINE_LEARNING"],
  },
  {
    id: "HR",
    name: "HR Manager",
    tagline: "Human resources — workforce management, attendance, leave, and recruitment",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Maintain complete employee records and employment history",
      "Track daily attendance and manage time records",
      "Configure shifts and work schedules for staff",
      "Process leave applications and approve/reject requests",
      "Manage recruitment pipelines and onboarding checklists",
      "Approve HR-related pending actions in the Action Center",
    ],
    modules: ["ACTION_CENTER", "HR_MANAGEMENT"],
  },
  {
    id: "GUIDANCE",
    name: "Guidance Counselor",
    tagline: "Student welfare — anecdotal records, counseling sessions, and reports",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Log and maintain anecdotal records for student behavior",
      "Record counseling sessions with session notes and recommendations",
      "Track incident reports and disciplinary cases",
      "Schedule and document student-parent conferences",
      "Generate guidance summary reports for administration",
    ],
    modules: ["GUIDANCE", "GUIDANCE_REPORTS"],
  },
  {
    id: "NURSE",
    name: "School Nurse",
    tagline: "Student health — clinic visits, health profiles, and medical reports",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Record and track student clinic visits and chief complaints",
      "Maintain individual student health profiles",
      "Log medical incidents and dispositions",
      "Manage consultation appointment scheduling",
      "Generate clinic visit and health summary reports",
    ],
    modules: ["NURSE_CLINIC", "CLINIC_REPORTS", "CONSULTATION"],
  },
  {
    id: "PAYROLL",
    name: "Payroll Officer",
    tagline: "Payroll & compensation — payroll runs, payslips, taxes, and benefits",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Process payroll computation for each pay period",
      "Generate and distribute employee payslips",
      "Manage salary payout batches and release authorization",
      "Configure and compute withholding tax obligations",
      "Administer employee benefits and government contributions",
      "Approve payroll-related items in the Action Center",
    ],
    modules: ["ACTION_CENTER", "PAYROLL_DASHBOARD", "PAYROLL_MANAGEMENT"],
  },
  {
    id: "GUARDIAN",
    name: "Parent / Guardian",
    tagline: "Family portal — view child's grades, fees, attendance, and notices",
    color: C.brown,
    bg: C.brownDark,
    responsibilities: [
      "Monitor child's academic performance and grade summary",
      "View tuition fee balances and payment history",
      "Check attendance records and absences",
      "Receive school announcements and important notices",
    ],
    modules: ["GUARDIAN_PORTAL"],
  },
];

// ─── Module Page Definitions ───────────────────────────────────────────────────

const MODULE_PAGES = {

  DASHBOARD: {
    name: "Dashboard",
    group: "Command Center",
    icon: "⬛",
    purpose: "The Dashboard is the system-wide command center that gives all staff roles a consolidated at-a-glance view of school operations. It displays key performance indicators (KPIs), pending approval counts, recent system activity, and quick-navigation shortcuts to the most commonly used modules.",
    features: [
      "Real-time KPI cards for enrolled students, pending assessments, and staff headcount",
      "Quick-navigation tiles to all permitted modules",
      "Pending approval badge counters per module",
      "Recent system activity feed with timestamps",
      "Role-specific welcome greeting and contextual alerts",
      "Academic year and term context indicator",
    ],
    workflow: [
      "User logs in and lands on the Dashboard",
      "Dashboard resolves the user's role and renders permitted KPI cards",
      "User reviews key metrics and pending action counts",
      "User clicks a quick-link tile or sidebar item to navigate to a module",
      "Pending badges update in real-time as actions are completed",
    ],
    tabs: [],
    forms: [],
    modals: [],
    reports: [],
  },

  ACTION_CENTER: {
    name: "Action Center",
    group: "Workflow Management",
    icon: "⬛",
    purpose: "The Action Center is the unified approval queue that consolidates all pending workflow items across every module into one place. Staff can review, approve, or reject enrollment applications, discount requests, leave filings, assessment approvals, payroll runs, and more — all without navigating between modules.",
    features: [
      "Unified queue for all pending approvals across modules",
      "Filter by module type, date range, priority, and submitter",
      "Bulk approve or reject multiple items simultaneously",
      "Contextual detail panel with full request information",
      "Add approval notes or rejection reasons before acting",
      "Real-time badge count in sidebar showing pending items",
      "Escalation indicators for items nearing SLA deadlines",
      "Complete approval trail with who approved what and when",
    ],
    workflow: [
      "Staff navigates to Action Center from the sidebar",
      "System displays all pending items the user is authorized to approve",
      "User applies filters to narrow down by type or date",
      "User clicks a pending item to view the full detail panel",
      "User reviews the request, adds an optional note, then approves or rejects",
      "System sends the item to the next approval level or marks it complete",
      "Action is logged in the audit trail with timestamp and actor",
    ],
    tabs: [
      { name: "All Pending", desc: "Consolidated queue of all pending items" },
      { name: "Enrollments", desc: "Enrollment applications awaiting registrar review" },
      { name: "Assessments", desc: "Fee assessments pending accounting approval" },
      { name: "Discounts", desc: "Student discount requests pending approval" },
      { name: "Leave Requests", desc: "Employee leave filings awaiting supervisor action" },
      { name: "Payroll", desc: "Payroll runs awaiting final authorization" },
    ],
    forms: [],
    modals: [
      { name: "Approval Detail Panel", desc: "Full view of the request with approve/reject controls and notes field" },
    ],
    reports: [],
  },

  REGISTRAR: {
    name: "Enrollment (Admission)",
    group: "Admissions",
    icon: "⬛",
    purpose: "The Enrollment module is the primary interface for processing student admissions and registrations each academic term. The registrar can search for existing students, process new enrollments through a multi-step wizard, review online applications from the queue, manage enrollment status, and generate the Certificate of Registration (COR).",
    features: [
      "Student search with filter by grade level, section, and enrollment status",
      "KPI cards for enrolled count, pending/for-assessment count, and online application count",
      "Multi-step Enrollment Wizard for complete student intake",
      "Online application review queue for self-submitted enrollments",
      "Bulk CSV import from the official registrar template",
      "COR (Certificate of Registration) preview and print",
      "Status filtering: Enrolled, Pending, For Assessment",
      "Per-student enrollment status badge and quick-action buttons",
    ],
    workflow: [
      "Registrar navigates to the Enrollment module",
      "Reviews pending online applications from the Online Queue tab",
      "To enroll a new student: clicks 'New Enrollment' to open the Enrollment Wizard",
      "Wizard Step 1 — Personal Information: name, birthdate, LRN, contact details",
      "Wizard Step 2 — Guardian/Parent: parent name, relationship, contact",
      "Wizard Step 3 — Academic: grade level, section, subjects, payment terms",
      "Wizard Step 4 — Assessment & Fees: auto-computed tuition and miscellaneous fees",
      "Wizard Step 5 — Documents: attach enrollment requirements",
      "Registrar submits enrollment; status set to 'Pending' or 'For Assessment'",
      "Accounting approves the assessment; status changes to 'Enrolled'",
      "Registrar generates and prints the COR for the student",
    ],
    tabs: [
      { name: "Admissions & Directory", desc: "Full list of students with enrollment status, KPI cards, and search/filter controls" },
      { name: "Online Queue", desc: "Self-submitted enrollment applications from the Student Portal awaiting registrar review" },
      { name: "Bulk Import", desc: "CSV masterlist upload tool with validation preview and import summary" },
    ],
    forms: [
      {
        name: "Enrollment Wizard — Step 1: Personal Information",
        fields: ["First Name", "Middle Name", "Last Name", "Suffix", "Birthdate", "Gender", "LRN (Learner Reference Number)", "Nationality", "Religion", "Civil Status", "Contact Number", "Email Address", "Home Address"],
      },
      {
        name: "Enrollment Wizard — Step 2: Guardian / Parent",
        fields: ["Parent/Guardian Name", "Relationship", "Contact Number", "Email", "Occupation", "Address"],
      },
      {
        name: "Enrollment Wizard — Step 3: Academic",
        fields: ["Academic Unit (Basic Ed / College)", "Grade Level / Year Level", "Program/Track (for SHS/College)", "Section", "Payment Terms", "School Year"],
      },
      {
        name: "Enrollment Wizard — Step 4: Assessment Preview",
        fields: ["Tuition Fee", "Miscellaneous Fees", "Book Package", "Payment Schedule", "Total Amount Due"],
      },
      {
        name: "Enrollment Wizard — Step 5: Documents",
        fields: ["Report Card / Form 138", "PSA Birth Certificate", "Good Moral Certificate", "Medical Certificate", "2x2 ID Photo", "Other Requirements (configurable)"],
      },
    ],
    modals: [
      { name: "COR Preview", desc: "Full-page Certificate of Registration preview with school header, student details, enrolled subjects, and fee summary — with Print and Download controls" },
      { name: "Enrollment Wizard", desc: "Multi-step enrollment modal with step indicator and navigation controls" },
      { name: "Import Preview", desc: "Tabular preview of CSV import rows with validation status per row before confirming the bulk import" },
    ],
    reports: [],
  },

  STUDENT_DIRECTORY: {
    name: "Student Directory",
    group: "Records",
    icon: "⬛",
    purpose: "The Student Directory provides a centralized lookup for all student records across the school. Staff can search, filter, and navigate to individual student profiles from this single view, regardless of enrollment status.",
    features: [
      "Global search by name, LRN, or student ID",
      "Filter by grade level, section, enrollment status, and academic unit",
      "Quick-action row buttons to open the full student profile",
      "Column sorting and paginated data table",
      "Export student list to CSV or Excel",
      "Role-based column visibility (some columns hidden for non-admin roles)",
    ],
    workflow: [
      "Staff navigates to Student Directory",
      "Uses search or filter to locate a specific student",
      "Clicks the student row to open the Student Profile panel",
      "Views academic history, enrollment records, and financial summary",
      "Navigates to specific sub-sections (grades, ledger, documents) from the profile",
    ],
    tabs: [],
    forms: [],
    modals: [
      { name: "Student Profile Panel", desc: "Slide-over panel showing the student's complete profile including academic records, financial ledger, and documents" },
    ],
    reports: [],
  },

  CLASS_SECTIONING: {
    name: "Class Sectioning",
    group: "Academic Administration",
    icon: "⬛",
    purpose: "Class Sectioning allows the registrar to create, organize, and manage class sections for each academic term. Sections are assigned advisers and populated with students from the enrolled roster.",
    features: [
      "Create sections per grade level and academic year",
      "Assign section advisers from the faculty roster",
      "Add and manage student roster per section",
      "LRN validation for student entries",
      "Section capacity indicators and enrollment counts",
      "Bulk student assignment from enrolled student list",
    ],
    workflow: [
      "Registrar navigates to Class Sectioning",
      "Creates a new section by specifying grade level, section name, and academic year",
      "Assigns a faculty adviser to the section",
      "Adds enrolled students to the section roster",
      "Section becomes available for scheduling and grading",
    ],
    tabs: [
      { name: "Sections", desc: "List of all sections with adviser assignment and student count" },
      { name: "Student Roster", desc: "Per-section student list with LRN and enrollment status" },
    ],
    forms: [
      { name: "New Section Form", fields: ["Section Name", "Grade Level", "Academic Year", "School Term", "Adviser (Faculty)", "Capacity"] },
    ],
    modals: [
      { name: "Add Students to Section", desc: "Modal to select enrolled students and bulk-add them to the section roster" },
    ],
    reports: [],
  },

  SCHEDULING: {
    name: "Class Scheduling",
    group: "Academic Administration",
    icon: "⬛",
    purpose: "The Scheduling module enables the registrar to build class schedules by assigning subjects to sections, specifying meeting times, and allocating rooms — with built-in conflict detection.",
    features: [
      "Subject-to-section schedule assignment",
      "Time slot and room allocation",
      "Conflict detection for overlapping schedules",
      "Teacher-subject-schedule linking",
      "Schedule grid view by day and time slot",
      "Print-ready schedule output per section or per teacher",
    ],
    workflow: [
      "Registrar opens Class Scheduling for a given academic year",
      "Selects a section to configure its schedule",
      "Adds subjects one by one, assigning teacher, day, time, and room",
      "System flags conflicts if any",
      "Publishes the schedule for the term",
    ],
    tabs: [
      { name: "By Section", desc: "Schedule grid view organized by class section" },
      { name: "By Teacher", desc: "Schedule view filtered by faculty member showing all assigned classes" },
    ],
    forms: [
      { name: "Schedule Entry Form", fields: ["Section", "Subject", "Teacher", "Day(s)", "Time Start", "Time End", "Room", "School Year", "Semester"] },
    ],
    modals: [
      { name: "Conflict Alert", desc: "Displays detected scheduling conflicts with affected sections, teachers, or rooms and suggests resolution" },
    ],
    reports: [],
  },

  FACULTY_ADMIN: {
    name: "Faculty Management",
    group: "Academic Administration",
    icon: "⬛",
    purpose: "Faculty Management provides the registrar and principal with tools to manage the school's teaching staff — including faculty profiles, subject assignments, and teaching workload tracking.",
    features: [
      "Faculty master list with employment and contact details",
      "Subject assignment per faculty member",
      "Teaching load computation and display",
      "Faculty profile with academic and professional background",
      "Filter by department, employment status, and subject",
    ],
    workflow: [
      "Registrar or principal navigates to Faculty Management",
      "Views the faculty list and searches for a specific teacher",
      "Opens the faculty profile to review assignments",
      "Assigns subjects to the faculty member for the current term",
      "Reviews the teaching load summary to ensure compliance with load limits",
    ],
    tabs: [
      { name: "Faculty List", desc: "All teaching staff with search, filter, and quick profile access" },
      { name: "Subject Assignments", desc: "Faculty-to-subject mapping for the current academic term" },
      { name: "Workload Summary", desc: "Teaching load units per faculty member with overload indicators" },
    ],
    forms: [
      { name: "Faculty Profile Form", fields: ["Employee Name", "Employee ID", "Department", "Employment Status", "Specialization", "Educational Attainment", "Contact Info"] },
    ],
    modals: [],
    reports: [],
  },

  CURRICULUM: {
    name: "Curriculum / Syllabus Pathways",
    group: "Academic Administration",
    icon: "⬛",
    purpose: "The Curriculum module allows administrators to define the academic subject pathways for each grade level, program, and academic unit. It serves as the master reference for what subjects are offered and their prerequisite chains.",
    features: [
      "Subject catalog with code, title, and unit credits",
      "Grade-level-to-subject mapping",
      "Program track assignment (Science, Arts, ABM, HUMSS, etc.)",
      "Prerequisite chain configuration",
      "Curriculum view by academic unit (Basic Ed vs. College)",
      "Export curriculum matrix to CSV",
    ],
    workflow: [
      "Academic administrator opens Curriculum",
      "Selects the academic unit and program track",
      "Adds subjects to the appropriate grade level or year level",
      "Sets prerequisites for each subject where applicable",
      "Publishes the curriculum as the reference for enrollment and scheduling",
    ],
    tabs: [
      { name: "Subject Catalog", desc: "Master list of all subjects across all programs" },
      { name: "Curriculum Matrix", desc: "Subject pathway grid by grade level and program track" },
    ],
    forms: [
      { name: "Add Subject Form", fields: ["Subject Code", "Subject Title", "Units/Credits", "Grade Level", "Program Track", "Academic Unit", "Prerequisites"] },
    ],
    modals: [],
    reports: [],
  },

  GRADING: {
    name: "Grades Directory",
    group: "Academic Records",
    icon: "⬛",
    purpose: "The Grades Directory provides administrators with a read-only, searchable view of all student grade records across sections, subjects, and grading periods. It serves as the central reference for academic performance monitoring.",
    features: [
      "Grade search by student name, section, subject, or grading period",
      "Filter by grade level, section, and academic year",
      "View grade breakdown per subject and per period",
      "Honor roll and academic standing indicators",
      "Export grade summary to CSV or Excel",
      "Drill-down to individual student grade sheets",
    ],
    workflow: [
      "Principal or registrar opens Grades Directory",
      "Filters by grade level, section, and grading period",
      "Views the grade summary table with student names and subject grades",
      "Clicks a student row to open the detailed grade sheet",
      "Exports the grade data for reporting or archiving",
    ],
    tabs: [
      { name: "By Section", desc: "Grade listing organized by class section" },
      { name: "By Student", desc: "Individual student grade record lookup" },
    ],
    forms: [],
    modals: [
      { name: "Student Grade Sheet Detail", desc: "Full grade sheet for a selected student showing all subjects, grading period scores, and final grade" },
    ],
    reports: [
      { name: "Grade Summary Report", desc: "Class-wide grade summary with average per subject and per student" },
      { name: "Honor Roll Report", desc: "List of students qualifying for honor roll based on grade thresholds" },
    ],
  },

  REGISTRAR_REPORTS: {
    name: "Registrar Reports",
    group: "Reports",
    icon: "⬛",
    purpose: "Registrar Reports provides a suite of official reports for enrollment, student records, and academic documentation. Reports can be previewed on-screen and exported as PDF or Excel.",
    features: [
      "Student Masterlist with enrollment status and grade level",
      "Enrollment Summary by program, grade level, and status",
      "COR (Certificate of Registration) batch generation",
      "Grade Summary Report by section and grading period",
      "Date range and academic year filter for all reports",
      "Export to PDF and Excel for all report types",
      "Print-optimized report layouts",
    ],
    workflow: [
      "Registrar navigates to Registrar Reports",
      "Selects the report type from the report catalog",
      "Sets the filter parameters (academic year, grade level, date range)",
      "Clicks 'Preview' to view the report on-screen",
      "Exports to PDF or Excel as needed",
    ],
    tabs: [],
    forms: [],
    modals: [
      { name: "Report Preview Modal", desc: "Full-page report preview with export controls (PDF, Excel, Print)" },
    ],
    reports: [
      { name: "Student Masterlist", desc: "Complete roster of all enrolled students with LRN, grade level, section, and enrollment status" },
      { name: "Enrollment Summary", desc: "Statistical breakdown of enrollees by grade level, program, and status" },
      { name: "Certificate of Registration (COR)", desc: "Official COR per student with enrolled subjects and fee summary" },
      { name: "Grade Summary", desc: "Academic performance summary by section and grading period" },
    ],
  },

  ACCOUNTING_DASHBOARD: {
    name: "Accounting Dashboard",
    group: "Finance",
    icon: "⬛",
    purpose: "The Accounting Dashboard gives accounting staff a real-time financial overview of the school's revenue, receivables, and billing pipeline. It provides KPI cards, aging summary widgets, and trend charts for at-a-glance financial health monitoring.",
    features: [
      "Total enrolled students with assessed and collected fee totals",
      "Accounts receivable aging summary (30/60/90/120+ day buckets)",
      "Revenue trend chart by month",
      "Top debtors watchlist with outstanding balances",
      "Payment method breakdown chart",
      "Quick-links to key accounting sub-modules",
    ],
    workflow: [
      "Accounting staff logs in and sees the Accounting Dashboard",
      "Reviews the KPI cards for total assessments and collections",
      "Checks the AR aging widget to identify overdue accounts",
      "Clicks a debtor row to navigate to the student's ledger",
      "Reviews the trend chart to track monthly collection performance",
    ],
    tabs: [],
    forms: [],
    modals: [],
    reports: [],
  },

  ACCOUNTING: {
    name: "Student Accounts",
    group: "Finance",
    icon: "⬛",
    purpose: "Student Accounts is the core financial management interface for student billing and collections. It includes the individual student ledger, discount management, assessment approval, and financial hold administration.",
    features: [
      "Per-student debit/credit ledger with running balance",
      "Fee assessment breakdown per enrolled student",
      "Discount application and multi-level approval workflow",
      "Financial hold application and release controls",
      "Statement of Account (SOA) generation and download",
      "Payment history with receipt references",
    ],
    workflow: [
      "Accounting staff navigates to Student Accounts",
      "Searches for a specific student using name or ID",
      "Opens the student's ledger to view all financial transactions",
      "Applies discounts if the student qualifies, submitting for approval",
      "Approves assessment when enrollment wizard submits a new enrollment",
      "Applies a financial hold if the student has an unpaid balance",
    ],
    tabs: [
      { name: "Student Ledger", desc: "Per-student debit/credit entries, running balance, and transaction history" },
      { name: "Discounts", desc: "Student discount types, application requests, and approval workflow" },
      { name: "Billing & Assessment", desc: "Fee assessment per student with approval queue and billing summary" },
      { name: "Financial Holds", desc: "Active financial holds per student with hold type and release controls" },
    ],
    forms: [
      { name: "Discount Application Form", fields: ["Student Name", "Discount Type", "Discount Amount / Percentage", "Applicable Fees", "Supporting Document", "Remarks"] },
      { name: "Financial Hold Form", fields: ["Student Name", "Hold Type", "Hold Reason", "Amount Due", "Effective Date", "Notes"] },
    ],
    modals: [
      { name: "Statement of Account Preview", desc: "Printable SOA showing all fees, discounts, payments, and outstanding balance" },
      { name: "Discount Approval Modal", desc: "Approval or rejection of a discount request with notes and approval level tracking" },
    ],
    reports: [],
  },

  ACCOUNTING_SETUP: {
    name: "Accounting Setup",
    group: "Finance Setup",
    icon: "⬛",
    purpose: "Accounting Setup contains all the configuration tables that underpin the financial system — chart of accounts, cost centers, supplier master, item catalog, and discount type definitions.",
    features: [
      "Chart of Accounts: hierarchical GL account structure with type classification",
      "Cost Centers: department-level cost segmentation for reporting",
      "Supplier Management: vendor master list with contact, terms, and balance",
      "Item/Product Management: fee items, products, and services with pricing",
      "Discount Types: configurable discount definitions with eligibility rules",
    ],
    workflow: [
      "Accounting admin opens Accounting Setup",
      "Configures the Chart of Accounts by adding GL accounts under asset, liability, equity, revenue, or expense categories",
      "Creates cost centers for each department or program",
      "Adds suppliers/vendors with payment terms",
      "Defines fee items and products used in student billing",
      "Configures discount types available for student applications",
    ],
    tabs: [
      { name: "Chart of Accounts", desc: "GL account hierarchy: Asset, Liability, Equity, Revenue, Expense" },
      { name: "Cost Centers", desc: "Departmental cost allocation units for segmented financial reporting" },
      { name: "Supplier Management", desc: "Vendor master with contact info, payment terms, and outstanding AP balance" },
      { name: "Item / Product Management", desc: "Fee items and products used in student billing and purchase invoices" },
      { name: "Discount Types", desc: "Named discount definitions with percentage/amount and eligibility rules" },
    ],
    forms: [
      { name: "Add GL Account", fields: ["Account Code", "Account Name", "Account Type", "Parent Account", "Cost Center", "Normal Balance", "Description"] },
      { name: "Add Cost Center", fields: ["Cost Center Code", "Cost Center Name", "Department", "Budget Allocation"] },
      { name: "Add Supplier", fields: ["Supplier Name", "Contact Person", "Email", "Phone", "Address", "Payment Terms (Days)", "Tax ID"] },
      { name: "Add Fee Item", fields: ["Item Code", "Item Name", "Category", "Unit Price", "Tax Applicable", "GL Account Link"] },
      { name: "Add Discount Type", fields: ["Discount Name", "Discount Rate (%)", "Maximum Amount", "Applicable Fees", "Eligibility Rules", "Requires Approval"] },
    ],
    modals: [],
    reports: [],
  },

  JOURNAL_ENTRIES: {
    name: "Journal Entries (General Ledger)",
    group: "Finance",
    icon: "⬛",
    purpose: "The Journal Entries module enables accounting staff to record all financial transactions in double-entry bookkeeping format. Each entry must balance (debits = credits) before it can be posted to the general ledger.",
    features: [
      "Double-entry journal entry creation with debit/credit line items",
      "GL account selection from the Chart of Accounts",
      "Reference number and document attachment",
      "Batch posting of multiple entries",
      "Journal entry search by date, account, and reference",
      "Reverse entry creation for corrections",
    ],
    workflow: [
      "Accounting staff opens Journal Entries",
      "Clicks 'New Entry' to create a new journal entry",
      "Enters the entry date, reference number, and description",
      "Adds debit and credit line items from the Chart of Accounts",
      "Verifies that total debits equal total credits",
      "Posts the entry to the general ledger",
    ],
    tabs: [
      { name: "Journal Entries List", desc: "All posted and draft entries with date, reference, and total amount" },
    ],
    forms: [
      { name: "New Journal Entry", fields: ["Entry Date", "Reference Number", "Description / Memo", "Line Items: [Account | Description | Debit | Credit]", "Attachment (optional)"] },
    ],
    modals: [
      { name: "Journal Entry Detail", desc: "Read-only view of a posted journal entry with full line item breakdown" },
    ],
    reports: [],
  },

  AR_MODULE: {
    name: "Accounts Receivable",
    group: "Finance",
    icon: "⬛",
    purpose: "The Accounts Receivable module tracks all money owed to the school by customers and students. It includes sales invoice management and an aging analysis by overdue buckets.",
    features: [
      "Sales invoice creation with line items and due dates",
      "Customer/student AR balance tracking",
      "Payment matching and invoice settlement",
      "AR Aging report by 30/60/90/120+ day buckets",
      "Overdue invoice alerts and collection notes",
    ],
    workflow: [
      "Accounting creates a sales invoice for a customer or student billing event",
      "Sets the due date and payment terms on the invoice",
      "Monitors the AR aging report to identify overdue invoices",
      "Records payment when customer pays to settle the invoice",
      "Generates AR aging summary for management reporting",
    ],
    tabs: [
      { name: "Sales Invoice", desc: "List of all AR invoices with status, due date, and outstanding balance" },
      { name: "AR Aging", desc: "Receivables aging analysis by 0–30, 31–60, 61–90, and 91–120+ day buckets" },
    ],
    forms: [
      { name: "New Sales Invoice", fields: ["Invoice Number", "Invoice Date", "Due Date", "Customer / Student", "Line Items: [Item | Description | Qty | Unit Price | Total]", "Notes"] },
    ],
    modals: [
      { name: "Invoice Detail", desc: "Full invoice view with payment history, balance due, and payment recording controls" },
    ],
    reports: [
      { name: "AR Aging Report", desc: "Customer-by-customer aging breakdown with totals per bucket and grand total outstanding" },
    ],
  },

  AP_MODULE: {
    name: "Accounts Payable",
    group: "Finance",
    icon: "⬛",
    purpose: "The Accounts Payable module manages all vendor invoices and the school's outstanding payment obligations. It tracks what is owed to suppliers and provides an aging analysis for payment prioritization.",
    features: [
      "Purchase invoice entry from vendor bills",
      "GL account coding per invoice line item",
      "Payment scheduling and due date tracking",
      "AP Aging report by vendor and aging bucket",
      "Mark invoices as paid upon settlement",
    ],
    workflow: [
      "Accounting receives a vendor bill and opens Purchase Invoices",
      "Enters the purchase invoice with vendor, date, and line items",
      "Codes each line to the appropriate GL account and cost center",
      "Schedules the payment based on vendor payment terms",
      "On payment date: marks the invoice as paid and records the payment",
      "Monitors AP aging to ensure no overdue vendor payments",
    ],
    tabs: [
      { name: "Purchase Invoice", desc: "Vendor AP invoices with status, due date, and GL coding" },
      { name: "AP Aging", desc: "Vendor-level payables aging by 0–30, 31–60, 61–90, and 91–120+ day buckets" },
    ],
    forms: [
      { name: "New Purchase Invoice", fields: ["Invoice Number", "Vendor / Supplier", "Invoice Date", "Due Date", "Line Items: [Description | GL Account | Cost Center | Amount]", "Attachment"] },
    ],
    modals: [
      { name: "Payment Recording", desc: "Record payment made to vendor, select payment method, and update invoice status to Paid" },
    ],
    reports: [
      { name: "AP Aging Report", desc: "Vendor-by-vendor aging breakdown with payment due prioritization" },
    ],
  },

  FINANCIAL_REPORTS: {
    name: "Financial Reports & Statements",
    group: "Finance",
    icon: "⬛",
    purpose: "Financial Reports provides the full suite of formal accounting statements: Trial Balance, Balance Sheet, Income Statement (Profit & Loss), and Cash Flow Statement — each with period selection and export capability.",
    features: [
      "Trial Balance: debit/credit totals per GL account to verify ledger balance",
      "Balance Sheet: Assets = Liabilities + Equity as of a selected date",
      "Income Statement: Revenue − Expenses = Net Income for a selected period",
      "Cash Flow: Operating, Investing, and Financing activity summary",
      "Period and date range selector for all statements",
      "Comparative period columns (current vs. prior year)",
      "Export to PDF and Excel for audit submissions",
    ],
    workflow: [
      "Accounting staff navigates to Financial Reports",
      "Selects the desired statement type",
      "Sets the date range or as-of date for the report",
      "Reviews the generated statement on-screen",
      "Exports to PDF for management or audit submission",
    ],
    tabs: [
      { name: "Trial Balance", desc: "GL account debit/credit totals verifying that the ledger is balanced" },
      { name: "Balance Sheet", desc: "Assets, liabilities, and equity snapshot as of a specific date" },
      { name: "Income Statement", desc: "Revenue and expense summary yielding net income for a period" },
      { name: "Cash Flow Report", desc: "Operating, investing, and financing cash flows for a period" },
    ],
    forms: [],
    modals: [
      { name: "Statement Preview & Export", desc: "On-screen statement preview with Print, Export to PDF, and Export to Excel buttons" },
    ],
    reports: [
      { name: "Trial Balance", desc: "Two-column debit/credit totals for all active GL accounts" },
      { name: "Balance Sheet", desc: "Standard balance sheet format with sub-totals per category" },
      { name: "Income Statement", desc: "Revenue less expenses with gross profit and net income lines" },
      { name: "Cash Flow Statement", desc: "Indirect method cash flow with operating, investing, and financing sections" },
    ],
  },

  CASHIER: {
    name: "Cashiering",
    group: "Collections",
    icon: "⬛",
    purpose: "The Cashiering module is the point-of-collection interface for processing student payments. Cashiers use this to receive payments for approved assessments, generate official receipts, view collection history, and produce cashiering reports for daily reconciliation.",
    features: [
      "Payment queue showing all students with approved assessments ready for payment",
      "Payment entry with multiple payment methods (cash, check, online transfer)",
      "Official receipt generation with school header and OR number",
      "Partial payment recording with balance tracking",
      "Collection history with OR number search and reprint capability",
      "Daily collection summary and cashier's report",
    ],
    workflow: [
      "Student presents to the cashier window",
      "Cashier searches for the student in the Payment Queue",
      "Reviews the approved assessment and payment schedule",
      "Enters the payment amount and payment method",
      "System generates an Official Receipt (OR) with an auto-assigned OR number",
      "Cashier prints and hands the OR to the student",
      "Transaction is posted to the student's financial ledger",
      "At end of day, cashier generates the Daily Collection Report",
    ],
    tabs: [
      { name: "Payment Queue", desc: "Students with approved assessments ready for payment processing" },
      { name: "Collection History", desc: "All posted payment transactions with OR numbers and reprint option" },
      { name: "Reports", desc: "Daily collection report, bank deposit summary, and collection by payment type" },
    ],
    forms: [
      { name: "Payment Entry Form", fields: ["Student Name / ID", "Assessment Reference", "Amount to Pay", "Payment Method (Cash / Check / Online)", "Check Number (if check)", "Bank Reference (if online)", "Cashier Name", "Date"] },
    ],
    modals: [
      { name: "Official Receipt Preview", desc: "Print-ready official receipt with OR number, school name, student name, amount, and payment details" },
      { name: "Reprint Receipt", desc: "Reprint any previously issued receipt by searching OR number or student name" },
    ],
    reports: [
      { name: "Daily Collection Report", desc: "Summary of all payments collected on a specific date, grouped by payment method" },
      { name: "Bank Deposit Summary", desc: "Breakdown of check and online payments for daily bank deposit preparation" },
      { name: "Collection by Payment Type", desc: "Pie/bar chart breakdown of cash, check, and online transfer collections" },
    ],
  },

  FACULTY_PORTAL: {
    name: "Teacher Board (Faculty Portal)",
    group: "Instruction",
    icon: "⬛",
    purpose: "The Teacher Board is the faculty-facing interface for accessing assigned classes, viewing schedules, and entering student grades. It gives teachers a focused view of their teaching responsibilities for the current term.",
    features: [
      "My Classes list with subject name, section, schedule, and student count",
      "Class roster with enrolled students per subject",
      "Grade encoding access per subject from the class card",
      "Teaching schedule overview by day and time",
      "Quick navigation to grade sheets for each assigned class",
    ],
    workflow: [
      "Teacher logs in and sees their My Classes list",
      "Reviews the class schedule for the current week",
      "Clicks a class card to view the roster",
      "Clicks 'Grade Encoding' to open the grade sheet for that class",
      "Enters grades for each student and saves the grade sheet",
    ],
    tabs: [
      { name: "My Classes", desc: "All subjects assigned to the logged-in teacher for the current term" },
      { name: "Schedule", desc: "Weekly teaching schedule grid with day, time, subject, and room" },
      { name: "Students", desc: "Combined student roster across all assigned classes" },
    ],
    forms: [],
    modals: [],
    reports: [],
  },

  GRADE_ENCODING: {
    name: "Grade Encoding",
    group: "Instruction",
    icon: "⬛",
    purpose: "Grade Encoding provides teachers with a spreadsheet-style interface for entering student grades organized by grading period. Teachers can configure grade items, set weights, and input scores that are automatically computed into a final grade.",
    features: [
      "Grade sheet table with one row per student and one column per grade item",
      "Grading period selector (1st, 2nd, 3rd, 4th Quarter or Midterm/Finals)",
      "Grade item management: add, edit, and delete grade components (quizzes, activities, exams)",
      "Weight configuration per grade component (Quarterly/Semestral)",
      "Auto-computation of weighted averages and final grades",
      "Grade summary view showing all periods and overall final grade",
      "Submit grades for registrar review",
    ],
    workflow: [
      "Teacher opens Grade Encoding from the Teacher Board or Grading module",
      "Selects the subject, section, and grading period",
      "Adds grade items (quizzes, activities, long tests, periodic exam) with weights",
      "Inputs student scores in the grade sheet cells",
      "System computes weighted averages per student automatically",
      "Teacher reviews the grade summary and submits the grade sheet",
    ],
    tabs: [
      { name: "Grade Sheet", desc: "Spreadsheet-style input grid: students in rows, grade items in columns" },
      { name: "Grade Summary", desc: "All grading periods side-by-side with final grade computation" },
    ],
    forms: [
      { name: "Add Grade Item", fields: ["Item Name", "Category (Written Work / Performance Task / Periodic Assessment)", "Maximum Score", "Weight (%)", "Grading Period"] },
      { name: "Grade Weights Setup", fields: ["Written Work Weight (%)", "Performance Tasks Weight (%)", "Periodic Assessment Weight (%)", "Apply to: Current Period / All Periods"] },
    ],
    modals: [
      { name: "Add Grade Item Modal", desc: "Form to add a new grade component to the current grade sheet" },
      { name: "Manage Grade Weights Modal", desc: "Configure the percentage weight for each grade category per grading period" },
      { name: "Submit Grades Confirmation", desc: "Confirmation dialog before submitting the finalized grade sheet to the registrar" },
    ],
    reports: [],
  },

  ONLINE_LEARNING: {
    name: "Online Learning (LMS)",
    group: "Instruction",
    icon: "⬛",
    purpose: "The Online Learning module provides an integrated learning management system (LMS) for both teachers and students. Teachers can organize modules and resources while students can access video lessons, complete activities, and track their learning progress.",
    features: [
      "Module and lesson organization by subject",
      "Video lesson player with progress tracking",
      "Downloadable learning materials and resources",
      "Activity and quiz access within each module",
      "Completion tracking per student per module",
      "Teacher view of student progress and completion rates",
    ],
    workflow: [
      "Teacher creates a learning module with a title and subject assignment",
      "Adds lessons (video links, PDF materials, activities) to the module",
      "Publishes the module for student access",
      "Students navigate to Online Learning and see assigned modules",
      "Students watch video lessons, download materials, and complete activities",
      "Progress is tracked automatically — teacher can view completion rates",
    ],
    tabs: [
      { name: "Modules", desc: "All available learning modules organized by subject" },
      { name: "My Progress", desc: "Student view of completion status per module (student role only)" },
    ],
    forms: [
      { name: "Create Module Form", fields: ["Module Title", "Subject", "Grade Level", "Description", "Publish Status (Draft / Published)"] },
      { name: "Add Lesson", fields: ["Lesson Title", "Content Type (Video / PDF / Link / Activity)", "URL or File Upload", "Order Number"] },
    ],
    modals: [],
    reports: [],
  },

  STUDENT_PORTAL: {
    name: "Student Portal",
    group: "Student Self-Service",
    icon: "⬛",
    purpose: "The Student Portal is the complete self-service hub for enrolled students. It provides access to their enrollment records, academic report card, financial ledger, personal profile, online learning, and self-service enrollment application — all in a single tabbed interface.",
    features: [
      "Records Overview: enrollment status card, GPA indicator, fee balance, and important dates",
      "Academic Report Card: grades by subject and grading period with GPA computation",
      "Financial Ledger: fee breakdown, payment history, and outstanding balance",
      "Student Profile: personal details, emergency contacts, health information",
      "Online Learning: LMS module browser and progress tracker",
      "Enrollment: self-service enrollment form for the next academic term",
    ],
    workflow: [
      "Student logs in and lands on Records Overview",
      "Checks enrollment status and GPA summary",
      "Navigates to Academic Report Card to view grades",
      "Checks Financial Ledger to see outstanding balance and payment history",
      "Updates personal profile if needed",
      "Files self-service enrollment for the next term through the Enrollment tab",
    ],
    tabs: [
      { name: "Records Overview", desc: "Enrollment status dashboard with KPI cards and upcoming deadlines" },
      { name: "Academic Report Card", desc: "Grade summary per subject and grading period with GPA and honor roll status" },
      { name: "Financial Ledger", desc: "Fee breakdown, payment history, and remaining balance with SOA download" },
      { name: "Student Profile", desc: "Personal information, emergency contacts, health profile, and document uploads" },
      { name: "Online Learning", desc: "LMS module access with video lessons, materials, and completion tracking" },
      { name: "Enrollment", desc: "Self-service enrollment form with subject selection and requirement upload" },
    ],
    forms: [
      { name: "Self-Service Enrollment Form", fields: ["Returning Student / New Student", "Academic Year", "Grade Level / Year Level", "Program / Track", "Subject Selection", "Payment Terms", "Upload Requirements: Form 138, Good Moral, PSA Birth Cert, Medical Cert"] },
      { name: "Profile Update Form", fields: ["Personal Details", "Address", "Contact Number", "Emergency Contact Name/Relationship/Phone", "Blood Type", "Allergies", "Chronic Conditions", "PhilHealth Number"] },
    ],
    modals: [
      { name: "Statement of Account Preview", desc: "Downloadable SOA in PDF format with all fees, discounts, and payments listed" },
      { name: "Grade Detail Drill-down", desc: "Expanded view of a specific subject's grade breakdown by component and period" },
    ],
    reports: [],
  },

  HR_MANAGEMENT: {
    name: "HR Management",
    group: "Human Resources",
    icon: "⬛",
    purpose: "HR Management is the comprehensive human resources platform covering the entire employee lifecycle — from recruitment and onboarding through daily attendance, leave management, and separation. It provides the HR team with tools for workforce planning and compliance.",
    features: [
      "HR Dashboard with workforce KPIs and alert cards",
      "Complete employee lifecycle management (hire, transfer, promote, separate)",
      "Daily attendance monitoring with clock-in/out records",
      "Shift template creation and employee assignment",
      "Leave management with filing, approval, and balance tracking",
      "Recruitment pipeline with job postings and applicant tracking",
      "Onboarding checklist for new hires",
    ],
    workflow: [
      "HR opens the HR Dashboard for a high-level workforce summary",
      "Navigates to Employee Life Cycles to manage a specific employee record",
      "Checks Time Management for today's attendance logs and exceptions",
      "Reviews and processes pending leave applications",
      "For recruitment: creates job postings and tracks applicant stages",
      "For onboarding: generates and tracks the new hire checklist",
    ],
    tabs: [
      { name: "HR Dashboard", desc: "KPI overview: headcount, attendance rate, leave balances, and open positions" },
      { name: "Employee Life Cycles", desc: "Employee master list with employment history, promotions, and status changes" },
      { name: "Time Management", desc: "Daily time records (DTR), hours worked, and overtime tracking" },
      { name: "Shift Management", desc: "Shift template creation and employee-to-shift assignment calendar" },
      { name: "Attendance Monitoring", desc: "Day-by-day attendance records with present, absent, late, and early-out flags" },
      { name: "Leave Management", desc: "Leave application queue, approval workflow, leave balance ledger, and leave calendar" },
      { name: "Recruitment", desc: "Job postings, applicant profiles, interview scheduling, and job offer management" },
      { name: "Onboarding", desc: "New hire checklist with completion tracking per onboarding requirement" },
    ],
    forms: [
      { name: "New Employee Form", fields: ["Employee Name", "Employee ID", "Department", "Position", "Employment Type (Regular / Contractual / Part-time)", "Date Hired", "Salary Rate", "Tax Setup", "Benefits Enrollment"] },
      { name: "Leave Application Form", fields: ["Employee Name", "Leave Type (Vacation / Sick / Emergency / Others)", "Date From", "Date To", "Number of Days", "Reason", "Supporting Document"] },
      { name: "Recruitment Job Posting Form", fields: ["Position Title", "Department", "Employment Type", "Slots Available", "Job Description", "Requirements", "Application Deadline"] },
    ],
    modals: [
      { name: "Employee Profile", desc: "Full employee record with employment history, benefits, and document files" },
      { name: "Leave Approval", desc: "Review and approve or reject a leave application with supervisor notes" },
      { name: "Attendance Correction", desc: "Manual correction of missed clock-in or clock-out entries with justification" },
    ],
    reports: [],
  },

  PAYROLL_MANAGEMENT: {
    name: "Payroll Management",
    group: "Payroll",
    icon: "⬛",
    purpose: "Payroll Management handles the complete payroll cycle: setting up the payroll run, computing gross pay, applying deductions (SSS, PhilHealth, Pag-IBIG, BIR), generating payslips, and authorizing payment release.",
    features: [
      "Payroll Dashboard with KPI cards for current period totals",
      "Payroll run generation with period lock and computation",
      "Salary adjustment and exception handling",
      "Automatic government contribution deduction (SSS, PhilHealth, Pag-IBIG)",
      "BIR withholding tax computation based on compensation brackets",
      "Payslip generation per employee in PDF format",
      "Salary payout batch creation and bank file export",
      "Benefits administration (HMO, allowances, 13th month)",
    ],
    workflow: [
      "Payroll officer opens Payroll Management",
      "Creates a new payroll run for the current cut-off period",
      "System auto-computes gross pay based on salary rates and DTR",
      "Reviews and adjusts for any corrections or additions",
      "Runs final computation — system applies all deductions",
      "Generates payslips per employee for review",
      "Submits payroll run for final approval through the Action Center",
      "On approval: creates salary payout batch and exports bank file",
    ],
    tabs: [
      { name: "Payroll Dashboard", desc: "Current period payroll KPIs: total gross, deductions, net pay, and headcount" },
      { name: "Payroll Management", desc: "Payroll run list with period, status, and total gross/net amounts" },
      { name: "Salary Payouts", desc: "Payment batch list with release status, bank file export, and authorization controls" },
      { name: "Taxes", desc: "BIR withholding tax configuration, monthly computation, and BIR form generation" },
      { name: "Benefits", desc: "SSS, PhilHealth, Pag-IBIG contribution tables and employee benefit enrollment" },
    ],
    forms: [
      { name: "New Payroll Run Form", fields: ["Pay Period (From – To)", "Cut-off Type (Semi-monthly / Monthly)", "Employees Included", "Pay Date", "Remarks"] },
      { name: "Salary Adjustment Form", fields: ["Employee", "Adjustment Type (Addition / Deduction)", "Amount", "Description", "Effective Period"] },
    ],
    modals: [
      { name: "Payslip Preview", desc: "Individual payslip with gross pay, itemized deductions, and net pay — downloadable as PDF" },
      { name: "Batch Payout Release", desc: "Confirm and authorize salary payout batch with total amount and employee count" },
    ],
    reports: [
      { name: "Payroll Register", desc: "Full payroll register for a period with each employee's gross, deductions, and net pay" },
      { name: "SSS / PhilHealth / Pag-IBIG Report", desc: "Government contribution summary for remittance preparation" },
      { name: "BIR Monthly Withholding Tax Report", desc: "Monthly alpha list of employees with withheld taxes for BIR submission" },
    ],
  },

  GUIDANCE: {
    name: "Guidance Office",
    group: "Student Welfare",
    icon: "⬛",
    purpose: "The Guidance Office module enables guidance counselors to maintain comprehensive records of student behavioral incidents, counseling sessions, and other pastoral notes. It supports follow-up tracking and confidentiality controls for sensitive cases.",
    features: [
      "Anecdotal record logging by incident type (Behavioral, Academic, Attendance, Social, Commendation, Disciplinary)",
      "Counseling session records with session type, concern area, and counselor notes",
      "Follow-up date tracking and completion marking",
      "Confidentiality flag for sensitive records",
      "Search and filter by student, incident type, and date range",
      "Student-linked record view for holistic case tracking",
    ],
    workflow: [
      "Guidance counselor opens the Guidance Office",
      "Searches for a student to log a new record",
      "Adds an Anecdotal Record: selects incident type, describes the incident, adds action taken",
      "Or logs a Counseling Session: selects session type and concern area, records summary and recommendations",
      "Sets a follow-up date if further monitoring is needed",
      "Marks follow-up as done once completed",
      "Generates a guidance report for administration",
    ],
    tabs: [
      { name: "Anecdotal Records", desc: "Behavioral and academic incident logs per student with incident type, action taken, and follow-up status" },
      { name: "Counseling Sessions", desc: "Individual and group counseling logs with session type, concern area, status, and counselor notes" },
    ],
    forms: [
      { name: "New Anecdotal Record", fields: ["Student", "Record Date", "Incident Type", "Description", "Action Taken", "Follow-Up Date", "Reported By", "Confidential (Yes / No)"] },
      { name: "New Counseling Session", fields: ["Student", "Session Date", "Session Type (Individual / Group / Family / Crisis / Follow-up)", "Concern Area", "Session Summary", "Recommendations", "Next Session Date", "Counselor Name", "Status", "Confidential"] },
    ],
    modals: [
      { name: "Record Detail View", desc: "Full anecdotal record or counseling session detail with edit controls and follow-up tracking" },
    ],
    reports: [],
  },

  GUIDANCE_REPORTS: {
    name: "Guidance Reports",
    group: "Student Welfare",
    icon: "⬛",
    purpose: "Guidance Reports provides statistical summaries and detailed reports on student behavioral records, counseling sessions, and incident trends. These reports support school administration in monitoring student welfare and compliance.",
    features: [
      "Incident frequency report by type and date range",
      "Counseling session summary by concern area and session type",
      "Student case history compilation report",
      "Referral tracking and follow-up status report",
      "Export to PDF and Excel",
    ],
    workflow: [
      "Guidance counselor navigates to Guidance Reports",
      "Selects the report type and date range",
      "Previews the report on-screen",
      "Exports to PDF or Excel for submission to the principal",
    ],
    tabs: [],
    forms: [],
    modals: [
      { name: "Report Preview", desc: "On-screen report preview with Export PDF and Export Excel controls" },
    ],
    reports: [
      { name: "Incident Frequency Report", desc: "Count of incidents by type (Behavioral, Academic, Disciplinary, etc.) for a period" },
      { name: "Counseling Session Summary", desc: "Summary of sessions by type, concern area, and status" },
      { name: "Student Case History", desc: "Chronological case log for a specific student combining anecdotal records and sessions" },
      { name: "Follow-Up Status Report", desc: "List of cases with pending follow-up dates and completion status" },
    ],
  },

  NURSE_CLINIC: {
    name: "Clinic Module (School Nurse)",
    group: "Student Health",
    icon: "⬛",
    purpose: "The Clinic Module enables the school nurse to record and track student health visits, maintain student health profiles, and manage medical incidents. It serves as the digital health office log for all student health events.",
    features: [
      "Health visit log with chief complaint, vital signs, action taken, and disposition",
      "Student health profile with blood type, allergies, and chronic conditions",
      "Disposition tracking: Released, Sent Home, Referred to Hospital, Observation, For Follow-up",
      "Emergency contact information per student",
      "PhilHealth number and primary physician details",
      "Visit history per student with date and complaint timeline",
    ],
    workflow: [
      "Student comes to the clinic",
      "Nurse searches for the student and opens their health profile",
      "Logs the health visit: records the chief complaint, takes vital signs",
      "Notes the action taken (medication, first aid, rest)",
      "Sets the disposition (Released, Sent Home, Referred to Hospital, etc.)",
      "If needed, updates the student's health profile with new allergy or condition information",
      "End-of-day: generates clinic visit summary report",
    ],
    tabs: [
      { name: "Health Visits", desc: "Clinic visit log with student, date, chief complaint, action taken, and disposition" },
      { name: "Health Profiles", desc: "Student health profiles with blood type, allergies, chronic conditions, and emergency contact" },
    ],
    forms: [
      { name: "Log Health Visit", fields: ["Student Name", "Section", "Visit Date", "Visit Time", "Chief Complaint", "Vital Signs (BP, Temp, Pulse, Resp Rate, Weight)", "Action Taken", "Disposition", "Recorded By", "Notes"] },
      { name: "Health Profile Form", fields: ["Blood Type", "Known Allergies", "Chronic Conditions", "Emergency Contact Name", "Emergency Contact Phone", "Primary Physician", "PhilHealth Number", "Notes"] },
    ],
    modals: [
      { name: "Visit Detail", desc: "Full view of a clinic visit record with all fields and vital signs" },
      { name: "Health Profile Detail", desc: "Complete student health profile with all medical history and emergency information" },
    ],
    reports: [],
  },

  CONSULTATION: {
    name: "Consultation (Appointments)",
    group: "Student Health",
    icon: "⬛",
    purpose: "The Consultation module manages appointment bookings between students/parents and school staff (guidance counselors, nurses, teachers, or subject advisers). It provides a calendar-based scheduling interface and appointment notes.",
    features: [
      "Appointment booking with staff member and time slot selection",
      "Appointment calendar view by day and week",
      "Consultation notes logged after the appointment",
      "Appointment status: Pending, Confirmed, Completed, Cancelled",
      "Online booking by students through the Student Portal",
    ],
    workflow: [
      "Student books a consultation through the Student Portal",
      "Staff member confirms the appointment",
      "On the appointment date, staff conducts the consultation",
      "Staff logs the consultation notes and marks the appointment as Completed",
    ],
    tabs: [
      { name: "Appointments", desc: "List and calendar view of all scheduled consultations" },
    ],
    forms: [
      { name: "Book Appointment", fields: ["Staff Member / Department", "Appointment Date", "Time Slot", "Purpose / Concern", "Notes (Optional)"] },
    ],
    modals: [
      { name: "Appointment Detail", desc: "Appointment view with consultation notes and status update controls" },
    ],
    reports: [],
  },

  CLINIC_REPORTS: {
    name: "Clinic Reports",
    group: "Student Health",
    icon: "⬛",
    purpose: "Clinic Reports provides summary and analytical reports on student health visits, common ailments, and medical trends for school health program planning and compliance documentation.",
    features: [
      "Visit frequency report by ailment, grade level, and date range",
      "Medical clearance issuance log",
      "Health incident trend analysis",
      "Student medical referral report",
      "Export to PDF and Excel",
    ],
    workflow: [
      "Nurse navigates to Clinic Reports",
      "Selects report type and date range",
      "Previews the report, exports to PDF or Excel",
    ],
    tabs: [],
    forms: [],
    modals: [
      { name: "Report Preview", desc: "On-screen report preview with Export PDF and Export Excel controls" },
    ],
    reports: [
      { name: "Visit Frequency Report", desc: "Count of clinic visits by chief complaint category and date range" },
      { name: "Health Incident Summary", desc: "Log of significant medical incidents and their dispositions" },
      { name: "Medical Referral Report", desc: "Students referred to hospital or specialist with dates and reasons" },
      { name: "Medical Clearance Log", desc: "Record of medical clearances issued during a given period" },
    ],
  },

  ACCOUNTS_SECURITY: {
    name: "User Access & Authority",
    group: "System Administration",
    icon: "⬛",
    purpose: "User Access & Authority is the security management center for the STSN Connect system. Super Admins use it to manage user accounts, reset credentials, monitor access events, and manage delegation of approval authority between staff.",
    features: [
      "User account list with role, status, and last-login information",
      "Password reset and account lock/unlock controls",
      "Role assignment and permission review per user",
      "Approval authority delegation: delegate module-specific approval rights with date range",
      "Complete system audit trail with all user actions timestamped",
      "Admin reports on user activity and access patterns",
    ],
    workflow: [
      "Super admin navigates to User Access & Authority",
      "Reviews user accounts for security anomalies",
      "Resets a user's password or unlocks a locked account",
      "Creates a delegation record to temporarily transfer approval authority",
      "Checks the audit log for unusual activity or compliance review",
      "Generates admin reports on access and activity",
    ],
    tabs: [
      { name: "User Security", desc: "User account list with status, role, and last-login — with password reset and lock controls" },
      { name: "Delegation Management", desc: "Active and past delegation records with scope, date range, and authorizing officer" },
      { name: "Audit Log", desc: "Chronological log of all system actions: who did what, when, and on which record" },
      { name: "Admin Reports", desc: "User activity report, module access report, and failed login analysis" },
    ],
    forms: [
      { name: "Create Delegation", fields: ["Delegating Officer", "Delegate (Recipient)", "Module Scope (which approvals are delegated)", "Effective Date From", "Effective Date To", "Reason / Authority", "Authorized By"] },
    ],
    modals: [
      { name: "User Account Detail", desc: "Full user profile view with role, status, last-login, and action buttons (Reset Password, Lock, Unlock)" },
      { name: "Audit Entry Detail", desc: "Expanded audit log entry showing full action description, affected record, and timestamp" },
    ],
    reports: [
      { name: "User Activity Report", desc: "Actions performed per user within a date range, sorted by module" },
      { name: "Failed Login Report", desc: "Log of failed login attempts with IP address and timestamp for security monitoring" },
      { name: "Module Access Report", desc: "Count of logins and actions per module for system usage analysis" },
    ],
  },

  CORE_SETUP: {
    name: "Core Setup",
    group: "System Administration",
    icon: "⬛",
    purpose: "Core Setup is the master system configuration module where school administrators define school information, academic calendar parameters, grading period structures, and global system settings that govern how all other modules behave.",
    features: [
      "School profile: name, address, principal, DepEd school ID",
      "Academic year setup with start and end dates",
      "School term configuration (Semester / Trimester / Annual)",
      "Grading period definitions with date ranges",
      "Academic unit context switching (Basic Ed / College)",
      "Global system preferences and notification settings",
    ],
    workflow: [
      "Super admin opens Core Setup at the start of each academic year",
      "Verifies and updates the school profile information",
      "Creates the new academic year with its start and end dates",
      "Defines grading periods for the year (e.g., 1st Quarter: June–August)",
      "Activates the academic year to set it as the current active context",
      "All enrollment, grading, and scheduling modules use these settings as their reference",
    ],
    tabs: [
      { name: "School Setup", desc: "School name, address, DepEd school ID, and logo configuration" },
      { name: "Academic Year", desc: "Academic year list with start/end dates and active status" },
      { name: "Grading Periods", desc: "Grading period definitions with date ranges per academic year" },
      { name: "System Configuration", desc: "Global system preferences, email notification settings, and feature toggles" },
    ],
    forms: [
      { name: "Academic Year Form", fields: ["School Year Label (e.g., 2025–2026)", "Start Date", "End Date", "School Terms", "Active Status"] },
      { name: "Grading Period Form", fields: ["Period Name (e.g., 1st Quarter)", "Start Date", "End Date", "Academic Year", "Sequence Number"] },
    ],
    modals: [],
    reports: [],
  },

  GUARDIAN_PORTAL: {
    name: "Parent Portal",
    group: "Family Access",
    icon: "⬛",
    purpose: "The Parent Portal gives parents and guardians a secure window into their child's school records. Parents can view academic performance, monitor fee balances, check attendance, and read school announcements — without needing to visit the school office.",
    features: [
      "Child selector for parents with multiple enrolled children",
      "Academic grade summary per subject and grading period",
      "Tuition fee balance and payment history",
      "Attendance record with present, absent, and late counts",
      "School announcements and important notices",
      "Read-only access — no data editing",
    ],
    workflow: [
      "Parent logs in with their guardian account credentials",
      "Selects their child (if multiple children are enrolled)",
      "Views the academic grade summary",
      "Checks the financial ledger for any outstanding fees",
      "Reviews attendance record and any notices from the school",
    ],
    tabs: [
      { name: "Academic Summary", desc: "Subject grades per grading period with GPA and academic standing" },
      { name: "Financial Summary", desc: "Fee assessment, payments made, and remaining balance" },
      { name: "Attendance", desc: "Monthly attendance record with present, absent, late, and early-out counts" },
      { name: "Announcements", desc: "School-wide and grade-level announcements from the administration" },
    ],
    forms: [],
    modals: [],
    reports: [],
  },

  BOOKS_SETUP: {
    name: "Books & Library Setup",
    group: "Academic Administration",
    icon: "⬛",
    purpose: "Books Setup enables the school to configure book packages assigned to each grade level. These packages are automatically included in the enrollment fee assessment and can be issued to enrolled students.",
    features: [
      "Book package definition per grade level",
      "Book title and price configuration",
      "Automatic inclusion in enrollment assessment",
      "Issuance tracking per enrolled student",
    ],
    workflow: [
      "Admin configures book packages per grade level",
      "On enrollment: the book package is automatically added to the fee assessment",
      "Upon payment: book package is marked as issued to the student",
    ],
    tabs: [
      { name: "Book Packages", desc: "Grade level to book package mapping with titles, quantities, and prices" },
    ],
    forms: [
      { name: "Book Package Form", fields: ["Grade Level", "Package Name", "Books Included: [Title | Publisher | Unit Price]", "Total Package Price"] },
    ],
    modals: [],
    reports: [],
  },

};

// ─── Demo-friendly content engine ────────────────────────────────────────────
// Replaces the internal "Forms" and "Modals & Dialogs" sections with
// school-facing demo guidance. Curated overrides below cover the modules that
// matter most in a live school demo; every other module falls back to content
// synthesised from its existing purpose / features / workflow, so no page is
// ever left blank. Automation notes are written to match what is ACTUALLY in
// the codebase (see the Communication Automation page) — implemented vs.
// partial/mock vs. recommended — and never over-claim SMS/email delivery.

const OFFICE_BY_GROUP = {
  "Command Center": "All staff roles and school heads",
  "Workflow Management": "Every approving officer across the school",
  "Admissions": "Registrar's Office",
  "Student Records": "Registrar's Office",
  "Academics": "Registrar, principal, and faculty",
  "Faculty": "Registrar and faculty",
  "Finance": "Accounting Office",
  "Accounting": "Accounting Office",
  "Cashiering": "Cashier / Collections",
  "Teaching": "Teachers and advisers",
  "Learning": "Teachers and students",
  "Student Services": "Students and parents",
  "Human Resources": "HR Office",
  "Payroll": "Payroll / Accounting",
  "Guidance": "Guidance Office",
  "Clinic": "School Nurse / Clinic",
  "Health": "School Nurse / Clinic",
  "Security": "System Administrator",
  "Administration": "System Administrator",
  "Configuration": "System Administrator",
  "Parent Engagement": "Parents and guardians",
};

// Reusable, accurate communication building blocks.
const REC_EMAIL_SMS = "Email/SMS delivery to parents and students can be connected to a provider (e.g. for receipts, reminders, and confirmations)";

const DEMO_OVERRIDES = {
  ACTION_CENTER: {
    value: "One screen to approve everything — enrollment, assessments, discounts, leave, and payroll — so nothing waits in a staff member's inbox.",
    beneficiaries: "Principals, accounting heads, HR, and any approving officer.",
    say: [
      "This is where approvers spend their morning — every pending item in one queue.",
      "Show the in-app bell: approvals, returns, and rejections notify the right staff instantly.",
      "Emphasise the full approval trail — who approved what, and when.",
    ],
    flow: [
      "Open Action Center and show the consolidated pending queue.",
      "Filter to one type (e.g. Assessments) and open a detail panel.",
      "Add a note and approve — show the item leave the queue.",
      "Open the notification bell to show the staff alert that was raised.",
    ],
    automation: {
      implemented: [
        "In-app workflow notifications for assessment approve/return, void approve/reject, grade-period submit/approve/return, and leave approve/reject",
        "Role-targeted delivery (only the relevant offices see each alert) plus school-wide Announcements",
      ],
      partial: [],
      recommended: ["Mirror these in-app alerts to email for off-system approvers"],
    },
  },
  REGISTRAR: {
    value: "Replaces paper enrollment forms with one guided, validated wizard plus an online application queue parents can submit from home.",
    beneficiaries: "Registrar's Office (primary); parents and students get a faster admission.",
    say: [
      "Show a full new-student enrollment without leaving the screen.",
      "Point out the Online Queue — applications submitted from home arrive here automatically.",
      "Highlight one-click Certificate of Registration (COR) printing.",
    ],
    flow: [
      "Open Enrollment and review an application in the Online Queue.",
      "Click New Enrollment and step through personal → guardian → academic → fees → documents.",
      "Submit and show the status change to 'For Assessment'.",
      "After accounting approves, generate and print the COR.",
    ],
    automation: {
      implemented: ["In-app notification to Cashier/Registrar when an assessment is approved for payment"],
      partial: [],
      recommended: [
        "Email/SMS to the parent when an online application is received, approved, or returned for missing documents",
        "Email the COR to the parent once the student is officially enrolled",
      ],
    },
  },
  ACCOUNTING: {
    value: "Gives the accounting office a real ledger — assessments, discounts, and balances — instead of spreadsheets, with approvals routed in-app.",
    beneficiaries: "Accounting Office; parents benefit from accurate statements.",
    say: [
      "Show a student ledger with running balance and posted transactions.",
      "Demonstrate the assessment approval that releases a student to the cashier.",
      "Point out that approvals raise an in-app alert to the cashier in real time.",
    ],
    flow: [
      "Open a student account and show the ledger.",
      "Approve a pending assessment.",
      "Show the in-app notification raised for the Cashier.",
    ],
    automation: {
      implemented: ["In-app notification to Cashier/Registrar when an assessment is approved"],
      partial: [],
      recommended: [
        "Email the statement of account to parents",
        "SMS payment reminders as due dates approach",
      ],
    },
  },
  CASHIER: {
    value: "Speeds up the payment window — approved assessments appear in a queue, and posting a payment issues an official receipt instantly.",
    beneficiaries: "Cashier / Collections; parents get an immediate receipt.",
    say: [
      "Show the payment queue of students already cleared by accounting.",
      "Post a payment and show the official receipt generated on the spot.",
      "Mention void requests are approval-controlled and logged.",
    ],
    flow: [
      "Open the Cashiering queue.",
      "Select a student and post a payment.",
      "Print/preview the official receipt.",
    ],
    automation: {
      implemented: ["In-app notifications for void-request approve/reject"],
      partial: [],
      recommended: [
        "Email the official receipt to the parent after posting",
        "SMS confirmation that a payment was received",
      ],
    },
  },
  FACULTY_PORTAL: {
    value: "Gives teachers one board for schedules, attendance, and grade encoding — and lets advisers log daily attendance in seconds.",
    beneficiaries: "Teachers and advisers; parents benefit from timely attendance follow-up.",
    say: [
      "Show the adviser logging a section's attendance for the day.",
      "Be transparent: the on-screen 'SMS sent to parents' message is a demo simulation — real SMS is a connect-a-provider step.",
      "Show grade encoding feeding the approval workflow.",
    ],
    flow: [
      "Open the Teacher Board and the advisory roster.",
      "Mark attendance for the section and submit.",
      "Open Grade Encoding and submit grades for approval.",
    ],
    automation: {
      implemented: ["In-app notifications when a grade period is submitted, approved, or returned"],
      partial: ["Attendance submission shows a simulated 'SMS dispatched to parents' confirmation — no message is actually sent yet"],
      recommended: [
        "Same-day SMS to parents for absences and tardies",
        "Email attendance summaries to advisers and guidance",
      ],
    },
  },
  GRADING: {
    value: "Moves grade submission and approval out of email — teachers submit, principals approve, and everything is tracked.",
    beneficiaries: "Teachers, principals, and the registrar.",
    say: [
      "Show the grade approval chain: submit → approve → publish.",
      "Point out the in-app alerts that drive the workflow.",
      "Note grades can be published to the student/parent portal.",
    ],
    flow: [
      "Open a grade period and submit it for approval.",
      "Approve as principal and show the status change.",
      "Show where approved grades appear for students/parents.",
    ],
    automation: {
      implemented: ["In-app notifications for grade-period submit, approve, and return-for-revision"],
      partial: [],
      recommended: ["Email parents/students when grades are published to the portal"],
    },
  },
  GRADE_ENCODING: {
    value: "A focused screen for teachers to enter and submit grades, with validation before they enter the approval workflow.",
    beneficiaries: "Teachers and the principal who approves.",
    say: [
      "Show fast grade entry per subject and class.",
      "Submit and show it move into the approval queue.",
      "Mention returns come back with the principal's note.",
    ],
    flow: [
      "Open a class and encode grades.",
      "Submit for approval.",
      "Show the in-app confirmation to the approver.",
    ],
    automation: {
      implemented: ["In-app notifications for grade-period submit/approve/return"],
      partial: [],
      recommended: ["Email teachers when grades are returned for revision"],
    },
  },
  HR_MANAGEMENT: {
    value: "One place for employee records, attendance, shifts, leave, and onboarding — with leave approvals routed in-app.",
    beneficiaries: "HR Office; employees get faster leave decisions.",
    say: [
      "Show the employee lifecycle and a profile record.",
      "File a leave request and approve it to show the in-app alert.",
      "Point out onboarding checklists for new hires.",
    ],
    flow: [
      "Open Employee Life Cycles and a profile.",
      "File a leave request and approve it.",
      "Show the in-app notification to the employee/HR.",
    ],
    automation: {
      implemented: ["In-app notifications when a leave request is approved or rejected"],
      partial: [],
      recommended: [
        "Email employees their leave decision and onboarding tasks",
        "SMS only for urgent HR announcements, if enabled",
      ],
    },
  },
  PAYROLL_MANAGEMENT: {
    value: "Computes semi-monthly payroll with statutory deductions and tax, then routes runs for approval before release.",
    beneficiaries: "Payroll / Accounting; employees get accurate payslips.",
    say: [
      "Show a payroll run computing basic pay, SSS/PhilHealth/Pag-IBIG, and withholding tax.",
      "Walk the run through review and approval.",
      "Show a generated payslip.",
    ],
    flow: [
      "Open Payroll Management and compute a run.",
      "Send it for review and approve it.",
      "Open an employee payslip.",
    ],
    automation: {
      implemented: ["In-app notifications available through the approval workflow"],
      partial: [],
      recommended: [
        "Email each employee their payslip when a run is released",
        "In-app alert to the approver when a run is pending",
      ],
    },
  },
  NURSE_CLINIC: {
    value: "A clinic logbook that keeps every student visit, incident, and treatment in one searchable health record.",
    beneficiaries: "School Nurse; parents benefit from prompt incident follow-up.",
    say: [
      "Record a clinic visit and show it attach to the student's health profile.",
      "Show the visit history for a student.",
      "Note urgent incidents are where parent SMS would matter most.",
    ],
    flow: [
      "Open the Clinic module and find a student.",
      "Log a visit with complaint and treatment.",
      "Show the updated health profile.",
    ],
    automation: {
      implemented: [],
      partial: [],
      recommended: [
        "SMS the parent for urgent clinic incidents or send-home decisions",
        "Email a clinic visit summary; in-app alert to the adviser",
      ],
    },
  },
  GUIDANCE: {
    value: "Keeps anecdotal records, counseling sessions, and follow-ups confidential and organised for the guidance office.",
    beneficiaries: "Guidance Office and advisers.",
    say: [
      "Show an anecdotal record and a counseling session log.",
      "Point out follow-up tracking.",
      "Note parent conference scheduling is a natural notification point.",
    ],
    flow: [
      "Open the Guidance Office and a student record.",
      "Log a counseling session.",
      "Create a follow-up.",
    ],
    automation: {
      implemented: [],
      partial: [],
      recommended: [
        "Email/SMS parents appointment and conference details",
        "In-app task alerts for the counselor's queue",
      ],
    },
  },
  CONSULTATION: {
    value: "Lets parents and students book adviser/consultation appointments and keeps everyone on the same schedule.",
    beneficiaries: "Advisers, guidance, parents, and students.",
    say: [
      "Show an appointment being booked and scheduled.",
      "Point out the shared calendar view.",
      "Note reminders are the obvious next automation.",
    ],
    flow: [
      "Open Consultation and create an appointment request.",
      "Schedule it and show the confirmation.",
    ],
    automation: {
      implemented: [],
      partial: [],
      recommended: ["Email appointment details and SMS reminders before the meeting"],
    },
  },
  ACCOUNTS_SECURITY: {
    value: "Controls who can do what — accounts, roles, delegation of authority, and a full audit log of sensitive actions.",
    beneficiaries: "System Administrator and approvers.",
    say: [
      "Show user accounts and role assignment.",
      "Demonstrate delegation of approval authority.",
      "Open the audit log to show full traceability.",
    ],
    flow: [
      "Open User Access and a user record.",
      "Change a role or assign a delegation.",
      "Show the action captured in the audit log.",
    ],
    automation: {
      implemented: ["In-app/audit trail captures account and authority changes"],
      partial: [],
      recommended: ["Email the affected user when an account or access level changes"],
    },
  },
  STUDENT_PORTAL: {
    value: "Self-service for students — grades, ledger, COR, and online enrollment — reducing front-desk queues.",
    beneficiaries: "Students (and parents); registrar and cashier get fewer walk-ins.",
    say: [
      "Show the student viewing grades and their financial ledger.",
      "Point out self-service online enrollment.",
      "Note this is a recipient surface for published grades and balances.",
    ],
    flow: [
      "Log in as a student and open Records Overview.",
      "Show the report card and ledger tabs.",
      "Open the self-service enrollment tab.",
    ],
    automation: {
      implemented: ["In-app portal updates as records change"],
      partial: [],
      recommended: ["Email/SMS students when grades are published or a balance is due"],
    },
  },
  GUARDIAN_PORTAL: {
    value: "Gives parents a window into their child's grades, fees, and school notices — the main audience for communication automation.",
    beneficiaries: "Parents and guardians.",
    say: [
      "Show a parent viewing their child's grades and balance.",
      "Point out school notices/announcements.",
      "Frame this as the destination for enrollment, payment, attendance, and clinic alerts.",
    ],
    flow: [
      "Log in as a parent and open the child's overview.",
      "Show grades and the fee/ledger view.",
      "Show the notices feed.",
    ],
    automation: {
      implemented: ["In-app notices/announcements visible to parents"],
      partial: [],
      recommended: ["Email/SMS parents for enrollment status, payments, attendance, grades, and clinic incidents"],
    },
  },
};

// Attach module keys + curated overrides onto the module objects.
for (const [key, mod] of Object.entries(MODULE_PAGES)) {
  mod.__key = key;
  if (DEMO_OVERRIDES[key]) mod.demo = DEMO_OVERRIDES[key];
}

function firstSentence(text) {
  const m = (text || "").match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : (text || "")).trim();
}

// Returns the school-facing demo content for a module, using a curated override
// when present and otherwise synthesising from the module's own data.
function demoContent(mod) {
  const o = mod.demo || {};
  return {
    say: (o.say && o.say.length ? o.say : (mod.features || []).slice(0, 3)),
    flow: (o.flow && o.flow.length ? o.flow : (mod.workflow || []).slice(0, 4)),
    value: o.value || firstSentence(mod.purpose),
    beneficiaries: o.beneficiaries || ((OFFICE_BY_GROUP[mod.group] || (mod.group + " team")) + "."),
    automation: o.automation || null,
  };
}

// ─── HTML Generation ──────────────────────────────────────────────────────────

function css() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #2d241e;
      font-size: 11px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page container ── */
    .doc-page {
      width: 210mm;
      min-height: 297mm;
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      overflow: hidden;
    }
    .doc-page:last-child { page-break-after: avoid; }

    /* ── Cover Page ── */
    .cover-page {
      background: linear-gradient(160deg, #2e1c10 0%, #3d2b1f 40%, #4a3728 70%, #5c4533 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 297mm;
      padding: 20mm;
      text-align: center;
    }
    .cover-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-bottom: 24px;
      filter: drop-shadow(0 4px 12px rgba(197,160,89,0.4));
    }
    .cover-school {
      font-size: 13px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #c5a059;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .cover-title {
      font-size: 48px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -1px;
      margin-bottom: 4px;
      text-shadow: 0 2px 16px rgba(0,0,0,0.5);
    }
    .cover-subtitle {
      font-size: 18px;
      color: #d6cfb5;
      font-weight: 400;
      margin-bottom: 40px;
    }
    .cover-tag {
      display: inline-block;
      background: rgba(197,160,89,0.2);
      border: 1.5px solid #c5a059;
      color: #c5a059;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 8px 24px;
      border-radius: 4px;
      font-weight: 700;
      margin-bottom: 48px;
    }
    .cover-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c5a059, transparent);
      margin: 0 auto 24px;
    }
    .cover-stats {
      display: flex;
      gap: 40px;
      justify-content: center;
      margin-top: 32px;
    }
    .cover-stat {
      text-align: center;
    }
    .cover-stat-num {
      font-size: 32px;
      font-weight: 800;
      color: #c5a059;
      display: block;
    }
    .cover-stat-label {
      font-size: 10px;
      color: #d6cfb5;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .cover-footer {
      margin-top: 48px;
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 1px;
    }

    /* ── Page header / footer ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5mm 10mm 3mm;
      border-bottom: 1.5px solid #e5e0d5;
      background: #fffdf5;
    }
    .page-header-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-header-logo img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
    .page-header-brand {
      font-size: 10px;
      font-weight: 700;
      color: #5c4533;
      letter-spacing: 0.5px;
    }
    .page-header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9px;
      color: #9e8a7a;
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      background: #5c4533;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 3px;
      letter-spacing: 0.5px;
    }
    .group-badge {
      color: #9e8a7a;
      font-size: 9px;
    }

    /* ── Page content ── */
    .page-content {
      flex: 1;
      padding: 6mm 10mm 4mm;
    }

    /* ── Role Section Header ── */
    .role-header-page .page-content {
      padding: 0;
    }
    .role-header-banner {
      background: #2e1c10;
      padding: 12mm 14mm;
      color: #fff;
      min-height: 80mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .role-header-pre {
      font-size: 10px;
      color: #c5a059;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .role-header-title {
      font-size: 36px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      line-height: 1.1;
    }
    .role-header-tagline {
      font-size: 13px;
      color: #d6cfb5;
      font-weight: 400;
    }
    .role-responsibilities {
      padding: 8mm 14mm;
      background: #fffdf5;
    }
    .role-responsibilities h3 {
      font-size: 11px;
      font-weight: 700;
      color: #5c4533;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .role-responsibilities h3::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e0d5;
    }
    .role-resp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .role-resp-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 10.5px;
      color: #2d241e;
      line-height: 1.4;
    }
    .role-resp-item::before {
      content: '▸';
      color: #c5a059;
      font-size: 10px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .role-modules-bar {
      padding: 6mm 14mm;
      border-top: 1px solid #e5e0d5;
    }
    .role-modules-title {
      font-size: 10px;
      font-weight: 700;
      color: #9e8a7a;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .role-module-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .module-pill {
      background: #f5f1eb;
      border: 1px solid #e5e0d5;
      color: #5c4533;
      font-size: 9px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 20px;
    }

    /* ── Overview page ── */
    .overview-hero {
      background: #2e1c10;
      padding: 8mm 10mm;
      color: #fff;
    }
    .overview-hero h2 {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .overview-hero p {
      font-size: 11px;
      color: #d6cfb5;
      max-width: 130mm;
      line-height: 1.6;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: #e5e0d5;
      border: 1px solid #e5e0d5;
      margin: 5mm 0;
    }
    .overview-stat-card {
      background: #fffdf5;
      padding: 8mm;
      text-align: center;
    }
    .overview-stat-num {
      font-size: 36px;
      font-weight: 800;
      color: #5c4533;
      display: block;
      line-height: 1;
      margin-bottom: 4px;
    }
    .overview-stat-label {
      font-size: 10px;
      color: #9e8a7a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .overview-section-title {
      font-size: 11px;
      font-weight: 700;
      color: #5c4533;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .overview-roles-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
    }
    .overview-role-card {
      background: #f5f1eb;
      border: 1px solid #e5e0d5;
      padding: 6px 10px;
      border-radius: 4px;
      border-left: 3px solid #c5a059;
    }
    .overview-role-name {
      font-size: 10px;
      font-weight: 700;
      color: #2d241e;
    }
    .overview-role-desc {
      font-size: 9px;
      color: #9e8a7a;
      margin-top: 1px;
    }
    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .tech-tag {
      background: #2e1c10;
      color: #c5a059;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 3px;
      letter-spacing: 0.5px;
    }

    /* ── Module page ── */
    .module-page-title {
      font-size: 22px;
      font-weight: 800;
      color: #2d241e;
      line-height: 1.2;
      margin-bottom: 2px;
    }
    .module-page-group {
      font-size: 10px;
      color: #c5a059;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .module-purpose {
      font-size: 11px;
      color: #2d241e;
      line-height: 1.6;
      background: #f5f1eb;
      border-left: 3px solid #c5a059;
      padding: 8px 12px;
      margin-bottom: 10px;
      border-radius: 0 4px 4px 0;
    }

    /* ── Tabs indicator ── */
    .tabs-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }
    .tab-chip {
      background: #fffdf5;
      border: 1.5px solid #e5e0d5;
      color: #5c4533;
      font-size: 9px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      letter-spacing: 0.3px;
    }
    .tab-chip.active {
      background: #5c4533;
      border-color: #5c4533;
      color: #fff;
    }

    /* ── Screenshot box ── */
    .screenshot-box {
      background: #f5f1eb;
      border: 1.5px dashed #c5a059;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50mm;
      text-align: center;
    }
    .screenshot-box-icon {
      font-size: 28px;
      margin-bottom: 6px;
      opacity: 0.4;
    }
    .screenshot-box-label {
      font-size: 9px;
      font-weight: 700;
      color: #9e8a7a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .screenshot-box-desc {
      font-size: 9px;
      color: #b5a898;
      margin-top: 3px;
    }

    /* ── Three-column info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    }
    .info-grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .info-card {
      background: #fffdf5;
      border: 1px solid #e5e0d5;
      border-radius: 4px;
      padding: 8px;
    }
    .info-card-title {
      font-size: 9px;
      font-weight: 700;
      color: #5c4533;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e0d5;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .info-card-title .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #c5a059;
      flex-shrink: 0;
    }
    .info-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .info-list li {
      font-size: 10px;
      color: #2d241e;
      line-height: 1.4;
      padding-left: 12px;
      position: relative;
    }
    .info-list li::before {
      content: '▸';
      color: #c5a059;
      position: absolute;
      left: 0;
      font-size: 9px;
    }
    .info-list.numbered { counter-reset: step; }
    .info-list.numbered li::before {
      content: counter(step) '.';
      counter-increment: step;
      color: #5c4533;
      font-weight: 700;
      font-size: 9px;
    }

    /* ── Forms & Modals section ── */
    .forms-section, .modals-section, .reports-section {
      margin-top: 8px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      color: #5c4533;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e5e0d5;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .form-card {
      background: #fffdf5;
      border: 1px solid #e5e0d5;
      border-radius: 4px;
      padding: 7px 10px;
      margin-bottom: 5px;
    }
    .form-card-name {
      font-size: 10px;
      font-weight: 700;
      color: #2d241e;
      margin-bottom: 4px;
    }
    .form-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
    }
    .field-chip {
      background: #f0ece5;
      border: 1px solid #e5e0d5;
      color: #6b5242;
      font-size: 8px;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .modal-card {
      background: #fffdf5;
      border: 1px solid #e5e0d5;
      border-left: 3px solid #5c4533;
      border-radius: 0 4px 4px 0;
      padding: 6px 10px;
      margin-bottom: 4px;
    }
    .modal-card-name {
      font-size: 10px;
      font-weight: 700;
      color: #2d241e;
    }
    .modal-card-desc {
      font-size: 9.5px;
      color: #6b5242;
      margin-top: 2px;
      line-height: 1.4;
    }
    .report-card {
      background: #fffdf5;
      border: 1px solid #e5e0d5;
      border-left: 3px solid #c5a059;
      border-radius: 0 4px 4px 0;
      padding: 6px 10px;
      margin-bottom: 4px;
      display: flex;
      gap: 8px;
    }
    .report-card-name {
      font-size: 10px;
      font-weight: 700;
      color: #2d241e;
      min-width: 50mm;
    }
    .report-card-desc {
      font-size: 9.5px;
      color: #6b5242;
      line-height: 1.4;
    }

    /* ── Demo Highlights (replaces Forms / Modals) ── */
    .demo-section { margin-top: 8px; }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 6px;
    }
    .demo-card {
      background: #fffdf5;
      border: 1px solid #e5e0d5;
      border-radius: 4px;
      padding: 7px 10px;
    }
    .demo-card-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #5c4533;
      margin-bottom: 4px;
    }
    .demo-list { margin: 0; padding-left: 14px; }
    .demo-list li {
      font-size: 9px;
      color: #4a3b30;
      line-height: 1.45;
      margin-bottom: 2px;
    }
    ol.demo-numbered { counter-reset: dstep; list-style: none; padding-left: 0; }
    ol.demo-numbered li { position: relative; padding-left: 16px; }
    ol.demo-numbered li::before {
      content: counter(dstep) '.';
      counter-increment: dstep;
      position: absolute; left: 0;
      color: #c5a059; font-weight: 700; font-size: 9px;
    }
    .value-card {
      background: #faf6ec;
      border: 1px solid #e5e0d5;
      border-left: 3px solid #c5a059;
      border-radius: 0 4px 4px 0;
      padding: 6px 10px;
      font-size: 9px;
      color: #4a3b30;
      line-height: 1.45;
      margin-bottom: 6px;
    }
    .value-label { font-weight: 700; color: #5c4533; }
    .value-benefits { margin-top: 3px; }

    /* ── Automation & Notifications note ── */
    .automation-note {
      background: #fffdf5;
      border: 1px solid #e5e0d5;
      border-radius: 4px;
      padding: 7px 10px;
    }
    .automation-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #5c4533;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .automation-tiers { display: flex; flex-direction: column; gap: 5px; }
    .auto-tier { border-radius: 3px; padding: 5px 8px; }
    .auto-tier.tier-live { background: #f0f7f0; border-left: 3px solid #4d8a52; }
    .auto-tier.tier-partial { background: #fbf6ec; border-left: 3px solid #d9a23a; }
    .auto-tier.tier-rec { background: #f3f1ec; border-left: 3px solid #9e8a7a; }
    .auto-tier-label {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    .tier-live .auto-tier-label { color: #356b3a; }
    .tier-partial .auto-tier-label { color: #9a6f1d; }
    .tier-rec .auto-tier-label { color: #6b5242; }
    .auto-list { margin: 0; padding-left: 14px; }
    .auto-list li { font-size: 8.5px; color: #4a3b30; line-height: 1.4; margin-bottom: 1px; }

    /* ── Communication Automation page ── */
    .comm-hero { margin-bottom: 10px; }
    .comm-hero h2 { font-size: 19px; color: #2d241e; margin: 0 0 6px; }
    .comm-statement {
      background: #faf6ec;
      border: 1px solid #e5e0d5;
      border-left: 4px solid #c5a059;
      border-radius: 0 5px 5px 0;
      padding: 9px 12px;
      font-size: 10px;
      color: #4a3b30;
      line-height: 1.5;
    }
    .comm-legend { display: flex; gap: 14px; margin: 8px 0 6px; font-size: 8.5px; color: #6b5242; }
    .comm-legend span { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
    .dot-live { background: #4d8a52; }
    .dot-partial { background: #d9a23a; }
    .dot-rec { background: #9e8a7a; }
    table.comm-table { width: 100%; border-collapse: collapse; font-size: 8.3px; }
    table.comm-table th {
      background: #5c4533; color: #fff; text-align: left;
      padding: 4px 6px; font-weight: 700; font-size: 8.3px;
    }
    table.comm-table td {
      border: 1px solid #e5e0d5; padding: 4px 6px;
      color: #4a3b30; line-height: 1.35; vertical-align: top;
    }
    table.comm-table tr:nth-child(even) td { background: #fffdf5; }
    .comm-area { font-weight: 700; color: #2d241e; }
    .comm-chan { font-size: 7.6px; color: #6b5242; }

    /* ── Page footer ── */
    .page-footer {
      padding: 2mm 10mm;
      border-top: 1px solid #e5e0d5;
      background: #fffdf5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #9e8a7a;
    }
    .page-footer-brand { font-weight: 700; color: #5c4533; }

    /* ── TOC ── */
    .toc-entry {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 5px 0;
      border-bottom: 1px dotted #e5e0d5;
    }
    .toc-role {
      font-size: 11px;
      font-weight: 700;
      color: #2d241e;
      min-width: 55mm;
    }
    .toc-modules {
      font-size: 9.5px;
      color: #6b5242;
      flex: 1;
    }
    .toc-section-head {
      font-size: 11px;
      font-weight: 800;
      color: #5c4533;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 10px 0 4px;
    }
  `;
}

function pageHeader(logo, roleName, group) {
  const logoImg = logo
    ? `<img src="${logo}" alt="STSN" />`
    : `<div style="width:22px;height:22px;background:#5c4533;border-radius:50%;"></div>`;
  return `
    <div class="page-header">
      <div class="page-header-logo">
        ${logoImg}
        <span class="page-header-brand">STSN CONNECT</span>
      </div>
      <div class="page-header-meta">
        ${group ? `<span class="group-badge">${group}</span>` : ""}
        ${roleName ? `<span class="role-badge">${roleName}</span>` : ""}
      </div>
    </div>
  `;
}

function pageFooter(left, right) {
  return `
    <div class="page-footer">
      <span class="page-footer-brand">${left || "STSN Connect"}</span>
      <span>System Demo Guide — Confidential</span>
      <span>${right || ""}</span>
    </div>
  `;
}

function coverPage(logo) {
  const logoImg = logo
    ? `<img src="${logo}" alt="STSN Crest" class="cover-logo" />`
    : `<div style="width:80px;height:80px;background:rgba(197,160,89,0.2);border:2px solid #c5a059;border-radius:50%;margin:0 auto 24px;"></div>`;
  return `
    <div class="doc-page cover-page">
      ${logoImg}
      <div class="cover-school">St. Theresa's School Network</div>
      <div class="cover-title">STSN Connect</div>
      <div class="cover-subtitle">Integrated School Management System</div>
      <div class="cover-tag">System Demo Guide</div>
      <div class="cover-divider"></div>
      <div class="cover-stats">
        <div class="cover-stat">
          <span class="cover-stat-num">13</span>
          <span class="cover-stat-label">User Roles</span>
        </div>
        <div class="cover-stat">
          <span class="cover-stat-num">25+</span>
          <span class="cover-stat-label">Modules</span>
        </div>
        <div class="cover-stat">
          <span class="cover-stat-num">60+</span>
          <span class="cover-stat-label">Pages</span>
        </div>
        <div class="cover-stat">
          <span class="cover-stat-num">2</span>
          <span class="cover-stat-label">Academic Units</span>
        </div>
      </div>
      <div class="cover-footer">
        STSN Connect &nbsp;•&nbsp; Demo Guide &nbsp;•&nbsp; June 2026 &nbsp;•&nbsp; Confidential
      </div>
    </div>
  `;
}

function overviewPage(logo) {
  const roles = [
    ["Super Administrator", "Full system access — all 29 modules"],
    ["School Admin", "Operational oversight — HR and registrar"],
    ["Principal / Director", "Academic oversight — grading and faculty"],
    ["Registrar", "Admissions, enrollment, and student records"],
    ["Accounting Staff", "Finance, ledger, AR/AP, and billing"],
    ["Cashier", "Payment collection and receipts"],
    ["Teacher / Faculty", "Grade encoding and class management"],
    ["Student", "Self-service portal — grades and fees"],
    ["HR Manager", "Workforce management and attendance"],
    ["Guidance Counselor", "Student behavioral records and counseling"],
    ["School Nurse", "Clinic visits and health profiles"],
    ["Payroll Officer", "Payroll computation and payslips"],
    ["Parent / Guardian", "View child's academic and financial records"],
  ];

  const modules = [
    "Dashboard", "Action Center", "Enrollment / Admission", "Student Directory",
    "Class Sectioning", "Class Scheduling", "Faculty Management", "Curriculum",
    "Grades Directory", "Grade Encoding", "Accounting Dashboard", "Student Ledger",
    "Discounts", "Billing & Assessment", "Financial Holds", "Chart of Accounts",
    "Cost Centers", "Suppliers", "Items/Products", "Journal Entries",
    "AR (Sales Invoices)", "AP (Purchase Invoices)", "Financial Statements",
    "Cashiering", "Teacher Board", "Online Learning (LMS)", "Student Portal (6 tabs)",
    "HR Management (8 functions)", "Payroll Management", "Guidance Office",
    "Clinic Module", "Consultation", "User Access & Authority", "Core Setup",
    "Parent Portal", "Registrar Reports", "Guidance Reports", "Clinic Reports",
    "Admin Reports", "Books Setup",
  ];

  return `
    <div class="doc-page">
      ${pageHeader(logo, "", "")}
      <div class="page-content">
        <div class="overview-hero">
          <h2>STSN Connect — System Overview</h2>
          <p>
            STSN Connect is a comprehensive, web-based school management system designed for
            St. Theresa's School Network. It integrates every aspect of school operations —
            from student admissions and grade encoding to payroll processing and parent communication —
            into a single, unified platform. The system supports both Basic Education (K–12) and
            College academic structures with a role-based, permission-driven architecture.
          </p>
        </div>

        <div class="overview-grid">
          <div class="overview-stat-card">
            <span class="overview-stat-num">13</span>
            <span class="overview-stat-label">User Roles</span>
          </div>
          <div class="overview-stat-card">
            <span class="overview-stat-num">25+</span>
            <span class="overview-stat-label">Feature Modules</span>
          </div>
          <div class="overview-stat-card">
            <span class="overview-stat-num">40+</span>
            <span class="overview-stat-label">Pages / Tabs</span>
          </div>
        </div>

        <div style="margin-bottom:8px;">
          <div class="overview-section-title">User Roles</div>
          <div class="overview-roles-grid">
            ${roles.map(([name, desc]) => `
              <div class="overview-role-card">
                <div class="overview-role-name">${name}</div>
                <div class="overview-role-desc">${desc}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div style="margin-bottom:6px;">
          <div class="overview-section-title">Technology Stack</div>
          <div class="tech-stack">
            ${["React 19", "TypeScript 5", "Vite 6", "Tailwind CSS 4", "Supabase (PostgreSQL)", "Zustand", "React Router 7", "Lucide Icons", "Motion"].map(t => `<span class="tech-tag">${t}</span>`).join("")}
          </div>
        </div>

        <div>
          <div class="overview-section-title">All Modules at a Glance</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;">
            ${modules.map(m => `<span class="module-pill">${m}</span>`).join("")}
          </div>
        </div>
      </div>
      ${pageFooter("System Overview", "Page 2")}
    </div>
  `;
}

function roleHeaderPage(role, logo) {
  const pillLabels = {
    DASHBOARD: "Dashboard",
    ACTION_CENTER: "Action Center",
    REGISTRAR: "Enrollment",
    STUDENT_DIRECTORY: "Student Directory",
    CLASS_SECTIONING: "Class Sectioning",
    SCHEDULING: "Class Scheduling",
    FACULTY_ADMIN: "Faculty Management",
    CURRICULUM: "Curriculum",
    GRADING: "Grades Directory",
    GRADE_ENCODING: "Grade Encoding",
    ACCOUNTING: "Student Accounts",
    ACCOUNTING_DASHBOARD: "Accounting Dashboard",
    BOOKS_SETUP: "Books Setup",
    CASHIER: "Cashiering",
    FACULTY_PORTAL: "Teacher Board",
    STUDENT_PORTAL: "Student Portal",
    ONLINE_LEARNING: "Online Learning",
    HR_MANAGEMENT: "HR Management",
    PAYROLL_MANAGEMENT: "Payroll",
    PAYROLL_DASHBOARD: "Payroll Dashboard",
    NURSE_CLINIC: "Clinic",
    CONSULTATION: "Consultation",
    GUIDANCE: "Guidance Office",
    GUIDANCE_REPORTS: "Guidance Reports",
    CLINIC_REPORTS: "Clinic Reports",
    ACCOUNTS_SECURITY: "User Access & Authority",
    ADMIN_REPORTS: "Admin Reports",
    REGISTRAR_REPORTS: "Registrar Reports",
    CORE_SETUP: "Core Setup",
    GUARDIAN_PORTAL: "Parent Portal",
  };

  return `
    <div class="doc-page role-header-page">
      ${pageHeader(logo, role.name.toUpperCase(), "Role Guide")}
      <div class="role-header-banner">
        <div class="role-header-pre">User Role</div>
        <div class="role-header-title">${role.name}</div>
        <div class="role-header-tagline">${role.tagline}</div>
      </div>
      <div class="role-responsibilities">
        <h3>Key Responsibilities</h3>
        <div class="role-resp-grid">
          ${role.responsibilities.map(r => `<div class="role-resp-item">${r}</div>`).join("")}
        </div>
      </div>
      <div class="role-modules-bar">
        <div class="role-modules-title">Accessible Modules</div>
        <div class="role-module-pills">
          ${role.modules.map(m => `<span class="module-pill">${pillLabels[m] || m}</span>`).join("")}
        </div>
      </div>
      ${pageFooter(role.name, "")}
    </div>
  `;
}

function modulePage(moduleData, roleName, logo, pageNum) {
  const { name, group, purpose, features, workflow, tabs, forms, modals, reports } = moduleData;

  const hasForms = forms && forms.length > 0;
  const hasModals = modals && modals.length > 0;
  const hasReports = reports && reports.length > 0;

  const tabsHtml = tabs && tabs.length > 0
    ? `<div class="tabs-row">${tabs.map((t, i) => `<span class="tab-chip${i === 0 ? " active" : ""}">${t.name}</span>`).join("")}</div>`
    : "";

  const screenshotLabel = name;
  const screenshotDesc = tabs && tabs.length > 0
    ? `Showing: ${tabs.map(t => t.name).join(" · ")}`
    : `${group} — ${roleName}`;

  return `
    <div class="doc-page">
      ${pageHeader(logo, roleName, group)}
      <div class="page-content">
        <div class="module-page-group">${group}</div>
        <div class="module-page-title">${name}</div>
        ${tabsHtml}
        <div class="module-purpose">${purpose}</div>

        <div class="screenshot-box">
          <div class="screenshot-box-icon">🖥</div>
          <div class="screenshot-box-label">Screenshot: ${screenshotLabel}</div>
          <div class="screenshot-box-desc">${screenshotDesc}</div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-title"><span class="dot"></span> Key Features</div>
            <ul class="info-list">
              ${features.map(f => `<li>${f}</li>`).join("")}
            </ul>
          </div>
          <div class="info-card">
            <div class="info-card-title"><span class="dot"></span> Workflow</div>
            <ol class="info-list numbered">
              ${workflow.map(w => `<li>${w}</li>`).join("")}
            </ol>
          </div>
          <div class="info-card">
            <div class="info-card-title"><span class="dot"></span> ${tabs && tabs.length > 0 ? "Tabs / Views" : "Components"}</div>
            ${tabs && tabs.length > 0
              ? `<ul class="info-list">${tabs.map(t => `<li><strong>${t.name}</strong> — ${t.desc}</li>`).join("")}</ul>`
              : `<ul class="info-list">
                  <li>Search &amp; Filter bar</li>
                  <li>Data Table with sortable columns</li>
                  <li>Action buttons (Add, Edit, Export)</li>
                  <li>Status badge indicators</li>
                </ul>`
            }
          </div>
        </div>

        ${(() => {
          const d = demoContent(moduleData);
          const tier = (label, cls, items) => (items && items.length) ? `
            <div class="auto-tier ${cls}">
              <div class="auto-tier-label">${label}</div>
              <ul class="auto-list">${items.map(i => `<li>${i}</li>`).join("")}</ul>
            </div>` : "";
          const auto = d.automation ? `
            <div class="automation-note">
              <div class="automation-title">Automation &amp; Notifications</div>
              <div class="automation-tiers">
                ${tier("Currently implemented", "tier-live", d.automation.implemented)}
                ${tier("Partial / mock-only", "tier-partial", d.automation.partial)}
                ${tier("Recommended next", "tier-rec", d.automation.recommended)}
              </div>
            </div>` : "";
          return `
          <div class="demo-section">
            <div class="section-title">Demo Highlights</div>
            <div class="demo-grid">
              <div class="demo-card">
                <div class="demo-card-title">What to Say &amp; Show</div>
                <ul class="demo-list">${d.say.map(s => `<li>${s}</li>`).join("")}</ul>
              </div>
              <div class="demo-card">
                <div class="demo-card-title">Recommended Demo Flow</div>
                <ol class="demo-list demo-numbered">${d.flow.map(s => `<li>${s}</li>`).join("")}</ol>
              </div>
            </div>
            <div class="value-card">
              <span class="value-label">Operational value:</span> ${d.value}
              <div class="value-benefits"><span class="value-label">Who benefits:</span> ${d.beneficiaries}</div>
            </div>
            ${auto}
          </div>`;
        })()}

        ${hasReports ? `
          <div class="reports-section">
            <div class="section-title">Reports</div>
            ${reports.map(r => `
              <div class="report-card">
                <div class="report-card-name">${r.name}</div>
                <div class="report-card-desc">${r.desc}</div>
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>
      ${pageFooter(roleName + " — " + name, `Page ${pageNum}`)}
    </div>
  `;
}

// ─── Role→Module mapping for the PDF ─────────────────────────────────────────

const ROLE_MODULE_SEQUENCE = {
  SUPER_ADMIN: [
    "DASHBOARD", "ACTION_CENTER",
    "REGISTRAR", "STUDENT_DIRECTORY", "CLASS_SECTIONING", "SCHEDULING",
    "FACULTY_ADMIN", "CURRICULUM", "GRADING", "REGISTRAR_REPORTS",
    "ACCOUNTING_DASHBOARD", "ACCOUNTING", "ACCOUNTING_SETUP", "JOURNAL_ENTRIES",
    "AR_MODULE", "AP_MODULE", "FINANCIAL_REPORTS",
    "CASHIER",
    "FACULTY_PORTAL", "GRADE_ENCODING", "ONLINE_LEARNING",
    "STUDENT_PORTAL",
    "HR_MANAGEMENT",
    "PAYROLL_MANAGEMENT",
    "GUIDANCE", "GUIDANCE_REPORTS",
    "NURSE_CLINIC", "CONSULTATION", "CLINIC_REPORTS",
    "ACCOUNTS_SECURITY", "CORE_SETUP",
  ],
  ADMIN: [
    "DASHBOARD", "ACTION_CENTER",
    "STUDENT_DIRECTORY",
    "HR_MANAGEMENT",
    "REGISTRAR_REPORTS", "ACCOUNTS_SECURITY",
  ],
  PRINCIPAL: [
    "ACTION_CENTER",
    "STUDENT_DIRECTORY",
    "GRADING", "CURRICULUM", "FACULTY_ADMIN", "SCHEDULING",
    "REGISTRAR_REPORTS",
  ],
  REGISTRAR: [
    "ACTION_CENTER",
    "REGISTRAR", "STUDENT_DIRECTORY",
    "CLASS_SECTIONING", "SCHEDULING", "FACULTY_ADMIN", "CURRICULUM",
    "GRADING", "BOOKS_SETUP", "REGISTRAR_REPORTS",
  ],
  ACCOUNTING: [
    "ACTION_CENTER",
    "ACCOUNTING_DASHBOARD", "ACCOUNTING", "ACCOUNTING_SETUP",
    "JOURNAL_ENTRIES", "AR_MODULE", "AP_MODULE", "FINANCIAL_REPORTS",
    "BOOKS_SETUP",
  ],
  CASHIER: [
    "CASHIER",
  ],
  TEACHER: [
    "FACULTY_PORTAL", "GRADE_ENCODING", "CURRICULUM", "ONLINE_LEARNING",
  ],
  STUDENT: [
    "STUDENT_PORTAL", "ONLINE_LEARNING", "CONSULTATION",
  ],
  HR: [
    "ACTION_CENTER", "HR_MANAGEMENT",
  ],
  GUIDANCE: [
    "GUIDANCE", "GUIDANCE_REPORTS",
  ],
  NURSE: [
    "NURSE_CLINIC", "CONSULTATION", "CLINIC_REPORTS",
  ],
  PAYROLL: [
    "ACTION_CENTER", "PAYROLL_MANAGEMENT",
  ],
  GUARDIAN: [
    "GUARDIAN_PORTAL",
  ],
};

// ─── Main Build ───────────────────────────────────────────────────────────────

function communicationAutomationPage(logo, pageNum) {
  // Accurate status per the codebase inspection:
  //  live    = in-app notification actually wired in src/services/store.ts
  //  partial = simulated/mock confirmation only (no message sent)
  //  rec     = recommended next implementation (connect a provider)
  const rows = [
    ["Enrollment / Admission",
      "Application submitted, approved, returned for missing documents, student officially enrolled, COR ready",
      "Parent/guardian, student, registrar",
      "Email (instructions, COR) · SMS (reminders) · In-app (staff)",
      "rec", "In-app assessment approval is live; parent email/SMS recommended"],
    ["Accounting / Cashiering",
      "Assessment generated, payment posted, receipt issued, balance due/approaching, account hold or cleared",
      "Parent/guardian, student, accounting & cashier staff",
      "Email (SOA, receipt) · SMS (reminders) · In-app (approvals, holds)",
      "live", "In-app assessment & void approvals live; parent email/SMS recommended"],
    ["Class Sectioning / Scheduling",
      "Student assigned to a section, schedule finalized or changed, capacity issues",
      "Registrar, adviser/teacher, student/parent (if enabled)",
      "Email (schedule) · In-app (staff changes)",
      "rec", "Recommended"],
    ["Attendance",
      "Student absent or late, attendance submitted, repeated absences need follow-up",
      "Parent/guardian, adviser, guidance (on escalation)",
      "SMS (same-day) · Email (summaries) · In-app (advisers)",
      "partial", "Attendance submit shows a simulated 'SMS sent' message — no real send yet"],
    ["Grades",
      "Grades submitted for approval, approved, returned for revision, published to portal",
      "Teacher, principal, registrar, parent/student (if publishing)",
      "In-app (approval workflow) · Email (published grades)",
      "live", "In-app grade-period submit/approve/return live; portal email recommended"],
    ["Clinic",
      "Student visit, medical incident recorded, sent home or referred, treatment issued",
      "Parent/guardian, nurse, adviser (if needed)",
      "SMS (urgent) · Email (visit summary) · In-app (staff)",
      "rec", "Recommended"],
    ["Guidance / Consultation",
      "Consultation requested, appointment scheduled, parent conference, counseling follow-up",
      "Parent/guardian, counselor, adviser, student",
      "Email (details) · SMS (reminders) · In-app (task queue)",
      "rec", "Recommended"],
    ["HR / Payroll",
      "Employee profile created, leave submitted/approved, payroll processed, payslip available, approval pending",
      "Employee, HR, payroll/accounting approver",
      "Email (payslip, notices) · In-app (approvals) · SMS (urgent only)",
      "live", "In-app leave approve/reject live; payslip email recommended"],
    ["User Access / Security",
      "Account created, role changed, account activated/blocked, delegation assigned, approval authority changed",
      "Affected user, administrator, approver",
      "Email (access notice) · In-app (admin/security workflow)",
      "rec", "Audit trail captures changes; user email recommended"],
  ];

  const badge = (s) => s === "live"
    ? `<span class="legend-dot dot-live"></span>`
    : s === "partial"
      ? `<span class="legend-dot dot-partial"></span>`
      : `<span class="legend-dot dot-rec"></span>`;

  return `
    <div class="doc-page">
      ${pageHeader(logo, "", "System-wide")}
      <div class="page-content">
        <div class="comm-hero">
          <h2>Communication Automation: SMS, Email &amp; In-App Notifications</h2>
          <div class="comm-statement">
            STSN Connect is prepared for communication automation. The current system includes
            in-app workflow notifications, while SMS and Email delivery can be connected to
            provider services for production use. Today the platform automatically raises in-app
            alerts to the right staff at key approval points — assessment approvals, void
            requests, grade submission and approval, and leave decisions — and broadcasts
            school-wide announcements. SMS and Email are not yet sent automatically; the trigger
            map below shows where they would plug in.
          </div>
          <div class="comm-legend">
            <span><span class="legend-dot dot-live"></span> Currently implemented (in-app)</span>
            <span><span class="legend-dot dot-partial"></span> Partial / mock-only</span>
            <span><span class="legend-dot dot-rec"></span> Recommended next</span>
          </div>
        </div>
        <table class="comm-table">
          <thead>
            <tr>
              <th style="width:18%">Area</th>
              <th style="width:30%">Trigger — when a message should fire</th>
              <th style="width:20%">Recipients</th>
              <th style="width:22%">Channel</th>
              <th style="width:10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(([area, trig, rec, chan, status, note]) => `
              <tr>
                <td class="comm-area">${area}</td>
                <td>${trig}</td>
                <td>${rec}</td>
                <td class="comm-chan">${chan}</td>
                <td>${badge(status)} ${note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ${pageFooter("Communication Automation", `Page ${pageNum}`)}
    </div>
  `;
}

function buildHTML(logo) {
  const pages = [];
  const seenModules = new Set();
  let pageNum = 1;

  pages.push(coverPage(logo));
  pageNum++;
  pages.push(overviewPage(logo));
  pageNum++;

  for (const role of ROLES) {
    pages.push(roleHeaderPage(role, logo));
    pageNum++;

    const moduleKeys = ROLE_MODULE_SEQUENCE[role.id] || [];
    for (const key of moduleKeys) {
      const mod = MODULE_PAGES[key];
      if (!mod) continue;
      pages.push(modulePage(mod, role.name, logo, pageNum));
      seenModules.add(key);
      pageNum++;
    }
  }

  // Dedicated Communication Automation page, appended last so existing module
  // page positions stay stable for the screenshot-injection pipeline.
  pages.push(communicationAutomationPage(logo, pageNum));
  pageNum++;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=210mm" />
  <title>STSN Connect — Demo Guide</title>
  <style>${css()}</style>
</head>
<body>
  ${pages.join("\n")}
</body>
</html>`;
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function generate() {
  console.log("📄 STSN Connect — Demo PDF Generator");
  console.log("──────────────────────────────────────");

  // Use file:// URL so Puppeteer loads the logo from disk once (not embedded per-page)
  const logo = getLogoFileURL();
  if (logo) {
    console.log("✅ Logo path resolved: stsn-crest.png");
  } else {
    console.log("⚠️  Logo not found — continuing without logo");
  }

  console.log("📝 Building HTML content...");
  const html = buildHTML(logo);

  const htmlPath = path.join(__dirname, "demo-output.html");
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log(`✅ HTML saved: ${htmlPath}`);

  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--allow-file-access-from-files"],
  });

  const page = await browser.newPage();
  // Navigate via file:// so the browser loads local assets without re-embedding them
  const fileURL = `file:///${htmlPath.replace(/\\/g, "/")}`;
  await page.goto(fileURL, { waitUntil: "networkidle0" });

  console.log("🖨  Generating PDF...");
  await page.pdf({
    path: OUTPUT_PATH,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  const stats = fs.statSync(OUTPUT_PATH);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ PDF generated successfully!`);
  console.log(`   📁 Output: ${OUTPUT_PATH}`);
  console.log(`   📦 Size: ${sizeMB} MB`);
  console.log(`\nDone! Open STSN_Connect_Demo.pdf in the project root.`);
}

generate().catch((err) => {
  console.error("❌ Error generating PDF:", err.message);
  process.exit(1);
});
