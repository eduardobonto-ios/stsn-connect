/**
 * STSN Connect — PowerPoint Presentation Generator
 * Produces STSN_Connect_Demo.pptx in the project root.
 * Layout: 16:9 widescreen (13.33" × 7.5")
 */

const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const LOGO_PATH = path.join(__dirname, "../../public/stsn-crest.png");
const OUTPUT_PATH = path.join(__dirname, "../../STSN_Connect_Demo.pptx");

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  brownDeep:  "2e1c10",
  brownDark:  "4a3728",
  brown:      "5c4533",
  brownLight: "634935",
  gold:       "c5a059",
  goldLight:  "d6cfb5",
  cream:      "fffdf5",
  beige:      "e5e0d5",
  text:       "2d241e",
  textMid:    "6b5242",
  textLight:  "9e8a7a",
  white:      "FFFFFF",
};

const FONT = "Segoe UI";

// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: "SUPER_ADMIN",
    name: "Super Administrator",
    tagline: "Full system access — all 29 modules and all academic contexts",
    responsibilities: [
      "Configure all system settings and academic parameters",
      "Manage user accounts, roles, and permissions",
      "Access every module across all academic units",
      "Review audit logs and system-wide reports",
      "Override approvals at any level",
      "Manage delegation of approval authority",
    ],
  },
  {
    id: "ADMIN",
    name: "School Administrator",
    tagline: "Operational oversight — HR, registrar, and admin reporting",
    responsibilities: [
      "Monitor overall school operations",
      "Oversee HR records, staffing levels, and attendance",
      "Approve HR-related pending actions",
      "View student directory and enrollment summaries",
      "Generate admin and registrar reports",
    ],
  },
  {
    id: "PRINCIPAL",
    name: "School Principal / Director",
    tagline: "Academic oversight — grading, faculty, curriculum, scheduling",
    responsibilities: [
      "Review and approve academic workflow actions",
      "Monitor student grade records and standings",
      "Oversee faculty assignments and workload",
      "Manage curriculum and syllabus pathways",
      "Approve class schedules and section configurations",
      "Generate registrar reports for academic compliance",
    ],
  },
  {
    id: "REGISTRAR",
    name: "Registrar",
    tagline: "Admissions & records — enrollment, sectioning, and student management",
    responsibilities: [
      "Process student enrollments and admissions each term",
      "Manage student directory and enrollment status",
      "Create and configure class sections with advisers",
      "Build and maintain class schedules",
      "Manage faculty records and subject assignments",
      "Generate official reports including COR and masterlist",
    ],
  },
  {
    id: "ACCOUNTING",
    name: "Accounting Staff",
    tagline: "Finance & ledger — student billing, GL, AR/AP, and reporting",
    responsibilities: [
      "Manage student financial ledgers and billing",
      "Process and approve discount applications",
      "Apply and release financial holds",
      "Maintain the general ledger with journal entries",
      "Track accounts receivable and payable",
      "Generate financial statements and aging reports",
    ],
  },
  {
    id: "CASHIER",
    name: "Cashier",
    tagline: "Collections — payment processing, receipts, and cashiering reports",
    responsibilities: [
      "Process student payments for approved assessments",
      "Generate and print official receipts",
      "Manage daily collection queue and settlement",
      "View and reprint collection history",
      "Generate cashiering reports for reconciliation",
    ],
  },
  {
    id: "TEACHER",
    name: "Teacher / Faculty",
    tagline: "Instruction — grade encoding, class management, online learning",
    responsibilities: [
      "Enter and submit student grades for assigned classes",
      "View class rosters and student schedules",
      "Manage grade items, weights, and grading periods",
      "Reference curriculum and syllabus for planning",
      "Access and manage online learning modules",
    ],
  },
  {
    id: "STUDENT",
    name: "Student",
    tagline: "Self-service portal — grades, fees, profile, enrollment, e-learning",
    responsibilities: [
      "View personal academic records and report card",
      "Monitor financial ledger and outstanding balances",
      "Update personal profile and health information",
      "Access online learning modules",
      "File self-service enrollment for the next term",
      "Book consultation appointments",
    ],
  },
  {
    id: "HR",
    name: "HR Manager",
    tagline: "Human resources — workforce, attendance, leave, recruitment",
    responsibilities: [
      "Maintain complete employee records",
      "Track daily attendance and time records",
      "Configure shifts and work schedules",
      "Process leave applications and approvals",
      "Manage recruitment pipelines and onboarding",
      "Approve HR-related pending actions",
    ],
  },
  {
    id: "GUIDANCE",
    name: "Guidance Counselor",
    tagline: "Student welfare — anecdotal records, counseling, and reports",
    responsibilities: [
      "Log student behavioral incident records",
      "Record counseling sessions with notes",
      "Track incident reports and disciplinary cases",
      "Schedule and document student conferences",
      "Generate guidance reports for administration",
    ],
  },
  {
    id: "NURSE",
    name: "School Nurse",
    tagline: "Student health — clinic visits, health profiles, medical reports",
    responsibilities: [
      "Record student clinic visits and complaints",
      "Maintain individual student health profiles",
      "Log medical incidents and dispositions",
      "Manage consultation appointment scheduling",
      "Generate clinic visit and health summary reports",
    ],
  },
  {
    id: "PAYROLL",
    name: "Payroll Officer",
    tagline: "Payroll & compensation — runs, payslips, taxes, benefits",
    responsibilities: [
      "Process payroll computation for each period",
      "Generate and distribute employee payslips",
      "Manage salary payout batches",
      "Configure and compute withholding tax",
      "Administer employee benefits and contributions",
      "Approve payroll items in the Action Center",
    ],
  },
  {
    id: "GUARDIAN",
    name: "Parent / Guardian",
    tagline: "Family portal — view child's grades, fees, attendance, notices",
    responsibilities: [
      "Monitor child's academic performance",
      "View tuition fee balances and payment history",
      "Check attendance records and absences",
      "Receive school announcements and notices",
    ],
  },
];

// ─── Module Definitions ───────────────────────────────────────────────────────
const MODULE_PAGES = {
  DASHBOARD: {
    name: "Dashboard",
    group: "Command Center",
    purpose: "System-wide command center showing real-time KPIs, pending approval counts, recent activity, and quick-navigation shortcuts — tailored to each user's role and permissions.",
    features: ["Real-time KPI cards (enrolled students, pending assessments, headcount)", "Quick-navigation tiles to all permitted modules", "Pending approval badge counters per module", "Recent system activity feed with timestamps", "Role-specific welcome greeting and contextual alerts", "Academic year and term context indicator"],
    workflow: ["User logs in and lands on the Dashboard", "Dashboard resolves role and renders permitted KPI cards", "User reviews key metrics and pending action counts", "User clicks a quick-link tile to navigate to a module", "Pending badges update in real-time as actions are completed"],
    tabs: [],
    forms: [],
    modals: [],
    reports: [],
  },
  ACTION_CENTER: {
    name: "Action Center",
    group: "Workflow Management",
    purpose: "Unified approval queue consolidating all pending workflow items across every module — enrollments, discounts, leave requests, assessment approvals, and payroll runs — in one place.",
    features: ["Unified queue for all pending approvals across modules", "Filter by module type, date range, priority, and submitter", "Bulk approve or reject multiple items simultaneously", "Contextual detail panel with full request information", "Add approval notes or rejection reasons", "Real-time badge count showing pending items", "Escalation indicators for SLA-breached items", "Complete approval trail with actor and timestamp"],
    workflow: ["Navigate to Action Center from the sidebar", "System displays all items the user is authorized to approve", "Apply filters to narrow down by type or date", "Click a pending item to view the full detail panel", "Add a note, then approve or reject", "System sends item to next approval level or marks complete", "Action is logged in the audit trail"],
    tabs: [{ name: "All Pending", desc: "Consolidated queue" }, { name: "Enrollments", desc: "Awaiting registrar" }, { name: "Assessments", desc: "Awaiting accounting" }, { name: "Discounts", desc: "Awaiting approval" }, { name: "Leave Requests", desc: "Awaiting supervisor" }, { name: "Payroll", desc: "Awaiting authorization" }],
    forms: [],
    modals: [{ name: "Approval Detail Panel", desc: "Full request view with approve/reject controls and notes field" }],
    reports: [],
  },
  REGISTRAR: {
    name: "Enrollment (Admission)",
    group: "Admissions",
    purpose: "Primary interface for processing student admissions each term — search students, process enrollments via multi-step wizard, review online applications, manage enrollment status, and generate the Certificate of Registration (COR).",
    features: ["Student search filtered by grade level, section, and status", "KPI cards: enrolled, pending/for-assessment, online app count", "Multi-step Enrollment Wizard for complete student intake", "Online application review queue for self-submitted enrollments", "Bulk CSV import from official registrar template", "COR (Certificate of Registration) preview and print", "Status filtering: Enrolled, Pending, For Assessment"],
    workflow: ["Navigate to Enrollment module", "Review pending online applications from the Online Queue", "Click 'New Enrollment' to open the Enrollment Wizard", "Step 1 — Personal Information: name, birthdate, LRN", "Step 2 — Guardian/Parent: parent name, relationship", "Step 3 — Academic: grade level, section, payment terms", "Step 4 — Assessment: auto-computed tuition & misc fees", "Step 5 — Documents: attach enrollment requirements", "Submit; accounting approves; status → 'Enrolled'", "Generate and print the COR for the student"],
    tabs: [{ name: "Admissions & Directory", desc: "All students with enrollment status and KPI cards" }, { name: "Online Queue", desc: "Self-submitted applications from the Student Portal" }, { name: "Bulk Import", desc: "CSV masterlist upload with validation preview" }],
    forms: [{ name: "Enrollment Wizard — Step 1: Personal Information", fields: ["First Name", "Middle Name", "Last Name", "Birthdate", "Gender", "LRN", "Contact Number", "Email", "Home Address"] }, { name: "Enrollment Wizard — Step 2: Guardian / Parent", fields: ["Parent/Guardian Name", "Relationship", "Contact Number", "Email", "Occupation"] }, { name: "Enrollment Wizard — Step 3: Academic", fields: ["Academic Unit", "Grade Level", "Program/Track", "Section", "Payment Terms", "School Year"] }, { name: "Enrollment Wizard — Step 4: Assessment", fields: ["Tuition Fee", "Miscellaneous Fees", "Book Package", "Payment Schedule", "Total Amount Due"] }, { name: "Enrollment Wizard — Step 5: Documents", fields: ["Report Card / Form 138", "PSA Birth Certificate", "Good Moral Certificate", "Medical Certificate", "2x2 ID Photo"] }],
    modals: [{ name: "COR Preview", desc: "Full Certificate of Registration with school header, student details, enrolled subjects, fee summary, and Print/Download controls" }, { name: "Import Preview", desc: "Tabular preview of CSV rows with validation status before confirming bulk import" }],
    reports: [],
  },
  STUDENT_DIRECTORY: {
    name: "Student Directory",
    group: "Records",
    purpose: "Centralized lookup for all student records across the school. Staff can search, filter, and navigate to individual student profiles from this single view, regardless of enrollment status.",
    features: ["Global search by name, LRN, or student ID", "Filter by grade level, section, enrollment status", "Quick-action row buttons to open the full student profile", "Column sorting and paginated data table", "Export student list to CSV or Excel", "Role-based column visibility"],
    workflow: ["Navigate to Student Directory", "Use search or filter to locate a student", "Click a student row to open the Student Profile panel", "View academic history, enrollment records, financial summary", "Navigate to sub-sections (grades, ledger, documents)"],
    tabs: [],
    forms: [],
    modals: [{ name: "Student Profile Panel", desc: "Slide-over showing the student's complete profile: academic records, financial ledger, and documents" }],
    reports: [],
  },
  CLASS_SECTIONING: {
    name: "Class Sectioning",
    group: "Academic Administration",
    purpose: "Create, organize, and manage class sections for each academic term. Sections are assigned advisers and populated with enrolled students.",
    features: ["Create sections per grade level and academic year", "Assign section advisers from the faculty roster", "Add and manage student roster per section", "LRN validation for student entries", "Section capacity indicators and enrollment counts", "Bulk student assignment from enrolled student list"],
    workflow: ["Navigate to Class Sectioning", "Create a new section: grade level, name, academic year", "Assign a faculty adviser to the section", "Add enrolled students to the section roster", "Section becomes available for scheduling and grading"],
    tabs: [{ name: "Sections", desc: "All sections with adviser and student count" }, { name: "Student Roster", desc: "Per-section student list with LRN and enrollment status" }],
    forms: [{ name: "New Section Form", fields: ["Section Name", "Grade Level", "Academic Year", "Adviser (Faculty)", "Capacity"] }],
    modals: [{ name: "Add Students to Section", desc: "Select enrolled students and bulk-add to the section roster" }],
    reports: [],
  },
  SCHEDULING: {
    name: "Class Scheduling",
    group: "Academic Administration",
    purpose: "Build class schedules by assigning subjects to sections, specifying meeting times, and allocating rooms — with built-in conflict detection.",
    features: ["Subject-to-section schedule assignment", "Time slot and room allocation", "Conflict detection for overlapping schedules", "Teacher-subject-schedule linking", "Schedule grid view by day and time slot", "Print-ready schedule output per section or teacher"],
    workflow: ["Open Class Scheduling for the academic year", "Select a section to configure its schedule", "Add subjects: teacher, day, time, room", "System flags conflicts if any", "Publish the schedule for the term"],
    tabs: [{ name: "By Section", desc: "Schedule grid organized by class section" }, { name: "By Teacher", desc: "Schedule filtered by faculty member" }],
    forms: [{ name: "Schedule Entry Form", fields: ["Section", "Subject", "Teacher", "Day(s)", "Time Start", "Time End", "Room", "School Year"] }],
    modals: [{ name: "Conflict Alert", desc: "Detected scheduling conflicts with affected sections, teachers, or rooms and suggested resolution" }],
    reports: [],
  },
  FACULTY_ADMIN: {
    name: "Faculty Management",
    group: "Academic Administration",
    purpose: "Manage the school's teaching staff — faculty profiles, subject assignments, and teaching workload tracking.",
    features: ["Faculty master list with employment and contact details", "Subject assignment per faculty member", "Teaching load computation and display", "Faculty profile with academic background", "Filter by department, employment status, and subject"],
    workflow: ["Navigate to Faculty Management", "View the faculty list and search for a teacher", "Open the faculty profile to review assignments", "Assign subjects to the faculty member for the term", "Review the teaching load summary"],
    tabs: [{ name: "Faculty List", desc: "All teaching staff with search and quick profile access" }, { name: "Subject Assignments", desc: "Faculty-to-subject mapping for the current term" }, { name: "Workload Summary", desc: "Teaching load units per faculty with overload indicators" }],
    forms: [{ name: "Faculty Profile Form", fields: ["Employee Name", "Employee ID", "Department", "Employment Status", "Specialization", "Educational Attainment", "Contact Info"] }],
    modals: [],
    reports: [],
  },
  CURRICULUM: {
    name: "Curriculum / Syllabus Pathways",
    group: "Academic Administration",
    purpose: "Define academic subject pathways for each grade level, program, and academic unit. Serves as the master reference for offered subjects and prerequisite chains.",
    features: ["Subject catalog with code, title, and unit credits", "Grade-level-to-subject mapping", "Program track assignment (Science, Arts, ABM, HUMSS, etc.)", "Prerequisite chain configuration", "Curriculum view by academic unit (Basic Ed vs. College)", "Export curriculum matrix to CSV"],
    workflow: ["Open Curriculum module", "Select the academic unit and program track", "Add subjects to the appropriate grade/year level", "Set prerequisites where applicable", "Publish as reference for enrollment and scheduling"],
    tabs: [{ name: "Subject Catalog", desc: "Master list of all subjects across all programs" }, { name: "Curriculum Matrix", desc: "Subject pathway grid by grade level and program track" }],
    forms: [{ name: "Add Subject Form", fields: ["Subject Code", "Subject Title", "Units/Credits", "Grade Level", "Program Track", "Academic Unit", "Prerequisites"] }],
    modals: [],
    reports: [],
  },
  GRADING: {
    name: "Grades Directory",
    group: "Academic Records",
    purpose: "Searchable view of all student grade records across sections, subjects, and grading periods. Central reference for academic performance monitoring.",
    features: ["Grade search by student, section, subject, or period", "Filter by grade level, section, and academic year", "View grade breakdown per subject and per period", "Honor roll and academic standing indicators", "Export grade summary to CSV or Excel", "Drill-down to individual student grade sheets"],
    workflow: ["Open Grades Directory", "Filter by grade level, section, and grading period", "View the grade summary table", "Click a student row to open the detailed grade sheet", "Export grade data for reporting or archiving"],
    tabs: [{ name: "By Section", desc: "Grade listing organized by class section" }, { name: "By Student", desc: "Individual student grade record lookup" }],
    forms: [],
    modals: [{ name: "Student Grade Sheet Detail", desc: "Full grade sheet with all subjects, grading period scores, and final grade" }],
    reports: [{ name: "Grade Summary Report", desc: "Class-wide grade summary with averages per subject and student" }, { name: "Honor Roll Report", desc: "Students qualifying for honor roll based on grade thresholds" }],
  },
  REGISTRAR_REPORTS: {
    name: "Registrar Reports",
    group: "Reports",
    purpose: "Suite of official reports for enrollment, student records, and academic documentation. Preview on-screen and export as PDF or Excel.",
    features: ["Student Masterlist with enrollment status and grade level", "Enrollment Summary by program, grade level, and status", "COR (Certificate of Registration) batch generation", "Grade Summary Report by section and grading period", "Date range and academic year filter for all reports", "Export to PDF and Excel"],
    workflow: ["Navigate to Registrar Reports", "Select the report type from the catalog", "Set filter parameters (academic year, grade level, date range)", "Click 'Preview' to view the report on-screen", "Export to PDF or Excel"],
    tabs: [],
    forms: [],
    modals: [{ name: "Report Preview Modal", desc: "Full-page report preview with Print, Export PDF, and Export Excel controls" }],
    reports: [{ name: "Student Masterlist", desc: "Complete roster with LRN, grade level, section, and enrollment status" }, { name: "Enrollment Summary", desc: "Statistical breakdown of enrollees by grade level, program, and status" }, { name: "COR (Certificate of Registration)", desc: "Official COR per student with enrolled subjects and fee summary" }, { name: "Grade Summary", desc: "Academic performance summary by section and grading period" }],
  },
  ACCOUNTING_DASHBOARD: {
    name: "Accounting Dashboard",
    group: "Finance",
    purpose: "Real-time financial overview: total revenue, receivables, and billing pipeline. KPI cards, AR aging widgets, and trend charts for at-a-glance financial health monitoring.",
    features: ["Total enrolled students with assessed and collected fee totals", "AR aging summary (30/60/90/120+ day buckets)", "Revenue trend chart by month", "Top debtors watchlist with outstanding balances", "Payment method breakdown chart", "Quick-links to key accounting sub-modules"],
    workflow: ["Accounting staff logs in and sees the Dashboard", "Review KPI cards for assessments and collections", "Check the AR aging widget to identify overdue accounts", "Click a debtor row to navigate to the student's ledger", "Review the trend chart for monthly collection performance"],
    tabs: [],
    forms: [],
    modals: [],
    reports: [],
  },
  ACCOUNTING: {
    name: "Student Accounts",
    group: "Finance",
    purpose: "Core financial management for student billing and collections — individual student ledger, discount management, assessment approval, and financial hold administration.",
    features: ["Per-student debit/credit ledger with running balance", "Fee assessment breakdown per enrolled student", "Discount application and multi-level approval workflow", "Financial hold application and release controls", "Statement of Account (SOA) generation and download", "Payment history with receipt references"],
    workflow: ["Navigate to Student Accounts", "Search for a specific student", "Open the student's ledger to view transactions", "Apply discounts if the student qualifies", "Approve assessment when enrollment wizard submits", "Apply a financial hold if the student has unpaid balance"],
    tabs: [{ name: "Student Ledger", desc: "Debit/credit entries, running balance, and transaction history" }, { name: "Discounts", desc: "Discount types, application requests, and approval workflow" }, { name: "Billing & Assessment", desc: "Fee assessment per student with approval queue" }, { name: "Financial Holds", desc: "Active holds with hold type and release controls" }],
    forms: [{ name: "Discount Application Form", fields: ["Student Name", "Discount Type", "Discount Amount / %", "Applicable Fees", "Supporting Document", "Remarks"] }, { name: "Financial Hold Form", fields: ["Student Name", "Hold Type", "Hold Reason", "Amount Due", "Effective Date"] }],
    modals: [{ name: "Statement of Account Preview", desc: "Printable SOA with all fees, discounts, payments, and outstanding balance" }, { name: "Discount Approval Modal", desc: "Approve/reject a discount request with notes and approval level tracking" }],
    reports: [],
  },
  ACCOUNTING_SETUP: {
    name: "Accounting Setup",
    group: "Finance Setup",
    purpose: "All configuration tables for the financial system — chart of accounts, cost centers, supplier master, item catalog, and discount type definitions.",
    features: ["Chart of Accounts: hierarchical GL structure with type classification", "Cost Centers: department-level cost segmentation", "Supplier Management: vendor master with contact, terms, and balance", "Item/Product Management: fee items and services with pricing", "Discount Types: configurable definitions with eligibility rules"],
    workflow: ["Open Accounting Setup", "Configure the Chart of Accounts by adding GL accounts", "Create cost centers for each department", "Add suppliers/vendors with payment terms", "Define fee items for student billing", "Configure discount types for student applications"],
    tabs: [{ name: "Chart of Accounts", desc: "GL account hierarchy: Asset, Liability, Equity, Revenue, Expense" }, { name: "Cost Centers", desc: "Departmental cost allocation units" }, { name: "Supplier Management", desc: "Vendor master with contact info and payment terms" }, { name: "Item / Product Mgmt", desc: "Fee items and products used in student billing" }, { name: "Discount Types", desc: "Named discount definitions with eligibility rules" }],
    forms: [{ name: "Add GL Account", fields: ["Account Code", "Account Name", "Account Type", "Parent Account", "Cost Center", "Description"] }, { name: "Add Supplier", fields: ["Supplier Name", "Contact Person", "Email", "Phone", "Payment Terms (Days)", "Tax ID"] }, { name: "Add Fee Item", fields: ["Item Code", "Item Name", "Category", "Unit Price", "Tax Applicable", "GL Account Link"] }],
    modals: [],
    reports: [],
  },
  JOURNAL_ENTRIES: {
    name: "Journal Entries (General Ledger)",
    group: "Finance",
    purpose: "Record all financial transactions in double-entry format. Each entry must balance (debits = credits) before it can be posted to the general ledger.",
    features: ["Double-entry creation with debit/credit line items", "GL account selection from the Chart of Accounts", "Reference number and document attachment", "Batch posting of multiple entries", "Search by date, account, and reference", "Reverse entry creation for corrections"],
    workflow: ["Open Journal Entries", "Click 'New Entry'", "Enter the entry date, reference number, and description", "Add debit and credit line items from the Chart of Accounts", "Verify that total debits equal total credits", "Post the entry to the general ledger"],
    tabs: [{ name: "Journal Entries List", desc: "All posted and draft entries with date, reference, and total" }],
    forms: [{ name: "New Journal Entry", fields: ["Entry Date", "Reference Number", "Description / Memo", "Line Items: Account | Description | Debit | Credit", "Attachment"] }],
    modals: [{ name: "Journal Entry Detail", desc: "Read-only view of a posted entry with full line item breakdown" }],
    reports: [],
  },
  AR_MODULE: {
    name: "Accounts Receivable",
    group: "Finance",
    purpose: "Track all money owed to the school. Includes sales invoice management and an aging analysis by overdue buckets for collection monitoring.",
    features: ["Sales invoice creation with line items and due dates", "Customer/student AR balance tracking", "Payment matching and invoice settlement", "AR Aging by 30/60/90/120+ day buckets", "Overdue invoice alerts and collection notes"],
    workflow: ["Create a sales invoice for a customer or student billing event", "Set the due date and payment terms", "Monitor the AR aging report for overdue invoices", "Record payment when customer pays", "Generate AR aging summary for management"],
    tabs: [{ name: "Sales Invoice", desc: "AR invoices with status, due date, and outstanding balance" }, { name: "AR Aging", desc: "Receivables aging by 0–30, 31–60, 61–90, 91–120+ day buckets" }],
    forms: [{ name: "New Sales Invoice", fields: ["Invoice Number", "Invoice Date", "Due Date", "Customer / Student", "Line Items: Item | Qty | Unit Price | Total", "Notes"] }],
    modals: [{ name: "Invoice Detail", desc: "Full invoice with payment history, balance due, and payment recording controls" }],
    reports: [{ name: "AR Aging Report", desc: "Customer-by-customer aging breakdown with totals per bucket" }],
  },
  AP_MODULE: {
    name: "Accounts Payable",
    group: "Finance",
    purpose: "Manage vendor invoices and the school's outstanding payment obligations. Track what is owed to suppliers and provide aging analysis for payment prioritization.",
    features: ["Purchase invoice entry from vendor bills", "GL account coding per invoice line item", "Payment scheduling and due date tracking", "AP Aging by vendor and aging bucket", "Mark invoices as paid upon settlement"],
    workflow: ["Receive a vendor bill and open Purchase Invoices", "Enter the invoice with vendor, date, and line items", "Code each line to the appropriate GL account", "Schedule the payment based on vendor payment terms", "On payment date: mark invoice as paid", "Monitor AP aging for no overdue vendor payments"],
    tabs: [{ name: "Purchase Invoice", desc: "Vendor AP invoices with status, due date, and GL coding" }, { name: "AP Aging", desc: "Vendor-level payables aging by bucket" }],
    forms: [{ name: "New Purchase Invoice", fields: ["Invoice Number", "Vendor / Supplier", "Invoice Date", "Due Date", "Line Items: Description | GL Account | Cost Center | Amount"] }],
    modals: [{ name: "Payment Recording", desc: "Record payment to vendor, select payment method, update status to Paid" }],
    reports: [{ name: "AP Aging Report", desc: "Vendor-by-vendor aging breakdown with payment due prioritization" }],
  },
  FINANCIAL_REPORTS: {
    name: "Financial Reports & Statements",
    group: "Finance",
    purpose: "Full suite of formal accounting statements — Trial Balance, Balance Sheet, Income Statement, and Cash Flow — each with period selection and export capability.",
    features: ["Trial Balance: debit/credit totals per GL account", "Balance Sheet: Assets = Liabilities + Equity snapshot", "Income Statement: Revenue − Expenses = Net Income", "Cash Flow: Operating, Investing, and Financing activity", "Period and date range selector for all statements", "Comparative period columns (current vs. prior year)", "Export to PDF and Excel for audit submissions"],
    workflow: ["Navigate to Financial Reports", "Select the desired statement type", "Set the date range or as-of date", "Review the generated statement on-screen", "Export to PDF for management or audit submission"],
    tabs: [{ name: "Trial Balance", desc: "GL debit/credit totals verifying ledger balance" }, { name: "Balance Sheet", desc: "Assets, liabilities, and equity as of a specific date" }, { name: "Income Statement", desc: "Revenue and expenses yielding net income for a period" }, { name: "Cash Flow Report", desc: "Operating, investing, and financing cash flows" }],
    forms: [],
    modals: [{ name: "Statement Preview & Export", desc: "On-screen preview with Print, Export PDF, and Export Excel buttons" }],
    reports: [{ name: "Trial Balance", desc: "Two-column debit/credit totals for all active GL accounts" }, { name: "Balance Sheet", desc: "Standard balance sheet format with sub-totals per category" }, { name: "Income Statement", desc: "Revenue less expenses with gross profit and net income lines" }, { name: "Cash Flow Statement", desc: "Indirect method with operating, investing, and financing sections" }],
  },
  CASHIER: {
    name: "Cashiering",
    group: "Collections",
    purpose: "Point-of-collection interface for processing student payments. Cashiers receive payments for approved assessments, generate official receipts, view collection history, and produce cashiering reports for daily reconciliation.",
    features: ["Payment queue for students with approved assessments", "Payment entry with multiple payment methods", "Official receipt generation with OR number", "Partial payment recording with balance tracking", "Collection history with OR search and reprint", "Daily collection summary and cashier's report"],
    workflow: ["Student presents to the cashier window", "Search for the student in the Payment Queue", "Review the approved assessment and payment schedule", "Enter the payment amount and payment method", "System generates an Official Receipt (OR)", "Cashier prints and hands OR to the student", "At end of day, generate the Daily Collection Report"],
    tabs: [{ name: "Payment Queue", desc: "Students with approved assessments ready for payment" }, { name: "Collection History", desc: "All posted payments with OR numbers and reprint option" }, { name: "Reports", desc: "Daily collection report, bank deposit, and collection by type" }],
    forms: [{ name: "Payment Entry Form", fields: ["Student Name / ID", "Assessment Reference", "Amount to Pay", "Payment Method (Cash / Check / Online)", "Check Number / Bank Reference", "Cashier Name", "Date"] }],
    modals: [{ name: "Official Receipt Preview", desc: "Print-ready OR with OR number, school name, student name, amount, and payment details" }, { name: "Reprint Receipt", desc: "Reprint any previously issued receipt by OR number or student name" }],
    reports: [{ name: "Daily Collection Report", desc: "Summary of all payments collected on a specific date by payment method" }, { name: "Bank Deposit Summary", desc: "Breakdown of check and online payments for bank deposit preparation" }, { name: "Collection by Payment Type", desc: "Breakdown of cash, check, and online transfer collections" }],
  },
  FACULTY_PORTAL: {
    name: "Teacher Board (Faculty Portal)",
    group: "Instruction",
    purpose: "Faculty-facing interface for accessing assigned classes, viewing schedules, and entering student grades — a focused view of teaching responsibilities for the current term.",
    features: ["My Classes list with subject, section, schedule, and student count", "Class roster with enrolled students per subject", "Grade encoding access per subject from the class card", "Teaching schedule overview by day and time", "Quick navigation to grade sheets for each class"],
    workflow: ["Teacher logs in and sees My Classes list", "Reviews the teaching schedule for the current week", "Clicks a class card to view the roster", "Clicks 'Grade Encoding' to open the grade sheet", "Enters grades for each student and saves"],
    tabs: [{ name: "My Classes", desc: "All subjects assigned to the teacher for the current term" }, { name: "Schedule", desc: "Weekly teaching schedule: day, time, subject, and room" }, { name: "Students", desc: "Combined student roster across all assigned classes" }],
    forms: [],
    modals: [],
    reports: [],
  },
  GRADE_ENCODING: {
    name: "Grade Encoding",
    group: "Instruction",
    purpose: "Spreadsheet-style interface for entering student grades by grading period. Teachers configure grade items, set weights, and input scores that are automatically computed into final grades.",
    features: ["Grade sheet table: one row per student, one column per grade item", "Grading period selector (1st–4th Quarter or Midterm/Finals)", "Grade item management: quizzes, activities, exams", "Weight configuration per grade component", "Auto-computation of weighted averages and final grades", "Grade summary view showing all periods and overall final grade", "Submit grades for registrar review"],
    workflow: ["Open Grade Encoding from the Teacher Board", "Select subject, section, and grading period", "Add grade items with categories and weights", "Input student scores in the grade sheet cells", "System computes weighted averages automatically", "Review the grade summary and submit the grade sheet"],
    tabs: [{ name: "Grade Sheet", desc: "Spreadsheet input grid: students in rows, grade items in columns" }, { name: "Grade Summary", desc: "All grading periods side-by-side with final grade computation" }],
    forms: [{ name: "Add Grade Item", fields: ["Item Name", "Category (Written Work / Performance Task / Periodic Assessment)", "Maximum Score", "Weight (%)", "Grading Period"] }, { name: "Grade Weights Setup", fields: ["Written Work Weight (%)", "Performance Tasks Weight (%)", "Periodic Assessment Weight (%)", "Apply to: Current Period / All Periods"] }],
    modals: [{ name: "Add Grade Item Modal", desc: "Add a new grade component to the current grade sheet" }, { name: "Manage Grade Weights Modal", desc: "Configure percentage weight per grade category per grading period" }, { name: "Submit Grades Confirmation", desc: "Confirmation before submitting the finalized grade sheet" }],
    reports: [],
  },
  ONLINE_LEARNING: {
    name: "Online Learning (LMS)",
    group: "Instruction",
    purpose: "Integrated LMS for teachers and students. Teachers organize modules and resources; students access video lessons, complete activities, and track their learning progress.",
    features: ["Module and lesson organization by subject", "Video lesson player with progress tracking", "Downloadable learning materials and resources", "Activity and quiz access within each module", "Completion tracking per student per module", "Teacher view of student progress and completion rates"],
    workflow: ["Teacher creates a learning module with title and subject", "Adds lessons (video, PDF, activities) to the module", "Publishes the module for student access", "Students navigate to Online Learning and see assigned modules", "Students watch lessons, download materials, complete activities", "Progress tracked automatically — teacher views completion rates"],
    tabs: [{ name: "Modules", desc: "All available learning modules organized by subject" }, { name: "My Progress", desc: "Student view of completion status per module" }],
    forms: [{ name: "Create Module Form", fields: ["Module Title", "Subject", "Grade Level", "Description", "Publish Status"] }, { name: "Add Lesson", fields: ["Lesson Title", "Content Type (Video / PDF / Link / Activity)", "URL or File Upload", "Order Number"] }],
    modals: [],
    reports: [],
  },
  STUDENT_PORTAL: {
    name: "Student Portal",
    group: "Student Self-Service",
    purpose: "Complete self-service hub for enrolled students — enrollment records, academic report card, financial ledger, personal profile, online learning, and self-service enrollment in a single tabbed interface.",
    features: ["Records Overview: enrollment status, GPA, fee balance, important dates", "Academic Report Card: grades by subject and period with GPA", "Financial Ledger: fee breakdown, payment history, and balance", "Student Profile: personal details, emergency contacts, health info", "Online Learning: LMS module browser and progress tracker", "Enrollment: self-service enrollment form for the next term"],
    workflow: ["Student logs in and lands on Records Overview", "Checks enrollment status and GPA summary", "Navigates to Academic Report Card to view grades", "Checks Financial Ledger for outstanding balance and payment history", "Updates personal profile if needed", "Files self-service enrollment for the next term"],
    tabs: [{ name: "Records Overview", desc: "Enrollment status dashboard with KPI cards and upcoming deadlines" }, { name: "Academic Report Card", desc: "Grade summary per subject and grading period with GPA" }, { name: "Financial Ledger", desc: "Fee breakdown, payment history, and remaining balance" }, { name: "Student Profile", desc: "Personal info, emergency contacts, and health profile" }, { name: "Online Learning", desc: "LMS module access with video lessons and completion tracking" }, { name: "Enrollment", desc: "Self-service enrollment form with subject selection and requirements upload" }],
    forms: [{ name: "Self-Service Enrollment Form", fields: ["Academic Year", "Grade Level / Year Level", "Program / Track", "Subject Selection", "Payment Terms", "Upload: Form 138, Good Moral, PSA Birth Cert, Medical Cert"] }, { name: "Profile Update Form", fields: ["Personal Details", "Address", "Contact Number", "Emergency Contact", "Blood Type", "Allergies", "Chronic Conditions"] }],
    modals: [{ name: "Statement of Account Preview", desc: "Downloadable SOA in PDF with all fees, discounts, and payments" }, { name: "Grade Detail Drill-down", desc: "Expanded view of a subject's grade breakdown by component and period" }],
    reports: [],
  },
  HR_MANAGEMENT: {
    name: "HR Management",
    group: "Human Resources",
    purpose: "Comprehensive HR platform covering the entire employee lifecycle — from recruitment and onboarding through daily attendance, leave management, and separation.",
    features: ["HR Dashboard with workforce KPIs and alert cards", "Complete employee lifecycle management (hire to separation)", "Daily attendance monitoring with clock-in/out records", "Shift template creation and employee assignment", "Leave management with filing, approval, and balance tracking", "Recruitment pipeline with job postings and applicant tracking", "Onboarding checklist for new hires"],
    workflow: ["Open HR Dashboard for a high-level workforce summary", "Navigate to Employee Life Cycles for a specific employee record", "Check Time Management for today's attendance logs", "Review and process pending leave applications", "For recruitment: create job postings and track applicants", "For onboarding: generate and track the new hire checklist"],
    tabs: [{ name: "HR Dashboard", desc: "KPIs: headcount, attendance rate, leave balances, open positions" }, { name: "Employee Life Cycles", desc: "Employee master list with history, promotions, and status changes" }, { name: "Time Management", desc: "Daily time records (DTR), hours worked, and overtime" }, { name: "Shift Management", desc: "Shift templates and employee-to-shift assignment calendar" }, { name: "Attendance Monitoring", desc: "Day-by-day records: present, absent, late, early-out" }, { name: "Leave Management", desc: "Leave application queue, approvals, balance ledger, and calendar" }, { name: "Recruitment", desc: "Job postings, applicants, interviews, and job offers" }, { name: "Onboarding", desc: "New hire checklist with completion tracking per requirement" }],
    forms: [{ name: "New Employee Form", fields: ["Employee Name", "Employee ID", "Department", "Position", "Employment Type", "Date Hired", "Salary Rate", "Tax Setup", "Benefits Enrollment"] }, { name: "Leave Application Form", fields: ["Employee Name", "Leave Type", "Date From", "Date To", "Number of Days", "Reason", "Supporting Document"] }, { name: "Recruitment Job Posting", fields: ["Position Title", "Department", "Employment Type", "Slots Available", "Job Description", "Requirements", "Application Deadline"] }],
    modals: [{ name: "Employee Profile", desc: "Full employee record with employment history, benefits, and documents" }, { name: "Leave Approval", desc: "Approve or reject a leave application with supervisor notes" }, { name: "Attendance Correction", desc: "Manual correction of missed clock-in/out with justification" }],
    reports: [],
  },
  PAYROLL_MANAGEMENT: {
    name: "Payroll Management",
    group: "Payroll",
    purpose: "Complete payroll cycle: setup payroll run, compute gross pay, apply deductions (SSS, PhilHealth, Pag-IBIG, BIR), generate payslips, and authorize payment release.",
    features: ["Payroll Dashboard with KPIs for current period totals", "Payroll run generation with period lock and computation", "Automatic government contribution deduction (SSS, PhilHealth, Pag-IBIG)", "BIR withholding tax computation based on compensation brackets", "Payslip generation per employee in PDF format", "Salary payout batch creation and bank file export", "Benefits administration (HMO, allowances, 13th month)"],
    workflow: ["Open Payroll Management", "Create a new payroll run for the current cut-off period", "System auto-computes gross pay based on salary rates and DTR", "Review and adjust for corrections or additions", "Run final computation — system applies all deductions", "Generate payslips per employee for review", "Submit payroll run for approval via Action Center", "On approval: create salary payout batch and export bank file"],
    tabs: [{ name: "Payroll Dashboard", desc: "Current period KPIs: total gross, deductions, net pay, headcount" }, { name: "Payroll Management", desc: "Payroll run list with period, status, and amounts" }, { name: "Salary Payouts", desc: "Payment batch list with release status and bank file export" }, { name: "Taxes", desc: "BIR withholding tax configuration, computation, and BIR forms" }, { name: "Benefits", desc: "SSS, PhilHealth, Pag-IBIG tables and benefit enrollment" }],
    forms: [{ name: "New Payroll Run", fields: ["Pay Period (From – To)", "Cut-off Type (Semi-monthly / Monthly)", "Employees Included", "Pay Date", "Remarks"] }, { name: "Salary Adjustment Form", fields: ["Employee", "Adjustment Type (Addition / Deduction)", "Amount", "Description", "Effective Period"] }],
    modals: [{ name: "Payslip Preview", desc: "Individual payslip with gross pay, itemized deductions, net pay — downloadable as PDF" }, { name: "Batch Payout Release", desc: "Confirm and authorize salary payout batch with total and employee count" }],
    reports: [{ name: "Payroll Register", desc: "Full payroll register with each employee's gross, deductions, and net pay" }, { name: "SSS/PhilHealth/Pag-IBIG Report", desc: "Government contribution summary for remittance preparation" }, { name: "BIR Monthly Withholding Tax Report", desc: "Monthly alpha list with withheld taxes for BIR submission" }],
  },
  GUIDANCE: {
    name: "Guidance Office",
    group: "Student Welfare",
    purpose: "Maintain comprehensive records of student behavioral incidents, counseling sessions, and pastoral notes with follow-up tracking and confidentiality controls.",
    features: ["Anecdotal record logging by incident type (Behavioral, Academic, Attendance, Social, Commendation, Disciplinary)", "Counseling session records with session type, concern area, and counselor notes", "Follow-up date tracking and completion marking", "Confidentiality flag for sensitive records", "Search and filter by student, type, and date range", "Student-linked record view for holistic case tracking"],
    workflow: ["Open the Guidance Office", "Search for a student to log a new record", "Add an Anecdotal Record: incident type, description, action taken", "Or log a Counseling Session: session type, concern area, summary", "Set a follow-up date if further monitoring is needed", "Mark follow-up as done once completed", "Generate a guidance report for administration"],
    tabs: [{ name: "Anecdotal Records", desc: "Behavioral and academic incident logs per student" }, { name: "Counseling Sessions", desc: "Individual and group counseling logs with status and notes" }],
    forms: [{ name: "New Anecdotal Record", fields: ["Student", "Record Date", "Incident Type", "Description", "Action Taken", "Follow-Up Date", "Reported By", "Confidential"] }, { name: "New Counseling Session", fields: ["Student", "Session Date", "Session Type", "Concern Area", "Session Summary", "Recommendations", "Next Session Date", "Counselor Name", "Status"] }],
    modals: [{ name: "Record Detail View", desc: "Full anecdotal record or counseling session with edit controls and follow-up tracking" }],
    reports: [],
  },
  GUIDANCE_REPORTS: {
    name: "Guidance Reports",
    group: "Student Welfare",
    purpose: "Statistical summaries and detailed reports on student behavioral records, counseling sessions, and incident trends for school administration and compliance.",
    features: ["Incident frequency report by type and date range", "Counseling session summary by concern area and type", "Student case history compilation", "Referral tracking and follow-up status report", "Export to PDF and Excel"],
    workflow: ["Navigate to Guidance Reports", "Select the report type and date range", "Preview the report on-screen", "Export to PDF or Excel for submission"],
    tabs: [],
    forms: [],
    modals: [{ name: "Report Preview", desc: "On-screen report preview with Export PDF and Export Excel controls" }],
    reports: [{ name: "Incident Frequency Report", desc: "Count of incidents by type for a period" }, { name: "Counseling Session Summary", desc: "Summary of sessions by type, concern area, and status" }, { name: "Student Case History", desc: "Chronological case log for a specific student" }, { name: "Follow-Up Status Report", desc: "Cases with pending follow-up dates and completion status" }],
  },
  NURSE_CLINIC: {
    name: "Clinic Module (School Nurse)",
    group: "Student Health",
    purpose: "Record and track student health visits, maintain student health profiles, and manage medical incidents — the digital health office log for all student health events.",
    features: ["Health visit log with chief complaint, vital signs, action taken, and disposition", "Student health profile with blood type, allergies, and chronic conditions", "Disposition: Released, Sent Home, Referred to Hospital, Observation, For Follow-up", "Emergency contact and PhilHealth information per student", "Visit history per student with date and complaint timeline"],
    workflow: ["Student comes to the clinic", "Nurse searches and opens the student's health profile", "Logs the health visit: chief complaint, vital signs", "Notes the action taken (medication, first aid, rest)", "Sets the disposition", "Updates health profile with new medical information if needed", "End-of-day: generates clinic visit summary report"],
    tabs: [{ name: "Health Visits", desc: "Clinic visit log with student, date, complaint, action, and disposition" }, { name: "Health Profiles", desc: "Student health profiles with blood type, allergies, and emergency contact" }],
    forms: [{ name: "Log Health Visit", fields: ["Student Name", "Section", "Visit Date", "Visit Time", "Chief Complaint", "Vital Signs (BP, Temp, Pulse, Resp Rate, Weight)", "Action Taken", "Disposition", "Recorded By"] }, { name: "Health Profile Form", fields: ["Blood Type", "Known Allergies", "Chronic Conditions", "Emergency Contact Name/Phone", "Primary Physician", "PhilHealth Number"] }],
    modals: [{ name: "Visit Detail", desc: "Full clinic visit record with all fields and vital signs" }, { name: "Health Profile Detail", desc: "Complete student health profile with all medical history" }],
    reports: [],
  },
  CONSULTATION: {
    name: "Consultation (Appointments)",
    group: "Student Health",
    purpose: "Manage appointment bookings between students/parents and school staff (guidance, nurses, teachers). Calendar-based scheduling with consultation notes.",
    features: ["Appointment booking with staff and time slot selection", "Appointment calendar view by day and week", "Consultation notes logged after the appointment", "Status: Pending, Confirmed, Completed, Cancelled", "Online booking by students through Student Portal"],
    workflow: ["Student books a consultation through the Student Portal", "Staff member confirms the appointment", "On the appointment date: staff conducts the consultation", "Staff logs consultation notes and marks Completed"],
    tabs: [{ name: "Appointments", desc: "List and calendar view of all scheduled consultations" }],
    forms: [{ name: "Book Appointment", fields: ["Staff Member / Department", "Appointment Date", "Time Slot", "Purpose / Concern", "Notes"] }],
    modals: [{ name: "Appointment Detail", desc: "Appointment view with consultation notes and status update controls" }],
    reports: [],
  },
  CLINIC_REPORTS: {
    name: "Clinic Reports",
    group: "Student Health",
    purpose: "Summary and analytical reports on student health visits, common ailments, and medical trends for school health program planning and compliance documentation.",
    features: ["Visit frequency report by ailment, grade level, and date range", "Medical clearance issuance log", "Health incident trend analysis", "Student medical referral report", "Export to PDF and Excel"],
    workflow: ["Navigate to Clinic Reports", "Select report type and date range", "Preview the report, export to PDF or Excel"],
    tabs: [],
    forms: [],
    modals: [{ name: "Report Preview", desc: "On-screen preview with Export PDF and Export Excel" }],
    reports: [{ name: "Visit Frequency Report", desc: "Count of clinic visits by chief complaint category" }, { name: "Health Incident Summary", desc: "Significant medical incidents and their dispositions" }, { name: "Medical Referral Report", desc: "Students referred to hospital or specialist" }, { name: "Medical Clearance Log", desc: "Record of medical clearances issued during a period" }],
  },
  ACCOUNTS_SECURITY: {
    name: "User Access & Authority",
    group: "System Administration",
    purpose: "Security management center: manage user accounts, reset credentials, monitor access events, and manage delegation of approval authority between staff.",
    features: ["User account list with role, status, and last-login", "Password reset and account lock/unlock controls", "Role assignment and permission review per user", "Approval authority delegation with date range and module scope", "Complete system audit trail with all actions timestamped", "Admin reports on user activity and access patterns"],
    workflow: ["Navigate to User Access & Authority", "Review user accounts for security anomalies", "Reset a user's password or unlock a locked account", "Create a delegation record to transfer approval authority", "Check the audit log for unusual activity", "Generate admin reports on access and activity"],
    tabs: [{ name: "User Security", desc: "User accounts with status, role, and credential management" }, { name: "Delegation Mgmt", desc: "Active and past delegation records with scope and date range" }, { name: "Audit Log", desc: "Chronological log of all system actions: who, what, when" }, { name: "Admin Reports", desc: "User activity, module access, and failed login analysis" }],
    forms: [{ name: "Create Delegation", fields: ["Delegating Officer", "Delegate (Recipient)", "Module Scope", "Effective Date From", "Effective Date To", "Reason / Authority", "Authorized By"] }],
    modals: [{ name: "User Account Detail", desc: "User profile with role, status, last-login, and action buttons" }, { name: "Audit Entry Detail", desc: "Expanded audit log entry with full description and affected record" }],
    reports: [{ name: "User Activity Report", desc: "Actions per user within a date range, sorted by module" }, { name: "Failed Login Report", desc: "Failed login attempts with IP address and timestamp" }, { name: "Module Access Report", desc: "Count of logins and actions per module for usage analysis" }],
  },
  CORE_SETUP: {
    name: "Core Setup",
    group: "System Administration",
    purpose: "Master system configuration — school information, academic calendar parameters, grading period structures, and global settings that govern all other modules.",
    features: ["School profile: name, address, principal, DepEd school ID", "Academic year setup with start and end dates", "School term configuration (Semester / Trimester / Annual)", "Grading period definitions with date ranges", "Academic unit context switching (Basic Ed / College)", "Global system preferences and notification settings"],
    workflow: ["Open Core Setup at the start of each academic year", "Verify and update the school profile information", "Create the new academic year with start and end dates", "Define grading periods for the year (e.g., 1st Quarter: June–August)", "Activate the academic year as the current active context", "All enrollment, grading, and scheduling use these settings as reference"],
    tabs: [{ name: "School Setup", desc: "School name, address, DepEd ID, and logo" }, { name: "Academic Year", desc: "Academic year list with start/end dates and active status" }, { name: "Grading Periods", desc: "Grading period definitions with date ranges per academic year" }, { name: "System Configuration", desc: "Global preferences, email notification settings, and feature toggles" }],
    forms: [{ name: "Academic Year Form", fields: ["School Year Label", "Start Date", "End Date", "School Terms", "Active Status"] }, { name: "Grading Period Form", fields: ["Period Name", "Start Date", "End Date", "Academic Year", "Sequence Number"] }],
    modals: [],
    reports: [],
  },
  BOOKS_SETUP: {
    name: "Books & Library Setup",
    group: "Academic Administration",
    purpose: "Configure book packages assigned to each grade level. Packages are automatically included in the enrollment fee assessment and can be issued to enrolled students.",
    features: ["Book package definition per grade level", "Book title and price configuration", "Automatic inclusion in enrollment assessment", "Issuance tracking per enrolled student"],
    workflow: ["Admin configures book packages per grade level", "On enrollment: book package auto-added to fee assessment", "Upon payment: book package marked as issued to the student"],
    tabs: [{ name: "Book Packages", desc: "Grade level to book package mapping with titles and prices" }],
    forms: [{ name: "Book Package Form", fields: ["Grade Level", "Package Name", "Books: Title | Publisher | Unit Price", "Total Package Price"] }],
    modals: [],
    reports: [],
  },
  GUARDIAN_PORTAL: {
    name: "Parent Portal",
    group: "Family Access",
    purpose: "Secure window for parents and guardians to view their child's academic records, financial status, attendance, and school announcements without visiting the school office.",
    features: ["Child selector for parents with multiple enrolled children", "Academic grade summary per subject and grading period", "Tuition fee balance and payment history", "Attendance record with present, absent, and late counts", "School announcements and important notices", "Read-only access — no data editing"],
    workflow: ["Parent logs in with guardian account credentials", "Selects their child (if multiple children enrolled)", "Views the academic grade summary", "Checks the financial ledger for outstanding fees", "Reviews attendance record and school notices"],
    tabs: [{ name: "Academic Summary", desc: "Subject grades per grading period with GPA" }, { name: "Financial Summary", desc: "Fee assessment, payments made, and remaining balance" }, { name: "Attendance", desc: "Monthly attendance: present, absent, late, early-out" }, { name: "Announcements", desc: "School-wide and grade-level announcements" }],
    forms: [],
    modals: [],
    reports: [],
  },
};

// ─── Role → Module sequence ───────────────────────────────────────────────────
const ROLE_MODULE_SEQUENCE = {
  SUPER_ADMIN: ["DASHBOARD","ACTION_CENTER","REGISTRAR","STUDENT_DIRECTORY","CLASS_SECTIONING","SCHEDULING","FACULTY_ADMIN","CURRICULUM","GRADING","REGISTRAR_REPORTS","ACCOUNTING_DASHBOARD","ACCOUNTING","ACCOUNTING_SETUP","JOURNAL_ENTRIES","AR_MODULE","AP_MODULE","FINANCIAL_REPORTS","CASHIER","FACULTY_PORTAL","GRADE_ENCODING","ONLINE_LEARNING","STUDENT_PORTAL","HR_MANAGEMENT","PAYROLL_MANAGEMENT","GUIDANCE","GUIDANCE_REPORTS","NURSE_CLINIC","CONSULTATION","CLINIC_REPORTS","ACCOUNTS_SECURITY","CORE_SETUP"],
  ADMIN:        ["DASHBOARD","ACTION_CENTER","STUDENT_DIRECTORY","HR_MANAGEMENT","REGISTRAR_REPORTS","ACCOUNTS_SECURITY"],
  PRINCIPAL:    ["ACTION_CENTER","STUDENT_DIRECTORY","GRADING","CURRICULUM","FACULTY_ADMIN","SCHEDULING","REGISTRAR_REPORTS"],
  REGISTRAR:    ["ACTION_CENTER","REGISTRAR","STUDENT_DIRECTORY","CLASS_SECTIONING","SCHEDULING","FACULTY_ADMIN","CURRICULUM","GRADING","BOOKS_SETUP","REGISTRAR_REPORTS"],
  ACCOUNTING:   ["ACTION_CENTER","ACCOUNTING_DASHBOARD","ACCOUNTING","ACCOUNTING_SETUP","JOURNAL_ENTRIES","AR_MODULE","AP_MODULE","FINANCIAL_REPORTS","BOOKS_SETUP"],
  CASHIER:      ["CASHIER"],
  TEACHER:      ["FACULTY_PORTAL","GRADE_ENCODING","CURRICULUM","ONLINE_LEARNING"],
  STUDENT:      ["STUDENT_PORTAL","ONLINE_LEARNING","CONSULTATION"],
  HR:           ["ACTION_CENTER","HR_MANAGEMENT"],
  GUIDANCE:     ["GUIDANCE","GUIDANCE_REPORTS"],
  NURSE:        ["NURSE_CLINIC","CONSULTATION","CLINIC_REPORTS"],
  PAYROLL:      ["ACTION_CENTER","PAYROLL_MANAGEMENT"],
  GUARDIAN:     ["GUARDIAN_PORTAL"],
};

// ─── Slide helpers ────────────────────────────────────────────────────────────

function addCoverSlide(pptx, logoPath) {
  const s = pptx.addSlide();

  // Background
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: C.brownDeep }, line: { type: "none" } });

  // Gold accent decorations
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.9, w: "100%", h: 0.04, fill: { color: C.gold }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.rect, { x: 4.5, y: 2.55, w: 4.33, h: 0.03, fill: { color: C.gold }, line: { type: "none" } });

  // Logo
  if (fs.existsSync(logoPath)) {
    s.addImage({ path: logoPath, x: 5.91, y: 0.55, w: 1.5, h: 1.5 });
  }

  // School name
  s.addText("ST. THERESA'S SCHOOL NETWORK", {
    x: 0, y: 2.15, w: "100%", h: 0.35,
    align: "center", fontSize: 11, bold: true,
    color: C.gold, charSpacing: 3,
    fontFace: FONT,
  });

  // System name
  s.addText("STSN Connect", {
    x: 0, y: 2.65, w: "100%", h: 1.4,
    align: "center", fontSize: 66, bold: true,
    color: C.white, fontFace: FONT,
  });

  // Subtitle
  s.addText("Integrated School Management System", {
    x: 0, y: 4.0, w: "100%", h: 0.5,
    align: "center", fontSize: 17,
    color: C.goldLight, fontFace: FONT,
  });

  // Tag box
  s.addShape(pptx.ShapeType.rect, {
    x: 4.75, y: 4.65, w: 3.83, h: 0.45,
    fill: { type: "none" }, line: { color: C.gold, width: 1.5 },
  });
  s.addText("SYSTEM DEMO GUIDE", {
    x: 4.75, y: 4.65, w: 3.83, h: 0.45,
    align: "center", fontSize: 11, bold: true,
    color: C.gold, charSpacing: 2.5, fontFace: FONT,
  });

  // Stats
  const stats = [
    { num: "13", label: "User Roles" },
    { num: "25+", label: "Modules" },
    { num: "60+", label: "Pages / Tabs" },
    { num: "2", label: "Academic Units" },
  ];
  const statW = 2.8;
  const startX = (13.33 - statW * stats.length - 0.4 * (stats.length - 1)) / 2;
  stats.forEach((stat, i) => {
    const x = startX + i * (statW + 0.4);
    s.addText([
      { text: stat.num, options: { fontSize: 30, bold: true, color: C.gold, breakLine: false } },
      { text: `\n${stat.label}`, options: { fontSize: 11, color: C.goldLight, breakLine: false } },
    ], { x, y: 5.35, w: statW, h: 0.95, align: "center", fontFace: FONT });
  });

  // Footer
  s.addText("STSN Connect  ·  System Demo Guide  ·  June 2026  ·  Confidential", {
    x: 0, y: 7.15, w: "100%", h: 0.32,
    align: "center", fontSize: 8.5, color: C.brownLight,
    fontFace: FONT,
  });
}

function addOverviewSlide(pptx, logoPath) {
  const s = pptx.addSlide();

  // Left dark panel
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 5.5, h: 7.5, fill: { color: C.brownDeep }, line: { type: "none" } });
  // Right cream panel
  s.addShape(pptx.ShapeType.rect, { x: 5.5, y: 0, w: 7.83, h: 7.5, fill: { color: C.cream }, line: { type: "none" } });
  // Gold accent top-left
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 5.5, h: 0.06, fill: { color: C.gold }, line: { type: "none" } });

  if (fs.existsSync(logoPath)) {
    s.addImage({ path: logoPath, x: 0.4, y: 0.25, w: 0.75, h: 0.75 });
  }
  s.addText("STSN Connect", { x: 1.25, y: 0.3, w: 4.0, h: 0.35, fontSize: 14, bold: true, color: C.white, fontFace: FONT });
  s.addText("System Overview", { x: 1.25, y: 0.6, w: 4.0, h: 0.25, fontSize: 10, color: C.gold, fontFace: FONT });

  s.addText("STSN Connect is a comprehensive, web-based school management system that integrates every aspect of school operations — from admissions and grade encoding to payroll processing and parent communication — in a single, unified platform. Supports both Basic Education (K–12) and College academic structures.", {
    x: 0.3, y: 1.1, w: 4.9, h: 1.8,
    fontSize: 10, color: C.goldLight, fontFace: FONT,
    valign: "top", wrap: true,
  });

  // Stats
  [["13", "User Roles"], ["25+", "Modules"], ["60+", "Feature Pages"]].forEach(([n, l], i) => {
    const y = 3.0 + i * 0.95;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y, w: 4.9, h: 0.8, fill: { color: "3d2b1f" }, line: { type: "none" } });
    s.addText(n, { x: 0.5, y: y + 0.05, w: 1.0, h: 0.7, fontSize: 28, bold: true, color: C.gold, fontFace: FONT });
    s.addText(l, { x: 1.6, y: y + 0.22, w: 3.4, h: 0.35, fontSize: 12, color: C.goldLight, fontFace: FONT });
  });

  // Right panel: Roles grid
  s.addText("USER ROLES", {
    x: 5.8, y: 0.25, w: 7.2, h: 0.35,
    fontSize: 11, bold: true, color: C.brown, fontFace: FONT, charSpacing: 1.5,
  });
  s.addShape(pptx.ShapeType.rect, { x: 5.8, y: 0.6, w: 7.1, h: 0.03, fill: { color: C.gold }, line: { type: "none" } });

  const roleList = [
    ["Super Administrator", "Full system access — all 29 modules"],
    ["School Administrator", "Operational oversight — HR and registrar"],
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

  const cols = [0, 3.6];
  const rows = Math.ceil(roleList.length / 2);
  roleList.forEach(([name, desc], idx) => {
    const col = idx < rows ? 0 : 1;
    const row = idx < rows ? idx : idx - rows;
    const x = 5.8 + cols[col];
    const y = 0.75 + row * 0.48;
    s.addShape(pptx.ShapeType.rect, { x, y, w: 3.3, h: 0.4, fill: { color: "f0ece5" }, line: { color: C.beige, width: 0.5 } });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.04, h: 0.4, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(name, { x: x + 0.1, y: y + 0.02, w: 3.1, h: 0.18, fontSize: 8.5, bold: true, color: C.text, fontFace: FONT });
    s.addText(desc, { x: x + 0.1, y: y + 0.2, w: 3.1, h: 0.17, fontSize: 7.5, color: C.textLight, fontFace: FONT });
  });

  addFooter(s, "System Overview", "STSN Connect");
}

function addRoleHeaderSlide(pptx, role, logoPath) {
  const s = pptx.addSlide();

  // Left dark panel
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 5.5, h: 7.5, fill: { color: C.brownDeep }, line: { type: "none" } });
  // Gold accent bottom of left panel
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: 5.5, h: 0.06, fill: { color: C.gold }, line: { type: "none" } });
  // Right cream panel
  s.addShape(pptx.ShapeType.rect, { x: 5.5, y: 0, w: 7.83, h: 7.5, fill: { color: C.cream }, line: { type: "none" } });
  // Gold accent top
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: C.gold }, line: { type: "none" } });

  if (fs.existsSync(logoPath)) {
    s.addImage({ path: logoPath, x: 0.4, y: 0.3, w: 0.7, h: 0.7 });
  }
  s.addText("STSN CONNECT", { x: 1.2, y: 0.38, w: 4.0, h: 0.25, fontSize: 9, bold: true, color: C.gold, charSpacing: 1.5, fontFace: FONT });

  // Role label
  s.addText("USER ROLE", { x: 0.4, y: 1.5, w: 4.7, h: 0.3, fontSize: 9.5, bold: true, color: C.gold, charSpacing: 2, fontFace: FONT });
  // Role name
  s.addText(role.name, {
    x: 0.4, y: 1.85, w: 4.7, h: 1.8,
    fontSize: 34, bold: true, color: C.white, fontFace: FONT,
    wrap: true, valign: "top",
  });
  // Tagline
  s.addText(role.tagline, {
    x: 0.4, y: 3.95, w: 4.7, h: 0.8,
    fontSize: 11, color: C.goldLight, fontFace: FONT,
    wrap: true, valign: "top",
  });

  // Right panel
  s.addText("KEY RESPONSIBILITIES", {
    x: 5.8, y: 0.55, w: 7.1, h: 0.3,
    fontSize: 10.5, bold: true, color: C.brown, charSpacing: 1.5, fontFace: FONT,
  });
  s.addShape(pptx.ShapeType.rect, { x: 5.8, y: 0.87, w: 7.1, h: 0.03, fill: { color: C.gold }, line: { type: "none" } });

  const respItems = role.responsibilities.map(r => ({
    text: r,
    options: { bullet: { code: "25B8", color: C.gold }, color: C.text, breakLine: true, paraSpaceAfter: 3 },
  }));
  s.addText(respItems, {
    x: 5.8, y: 1.0, w: 7.1, h: 5.5,
    fontSize: 11.5, fontFace: FONT, valign: "top",
  });

  addFooter(s, role.name, "Role Overview");
}

function addModuleSlide(pptx, mod, role) {
  const s = pptx.addSlide();
  const { name, group, purpose, features, workflow, tabs, forms, modals, reports } = mod;

  // Header bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: C.brownDeep }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.5, w: "100%", h: 0.03, fill: { color: C.gold }, line: { type: "none" } });

  // Header text
  s.addText(group.toUpperCase(), { x: 0.3, y: 0.08, w: 5, h: 0.35, fontSize: 9, color: C.goldLight, charSpacing: 1.5, fontFace: FONT });
  // Role badge
  s.addShape(pptx.ShapeType.rect, { x: 10.4, y: 0.1, w: 2.7, h: 0.3, fill: { color: C.brown }, line: { type: "none" } });
  s.addText(role.name.toUpperCase(), { x: 10.4, y: 0.1, w: 2.7, h: 0.3, align: "center", fontSize: 8, bold: true, color: C.white, charSpacing: 0.5, fontFace: FONT });

  // Module name
  s.addText(name, {
    x: 0.3, y: 0.65, w: 8.5, h: 0.75,
    fontSize: 26, bold: true, color: C.text, fontFace: FONT,
  });

  // Purpose strip (gold left border visual)
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.5, w: 0.04, h: 0.85, fill: { color: C.gold }, line: { type: "none" } });
  s.addText(purpose, {
    x: 0.46, y: 1.5, w: 12.6, h: 0.85,
    fontSize: 10, color: C.textMid, fontFace: FONT,
    valign: "top", wrap: true,
  });

  // Tabs row (small chips at top-right area)
  if (tabs && tabs.length > 0) {
    const tabText = tabs.map(t => t.name).join("  ·  ");
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 2.42, w: 12.6, h: 0.3, fill: { color: "f0ece5" }, line: { type: "none" } });
    s.addText("TABS: " + tabText, {
      x: 0.45, y: 2.44, w: 12.4, h: 0.26,
      fontSize: 8.5, bold: true, color: C.brown, fontFace: FONT,
    });
  }

  const contentY = (tabs && tabs.length > 0) ? 2.82 : 2.45;
  const colH = 7.5 - contentY - 0.4;

  // Features column (left)
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: contentY, w: 5.8, h: colH, fill: { color: "f8f5f0" }, line: { color: C.beige, width: 0.5 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: contentY, w: 5.8, h: 0.3, fill: { color: C.brown }, line: { type: "none" } });
  s.addText("KEY FEATURES", { x: 0.4, y: contentY + 0.04, w: 5.6, h: 0.22, fontSize: 8.5, bold: true, color: C.white, charSpacing: 1, fontFace: FONT });

  const featItems = (features || []).slice(0, 8).map(f => ({
    text: f,
    options: { bullet: { code: "25B8", color: C.gold }, color: C.text, breakLine: true, paraSpaceAfter: 2 },
  }));
  s.addText(featItems, {
    x: 0.4, y: contentY + 0.35, w: 5.6, h: colH - 0.45,
    fontSize: 9.5, fontFace: FONT, valign: "top",
  });

  // Workflow column (right)
  s.addShape(pptx.ShapeType.rect, { x: 6.4, y: contentY, w: 6.6, h: colH, fill: { color: "f8f5f0" }, line: { color: C.beige, width: 0.5 } });
  s.addShape(pptx.ShapeType.rect, { x: 6.4, y: contentY, w: 6.6, h: 0.3, fill: { color: C.brownDark }, line: { type: "none" } });
  s.addText("WORKFLOW", { x: 6.5, y: contentY + 0.04, w: 6.4, h: 0.22, fontSize: 8.5, bold: true, color: C.white, charSpacing: 1, fontFace: FONT });

  let counter = 0;
  const wfItems = (workflow || []).slice(0, 10).map(w => {
    counter++;
    return {
      text: `${counter}.  ${w}`,
      options: { color: C.text, breakLine: true, paraSpaceAfter: 2 },
    };
  });
  s.addText(wfItems, {
    x: 6.5, y: contentY + 0.35, w: 6.4, h: colH - 0.45,
    fontSize: 9.5, fontFace: FONT, valign: "top",
  });

  addFooter(s, role.name + "  ·  " + name, group);
}

function addFormSlide(pptx, form, mod, role) {
  const s = pptx.addSlide();

  // Header
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: C.brownDeep }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.5, w: "100%", h: 0.03, fill: { color: C.gold }, line: { type: "none" } });
  s.addText("FORM REFERENCE  ·  " + mod.group.toUpperCase(), { x: 0.3, y: 0.08, w: 8, h: 0.35, fontSize: 9, color: C.goldLight, charSpacing: 1, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 10.4, y: 0.1, w: 2.7, h: 0.3, fill: { color: C.brown }, line: { type: "none" } });
  s.addText(role.name.toUpperCase(), { x: 10.4, y: 0.1, w: 2.7, h: 0.3, align: "center", fontSize: 8, bold: true, color: C.white, fontFace: FONT });

  // Title
  s.addText(mod.name, { x: 0.3, y: 0.65, w: 9, h: 0.4, fontSize: 16, color: C.textMid, fontFace: FONT });
  s.addText(form.name, {
    x: 0.3, y: 1.05, w: 12.6, h: 0.65,
    fontSize: 24, bold: true, color: C.text, fontFace: FONT,
  });

  // Gold divider
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.72, w: 12.6, h: 0.03, fill: { color: C.gold }, line: { type: "none" } });

  // Form fields in a 3-column grid
  const fields = form.fields || [];
  const cols = 3;
  const colW = 4.1;
  const colGap = 0.1;
  const startX = 0.3;
  const startY = 1.85;
  const cellH = 0.72;

  s.addText("FORM FIELDS", { x: 0.3, y: 1.78, w: 3, h: 0.2, fontSize: 8, bold: true, color: C.gold, charSpacing: 1.5, fontFace: FONT });

  fields.forEach((field, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (colW + colGap);
    const y = startY + row * cellH;
    s.addShape(pptx.ShapeType.rect, { x, y, w: colW, h: cellH - 0.06, fill: { color: C.cream }, line: { color: C.beige, width: 0.75 } });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.04, h: cellH - 0.06, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(field, {
      x: x + 0.12, y: y + 0.06, w: colW - 0.18, h: cellH - 0.18,
      fontSize: 10, color: C.text, fontFace: FONT, valign: "middle", wrap: true,
    });
  });

  addFooter(s, role.name + "  ·  " + form.name, "Form Reference");
}

function addModalsReportsSlide(pptx, mod, role) {
  if ((!mod.modals || mod.modals.length === 0) && (!mod.reports || mod.reports.length === 0)) return;

  const s = pptx.addSlide();

  // Header
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: C.brownDeep }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.5, w: "100%", h: 0.03, fill: { color: C.gold }, line: { type: "none" } });
  s.addText("MODALS & REPORTS  ·  " + mod.group.toUpperCase(), { x: 0.3, y: 0.08, w: 9, h: 0.35, fontSize: 9, color: C.goldLight, charSpacing: 1, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 10.4, y: 0.1, w: 2.7, h: 0.3, fill: { color: C.brown }, line: { type: "none" } });
  s.addText(role.name.toUpperCase(), { x: 10.4, y: 0.1, w: 2.7, h: 0.3, align: "center", fontSize: 8, bold: true, color: C.white, fontFace: FONT });

  s.addText(mod.name, { x: 0.3, y: 0.65, w: 12.6, h: 0.65, fontSize: 26, bold: true, color: C.text, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.3, w: 12.6, h: 0.03, fill: { color: C.beige }, line: { type: "none" } });

  let currentY = 1.4;

  if (mod.modals && mod.modals.length > 0) {
    s.addText("MODALS & DIALOGS", { x: 0.3, y: currentY, w: 5, h: 0.28, fontSize: 9, bold: true, color: C.brown, charSpacing: 1.5, fontFace: FONT });
    currentY += 0.32;

    mod.modals.forEach(m => {
      s.addShape(pptx.ShapeType.rect, { x: 0.3, y: currentY, w: 12.6, h: 0.65, fill: { color: C.cream }, line: { color: C.beige, width: 0.5 } });
      s.addShape(pptx.ShapeType.rect, { x: 0.3, y: currentY, w: 0.04, h: 0.65, fill: { color: C.brown }, line: { type: "none" } });
      s.addText(m.name, { x: 0.45, y: currentY + 0.05, w: 3.5, h: 0.22, fontSize: 10, bold: true, color: C.text, fontFace: FONT });
      s.addText(m.desc, { x: 0.45, y: currentY + 0.27, w: 12.3, h: 0.3, fontSize: 9.5, color: C.textMid, fontFace: FONT, wrap: true });
      currentY += 0.72;
    });
    currentY += 0.2;
  }

  if (mod.reports && mod.reports.length > 0) {
    s.addText("REPORTS", { x: 0.3, y: currentY, w: 5, h: 0.28, fontSize: 9, bold: true, color: C.brown, charSpacing: 1.5, fontFace: FONT });
    currentY += 0.32;

    mod.reports.forEach(r => {
      if (currentY > 6.9) return;
      s.addShape(pptx.ShapeType.rect, { x: 0.3, y: currentY, w: 12.6, h: 0.65, fill: { color: C.cream }, line: { color: C.beige, width: 0.5 } });
      s.addShape(pptx.ShapeType.rect, { x: 0.3, y: currentY, w: 0.04, h: 0.65, fill: { color: C.gold }, line: { type: "none" } });
      s.addText(r.name, { x: 0.45, y: currentY + 0.05, w: 4.5, h: 0.22, fontSize: 10, bold: true, color: C.text, fontFace: FONT });
      s.addText(r.desc, { x: 0.45, y: currentY + 0.27, w: 12.3, h: 0.3, fontSize: 9.5, color: C.textMid, fontFace: FONT, wrap: true });
      currentY += 0.72;
    });
  }

  addFooter(s, role.name + "  ·  " + mod.name, "Modals & Reports");
}

function addTabsSlide(pptx, mod, role) {
  if (!mod.tabs || mod.tabs.length <= 1) return;

  const s = pptx.addSlide();

  // Header
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: C.brownDeep }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.5, w: "100%", h: 0.03, fill: { color: C.gold }, line: { type: "none" } });
  s.addText("NAVIGATION TABS  ·  " + mod.group.toUpperCase(), { x: 0.3, y: 0.08, w: 9, h: 0.35, fontSize: 9, color: C.goldLight, charSpacing: 1, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 10.4, y: 0.1, w: 2.7, h: 0.3, fill: { color: C.brown }, line: { type: "none" } });
  s.addText(role.name.toUpperCase(), { x: 10.4, y: 0.1, w: 2.7, h: 0.3, align: "center", fontSize: 8, bold: true, color: C.white, fontFace: FONT });

  s.addText(mod.name, { x: 0.3, y: 0.65, w: 12.6, h: 0.65, fontSize: 26, bold: true, color: C.text, fontFace: FONT });

  // Tab cards in 2-column grid
  const tabCardW = 6.05;
  const tabCardH = 1.1;
  const cols = 2;
  const startX = 0.3;
  const startY = 1.45;
  const gap = 0.2;

  mod.tabs.forEach((tab, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (tabCardW + gap);
    const y = startY + row * (tabCardH + gap);
    if (y + tabCardH > 7.3) return;

    s.addShape(pptx.ShapeType.rect, { x, y, w: tabCardW, h: tabCardH, fill: { color: C.cream }, line: { color: C.beige, width: 0.75 } });
    s.addShape(pptx.ShapeType.rect, { x, y, w: tabCardW, h: 0.32, fill: { color: "f0ece5" }, line: { type: "none" } });
    // Tab number
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.28, h: tabCardH, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.02, y: y + 0.35, w: 0.24, h: 0.38, align: "center", fontSize: 11, bold: true, color: C.white, fontFace: FONT });
    s.addText(tab.name, { x: x + 0.38, y: y + 0.05, w: tabCardW - 0.48, h: 0.24, fontSize: 11, bold: true, color: C.text, fontFace: FONT });
    s.addText(tab.desc, { x: x + 0.38, y: y + 0.35, w: tabCardW - 0.48, h: 0.65, fontSize: 9.5, color: C.textMid, fontFace: FONT, valign: "top", wrap: true });
  });

  addFooter(s, role.name + "  ·  " + mod.name, "Navigation Tabs");
}

function addFooter(slide, left, right) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.25, w: "100%", h: 0.25,
    fill: { color: "f0ece5" }, line: { color: C.beige, width: 0.3 },
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.25, w: "100%", h: 0.02, fill: { color: C.beige }, line: { type: "none" } });
  slide.addText(left, { x: 0.2, y: 7.27, w: 8, h: 0.2, fontSize: 7.5, color: C.brown, fontFace: FONT, bold: true });
  slide.addText("STSN Connect  ·  System Demo Guide  ·  Confidential", { x: 0, y: 7.27, w: "100%", h: 0.2, align: "center", fontSize: 7.5, color: C.textLight, fontFace: FONT });
  slide.addText(right, { x: 5.5, y: 7.27, w: 7.63, h: 0.2, align: "right", fontSize: 7.5, color: C.textLight, fontFace: FONT });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// pptx needs to be in outer scope for addFooter to reference
const pptx = new PptxGenJS();

async function generate() {
  console.log("📊 STSN Connect — PowerPoint Generator");
  console.log("────────────────────────────────────────");

  const logoExists = fs.existsSync(LOGO_PATH);
  console.log(logoExists ? "✅ Logo found: stsn-crest.png" : "⚠️  Logo not found");

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "STSN Connect";
  pptx.title = "STSN Connect — System Demo Guide";
  pptx.subject = "Integrated School Management System";

  let slideCount = 0;

  console.log("📝 Building slides...");
  addCoverSlide(pptx, LOGO_PATH);
  slideCount++;
  addOverviewSlide(pptx, LOGO_PATH);
  slideCount++;

  for (const role of ROLES) {
    addRoleHeaderSlide(pptx, role, LOGO_PATH);
    slideCount++;

    const moduleKeys = ROLE_MODULE_SEQUENCE[role.id] || [];
    for (const key of moduleKeys) {
      const mod = MODULE_PAGES[key];
      if (!mod) continue;

      addModuleSlide(pptx, mod, role);
      slideCount++;

      // Dedicated tabs slide for modules with 3+ tabs
      if (mod.tabs && mod.tabs.length >= 3) {
        addTabsSlide(pptx, mod, role);
        slideCount++;
      }

      // Dedicated form slides
      for (const form of (mod.forms || [])) {
        addFormSlide(pptx, form, mod, role);
        slideCount++;
      }

      // Modals + Reports slide
      if ((mod.modals && mod.modals.length > 0) || (mod.reports && mod.reports.length > 0)) {
        addModalsReportsSlide(pptx, mod, role);
        slideCount++;
      }
    }
  }

  console.log(`✅ ${slideCount} slides built`);
  console.log("💾 Writing PPTX file...");

  await pptx.writeFile({ fileName: OUTPUT_PATH });

  const stats = fs.statSync(OUTPUT_PATH);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ PPTX generated successfully!`);
  console.log(`   📁 Output: ${OUTPUT_PATH}`);
  console.log(`   📊 Slides: ${slideCount}`);
  console.log(`   📦 Size: ${sizeMB} MB`);
  console.log(`\nOpen STSN_Connect_Demo.pptx in the project root.`);
}

generate().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
