// AUTO-GENERATED from supabase/migrations/0001_schema.sql — do not hand-edit.
// Regenerate with: node scripts/generate-types.mjs

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface SchoolsRow {
  id: string;
  legacy_id: string | null;
  code: string;
  name: string;
  short_name: string | null;
  location: string | null;
  academic_unit: string;
  branding_label: string | null;
  supported_roles: string[];
  created_at: string;
  updated_at: string;
}
export interface SchoolsInsert {
  id?: string;
  legacy_id?: string | null;
  code: string;
  name: string;
  short_name?: string | null;
  location?: string | null;
  academic_unit: string;
  branding_label?: string | null;
  supported_roles?: string[];
  created_at?: string;
  updated_at?: string;
}
export interface SchoolsUpdate {
  id?: string;
  legacy_id?: string | null;
  code?: string;
  name?: string;
  short_name?: string | null;
  location?: string | null;
  academic_unit?: string;
  branding_label?: string | null;
  supported_roles?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SetupItemsRow {
  id: string;
  legacy_id: string | null;
  category: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  metadata: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface SetupItemsInsert {
  id?: string;
  legacy_id?: string | null;
  category: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number | null;
  metadata?: Json;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface SetupItemsUpdate {
  id?: string;
  legacy_id?: string | null;
  category?: string;
  code?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number | null;
  metadata?: Json;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsersRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}
export interface UsersInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  email: string;
  name: string;
  role: string;
  is_active?: boolean;
  avatar_url?: string | null;
  department?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface UsersUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  avatar_url?: string | null;
  department?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CoursesRow {
  id: string;
  legacy_id: string | null;
  code: string;
  name: string;
  department: string;
  duration_years: number | null;
  created_at: string;
  updated_at: string;
}
export interface CoursesInsert {
  id?: string;
  legacy_id?: string | null;
  code: string;
  name: string;
  department: string;
  duration_years?: number | null;
  created_at?: string;
  updated_at?: string;
}
export interface CoursesUpdate {
  id?: string;
  legacy_id?: string | null;
  code?: string;
  name?: string;
  department?: string;
  duration_years?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectsRow {
  id: string;
  legacy_id: string | null;
  code: string;
  name: string;
  units: number;
  department: string;
  year_level: string | null;
  semester: string | null;
  track_or_course: string | null;
  prerequisites: string[];
  created_at: string;
  updated_at: string;
}
export interface SubjectsInsert {
  id?: string;
  legacy_id?: string | null;
  code: string;
  name: string;
  units?: number;
  department: string;
  year_level?: string | null;
  semester?: string | null;
  track_or_course?: string | null;
  prerequisites?: string[];
  created_at?: string;
  updated_at?: string;
}
export interface SubjectsUpdate {
  id?: string;
  legacy_id?: string | null;
  code?: string;
  name?: string;
  units?: number;
  department?: string;
  year_level?: string | null;
  semester?: string | null;
  track_or_course?: string | null;
  prerequisites?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TeachersRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  user_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  department: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  advisory_section: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface TeachersInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  department: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  advisory_section?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface TeachersUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  user_id?: string | null;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  department?: string;
  email?: string;
  phone?: string | null;
  specialization?: string | null;
  advisory_section?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  user_id: string | null;
  student_no: string;
  lrn: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: string | null;
  civil_status: string | null;
  religion: string | null;
  nationality: string | null;
  birthday: string | null;
  birthplace: string | null;
  email: string | null;
  contact_no: string | null;
  address: string | null;
  province: string | null;
  municipality: string | null;
  zip_code: string | null;
  department: string;
  year_level: string | null;
  track_or_course: string | null;
  section: string | null;
  enrollment_status: string;
  created_at: string;
  updated_at: string;
}
export interface StudentsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  user_id?: string | null;
  student_no: string;
  lrn?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender?: string | null;
  civil_status?: string | null;
  religion?: string | null;
  nationality?: string | null;
  birthday?: string | null;
  birthplace?: string | null;
  email?: string | null;
  contact_no?: string | null;
  address?: string | null;
  province?: string | null;
  municipality?: string | null;
  zip_code?: string | null;
  department: string;
  year_level?: string | null;
  track_or_course?: string | null;
  section?: string | null;
  enrollment_status?: string;
  created_at?: string;
  updated_at?: string;
}
export interface StudentsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  user_id?: string | null;
  student_no?: string;
  lrn?: string | null;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  gender?: string | null;
  civil_status?: string | null;
  religion?: string | null;
  nationality?: string | null;
  birthday?: string | null;
  birthplace?: string | null;
  email?: string | null;
  contact_no?: string | null;
  address?: string | null;
  province?: string | null;
  municipality?: string | null;
  zip_code?: string | null;
  department?: string;
  year_level?: string | null;
  track_or_course?: string | null;
  section?: string | null;
  enrollment_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentRegistrarProfilesRow {
  id: string;
  student_id: string;
  lrn: string | null;
  name_extension: string | null;
  student_status: string | null;
  academic_stage: string | null;
  strand: string | null;
  esc_qvr_no: string | null;
  voucher_status: string | null;
  admission_slip_status: string | null;
  import_enrollment_marker: string | null;
  preferred_mode_of_payment: string | null;
  comments_inquiries: string | null;
  confirmation_status: string | null;
  discount_description: string | null;
  discount_amount: number | null;
  reservation_amount: number | null;
  accounting_mode_of_payment: string | null;
  accounting_or_date: string | null;
  accounting_or_number: string | null;
  assessed_by: string | null;
  previous_school: string | null;
  referral_source: string | null;
  source_import_batch_id: string | null;
  source_sheet_row: number | null;
  created_at: string;
  updated_at: string;
}
export interface StudentRegistrarProfilesInsert {
  id?: string;
  student_id: string;
  lrn?: string | null;
  name_extension?: string | null;
  student_status?: string | null;
  academic_stage?: string | null;
  strand?: string | null;
  esc_qvr_no?: string | null;
  voucher_status?: string | null;
  admission_slip_status?: string | null;
  import_enrollment_marker?: string | null;
  preferred_mode_of_payment?: string | null;
  comments_inquiries?: string | null;
  confirmation_status?: string | null;
  discount_description?: string | null;
  discount_amount?: number | null;
  reservation_amount?: number | null;
  accounting_mode_of_payment?: string | null;
  accounting_or_date?: string | null;
  accounting_or_number?: string | null;
  assessed_by?: string | null;
  previous_school?: string | null;
  referral_source?: string | null;
  source_import_batch_id?: string | null;
  source_sheet_row?: number | null;
  created_at?: string;
  updated_at?: string;
}
export interface StudentRegistrarProfilesUpdate {
  id?: string;
  student_id?: string;
  lrn?: string | null;
  name_extension?: string | null;
  student_status?: string | null;
  academic_stage?: string | null;
  strand?: string | null;
  esc_qvr_no?: string | null;
  voucher_status?: string | null;
  admission_slip_status?: string | null;
  import_enrollment_marker?: string | null;
  preferred_mode_of_payment?: string | null;
  comments_inquiries?: string | null;
  confirmation_status?: string | null;
  discount_description?: string | null;
  discount_amount?: number | null;
  reservation_amount?: number | null;
  accounting_mode_of_payment?: string | null;
  accounting_or_date?: string | null;
  accounting_or_number?: string | null;
  assessed_by?: string | null;
  previous_school?: string | null;
  referral_source?: string | null;
  source_import_batch_id?: string | null;
  source_sheet_row?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegistrarImportBatchesRow {
  id: string;
  school_id: string | null;
  school_year: string;
  academic_unit: string;
  import_type: string;
  source_file_name: string;
  source_sheet_name: string;
  header_row: number;
  data_start_row: number;
  status: string;
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  error_rows: number;
  duplicate_rows: number;
  uploaded_by: string | null;
  uploaded_at: string;
  committed_by: string | null;
  committed_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface RegistrarImportBatchesInsert {
  id?: string;
  school_id?: string | null;
  school_year: string;
  academic_unit?: string;
  import_type?: string;
  source_file_name: string;
  source_sheet_name?: string;
  header_row?: number;
  data_start_row?: number;
  status?: string;
  total_rows?: number;
  valid_rows?: number;
  warning_rows?: number;
  error_rows?: number;
  duplicate_rows?: number;
  uploaded_by?: string | null;
  uploaded_at?: string;
  committed_by?: string | null;
  committed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface RegistrarImportBatchesUpdate {
  id?: string;
  school_id?: string | null;
  school_year?: string;
  academic_unit?: string;
  import_type?: string;
  source_file_name?: string;
  source_sheet_name?: string;
  header_row?: number;
  data_start_row?: number;
  status?: string;
  total_rows?: number;
  valid_rows?: number;
  warning_rows?: number;
  error_rows?: number;
  duplicate_rows?: number;
  uploaded_by?: string | null;
  uploaded_at?: string;
  committed_by?: string | null;
  committed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegistrarImportRowsRow {
  id: string;
  batch_id: string;
  sheet_row_number: number;
  row_hash: string | null;
  raw_data: Json;
  normalized_data: Json;
  validation_errors: Json;
  validation_warnings: Json;
  import_status: string;
  matched_student_id: string | null;
  committed_student_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface RegistrarImportRowsInsert {
  id?: string;
  batch_id: string;
  sheet_row_number: number;
  row_hash?: string | null;
  raw_data?: Json;
  normalized_data?: Json;
  validation_errors?: Json;
  validation_warnings?: Json;
  import_status?: string;
  matched_student_id?: string | null;
  committed_student_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface RegistrarImportRowsUpdate {
  id?: string;
  batch_id?: string;
  sheet_row_number?: number;
  row_hash?: string | null;
  raw_data?: Json;
  normalized_data?: Json;
  validation_errors?: Json;
  validation_warnings?: Json;
  import_status?: string;
  matched_student_id?: string | null;
  committed_student_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeesRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  position: string | null;
  position_title: string | null;
  department: string | null;
  salary: number;
  status: string;
  leave_balance: number;
  contact: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}
export interface EmployeesInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  email: string;
  position?: string | null;
  position_title?: string | null;
  department?: string | null;
  salary?: number;
  status?: string;
  leave_balance?: number;
  contact?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface EmployeesUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  email?: string;
  position?: string | null;
  position_title?: string | null;
  department?: string | null;
  salary?: number;
  status?: string;
  leave_balance?: number;
  contact?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumsRow {
  id: string;
  legacy_id: string | null;
  course_code_or_strand: string;
  name: string;
  created_at: string;
  updated_at: string;
}
export interface CurriculumsInsert {
  id?: string;
  legacy_id?: string | null;
  course_code_or_strand: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}
export interface CurriculumsUpdate {
  id?: string;
  legacy_id?: string | null;
  course_code_or_strand?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumSubjectsRow {
  id: string;
  curriculum_id: string;
  subject_id: string;
  year_level: string;
  semester: string;
  created_at: string;
}
export interface CurriculumSubjectsInsert {
  id?: string;
  curriculum_id: string;
  subject_id: string;
  year_level: string;
  semester: string;
  created_at?: string;
}
export interface CurriculumSubjectsUpdate {
  id?: string;
  curriculum_id?: string;
  subject_id?: string;
  year_level?: string;
  semester?: string;
  created_at?: string;
}

export interface SectionsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  code: string;
  name: string;
  department: string;
  year_level: string | null;
  strand_or_track: string | null;
  adviser_id: string | null;
  capacity: number;
  current_count: number;
  academic_year: string | null;
  semester: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface SectionsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  code: string;
  name: string;
  department: string;
  year_level?: string | null;
  strand_or_track?: string | null;
  adviser_id?: string | null;
  capacity?: number;
  current_count?: number;
  academic_year?: string | null;
  semester?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface SectionsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  code?: string;
  name?: string;
  department?: string;
  year_level?: string | null;
  strand_or_track?: string | null;
  adviser_id?: string | null;
  capacity?: number;
  current_count?: number;
  academic_year?: string | null;
  semester?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SectionStudentsRow {
  id: string;
  section_id: string;
  student_id: string;
  created_at: string;
}
export interface SectionStudentsInsert {
  id?: string;
  section_id: string;
  student_id: string;
  created_at?: string;
}
export interface SectionStudentsUpdate {
  id?: string;
  section_id?: string;
  student_id?: string;
  created_at?: string;
}

export interface RoomsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  code: string;
  name: string;
  building: string | null;
  floor: string | null;
  capacity: number;
  type: string;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface RoomsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  code: string;
  name: string;
  building?: string | null;
  floor?: string | null;
  capacity?: number;
  type?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
export interface RoomsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  code?: string;
  name?: string;
  building?: string | null;
  floor?: string | null;
  capacity?: number;
  type?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClassSchedulesRow {
  id: string;
  legacy_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  section: string | null;
  room_name: string | null;
  day: string;
  start_time: string | null;
  end_time: string | null;
  school_year: string | null;
  semester: string | null;
  is_active: boolean;
  department: string;
  year_level: string | null;
  course_or_track: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface ClassSchedulesInsert {
  id?: string;
  legacy_id?: string | null;
  subject_id?: string | null;
  teacher_id?: string | null;
  section?: string | null;
  room_name?: string | null;
  day: string;
  start_time?: string | null;
  end_time?: string | null;
  school_year?: string | null;
  semester?: string | null;
  is_active?: boolean;
  department: string;
  year_level?: string | null;
  course_or_track?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface ClassSchedulesUpdate {
  id?: string;
  legacy_id?: string | null;
  subject_id?: string | null;
  teacher_id?: string | null;
  section?: string | null;
  room_name?: string | null;
  day?: string;
  start_time?: string | null;
  end_time?: string | null;
  school_year?: string | null;
  semester?: string | null;
  is_active?: boolean;
  department?: string;
  year_level?: string | null;
  course_or_track?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SchedulesRow {
  id: string;
  legacy_id: string | null;
  subject_code: string | null;
  subject_name: string | null;
  teacher_name: string | null;
  section: string | null;
  day: string | null;
  time: string | null;
  room: string | null;
  created_at: string;
  updated_at: string;
}
export interface SchedulesInsert {
  id?: string;
  legacy_id?: string | null;
  subject_code?: string | null;
  subject_name?: string | null;
  teacher_name?: string | null;
  section?: string | null;
  day?: string | null;
  time?: string | null;
  room?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface SchedulesUpdate {
  id?: string;
  legacy_id?: string | null;
  subject_code?: string | null;
  subject_name?: string | null;
  teacher_name?: string | null;
  section?: string | null;
  day?: string | null;
  time?: string | null;
  room?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RequirementsRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  name: string;
  status: string;
  submitted_date: string | null;
  remarks: string | null;
  upload_status: string | null;
  upload_file_name: string | null;
  upload_date: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  hardcopy_submitted: boolean;
  hardcopy_submitted_date: string | null;
  created_at: string;
  updated_at: string;
}
export interface RequirementsInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  name: string;
  status?: string;
  submitted_date?: string | null;
  remarks?: string | null;
  upload_status?: string | null;
  upload_file_name?: string | null;
  upload_date?: string | null;
  verification_status?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  hardcopy_submitted?: boolean;
  hardcopy_submitted_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface RequirementsUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  name?: string;
  status?: string;
  submitted_date?: string | null;
  remarks?: string | null;
  upload_status?: string | null;
  upload_file_name?: string | null;
  upload_date?: string | null;
  verification_status?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  hardcopy_submitted?: boolean;
  hardcopy_submitted_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BookPackagesRow {
  id: string;
  legacy_id: string | null;
  package_name: string;
  grade_level: string | null;
  school_id: string | null;
  academic_unit: string | null;
  school_year: string | null;
  total_amount: number;
  is_required: boolean;
  status: string;
  last_updated: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface BookPackagesInsert {
  id?: string;
  legacy_id?: string | null;
  package_name: string;
  grade_level?: string | null;
  school_id?: string | null;
  academic_unit?: string | null;
  school_year?: string | null;
  total_amount?: number;
  is_required?: boolean;
  status?: string;
  last_updated?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface BookPackagesUpdate {
  id?: string;
  legacy_id?: string | null;
  package_name?: string;
  grade_level?: string | null;
  school_id?: string | null;
  academic_unit?: string | null;
  school_year?: string | null;
  total_amount?: number;
  is_required?: boolean;
  status?: string;
  last_updated?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BookPackageItemsRow {
  id: string;
  legacy_id: string | null;
  book_package_id: string;
  title: string;
  subject_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
}
export interface BookPackageItemsInsert {
  id?: string;
  legacy_id?: string | null;
  book_package_id: string;
  title: string;
  subject_id?: string | null;
  quantity?: number;
  unit_price?: number;
  created_at?: string;
}
export interface BookPackageItemsUpdate {
  id?: string;
  legacy_id?: string | null;
  book_package_id?: string;
  title?: string;
  subject_id?: string | null;
  quantity?: number;
  unit_price?: number;
  created_at?: string;
}

export interface AssessmentsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  student_id: string;
  school_year: string;
  semester: string | null;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  scholarship_name: string | null;
  payment_term: string | null;
  balance: number;
  is_paid: boolean;
  financial_hold_status: string | null;
  last_payment_date: string | null;
  books_availed: boolean;
  book_package_id: string | null;
  approval_status: string | null;
  submitted_by: string | null;
  submitted_date: string | null;
  registrar_remarks: string | null;
  accounting_remarks: string | null;
  approved_by: string | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
}
export interface AssessmentsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  student_id: string;
  school_year: string;
  semester?: string | null;
  total_amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  scholarship_name?: string | null;
  payment_term?: string | null;
  balance?: number;
  is_paid?: boolean;
  financial_hold_status?: string | null;
  last_payment_date?: string | null;
  books_availed?: boolean;
  book_package_id?: string | null;
  approval_status?: string | null;
  submitted_by?: string | null;
  submitted_date?: string | null;
  registrar_remarks?: string | null;
  accounting_remarks?: string | null;
  approved_by?: string | null;
  approved_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface AssessmentsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  student_id?: string;
  school_year?: string;
  semester?: string | null;
  total_amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  scholarship_name?: string | null;
  payment_term?: string | null;
  balance?: number;
  is_paid?: boolean;
  financial_hold_status?: string | null;
  last_payment_date?: string | null;
  books_availed?: boolean;
  book_package_id?: string | null;
  approval_status?: string | null;
  submitted_by?: string | null;
  submitted_date?: string | null;
  registrar_remarks?: string | null;
  accounting_remarks?: string | null;
  approved_by?: string | null;
  approved_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentFeesRow {
  id: string;
  assessment_id: string;
  fee_name: string;
  category: string;
  amount: number;
  created_at: string;
}
export interface AssessmentFeesInsert {
  id?: string;
  assessment_id: string;
  fee_name: string;
  category: string;
  amount?: number;
  created_at?: string;
}
export interface AssessmentFeesUpdate {
  id?: string;
  assessment_id?: string;
  fee_name?: string;
  category?: string;
  amount?: number;
  created_at?: string;
}

export interface AssessmentAuditTrailRow {
  id: string;
  legacy_id: string | null;
  assessment_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  details: string | null;
  created_at: string;
}
export interface AssessmentAuditTrailInsert {
  id?: string;
  legacy_id?: string | null;
  assessment_id: string;
  action: string;
  performed_by?: string | null;
  performed_at?: string;
  details?: string | null;
  created_at?: string;
}
export interface AssessmentAuditTrailUpdate {
  id?: string;
  legacy_id?: string | null;
  assessment_id?: string;
  action?: string;
  performed_by?: string | null;
  performed_at?: string;
  details?: string | null;
  created_at?: string;
}

export interface EnrollmentsRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  school_year: string;
  semester: string | null;
  enrollment_type: string | null;
  status: string;
  submitted_at: string;
  assessment_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface EnrollmentsInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  school_year: string;
  semester?: string | null;
  enrollment_type?: string | null;
  status?: string;
  submitted_at?: string;
  assessment_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface EnrollmentsUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  school_year?: string;
  semester?: string | null;
  enrollment_type?: string | null;
  status?: string;
  submitted_at?: string;
  assessment_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EnrollmentSubjectsRow {
  id: string;
  enrollment_id: string;
  subject_id: string;
  created_at: string;
}
export interface EnrollmentSubjectsInsert {
  id?: string;
  enrollment_id: string;
  subject_id: string;
  created_at?: string;
}
export interface EnrollmentSubjectsUpdate {
  id?: string;
  enrollment_id?: string;
  subject_id?: string;
  created_at?: string;
}

export interface PaymentsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  student_id: string;
  assessment_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  or_number: string | null;
  term: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}
export interface PaymentsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  student_id: string;
  assessment_id?: string | null;
  amount?: number;
  payment_date?: string;
  payment_method?: string | null;
  or_number?: string | null;
  term?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface PaymentsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  student_id?: string;
  assessment_id?: string | null;
  amount?: number;
  payment_date?: string;
  payment_method?: string | null;
  or_number?: string | null;
  term?: string | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountTypesRow {
  id: string;
  legacy_id: string | null;
  code: string;
  name: string;
  discount_percent: number;
  discount_source: string | null;
  requires_approval: boolean;
  max_beneficiaries: number | null;
  description: string | null;
  is_active: boolean;
  effective_school_year: string | null;
  applicable_academic_unit: string | null;
  applies_to: string | null;
  discount_basis: string | null;
  discount_fixed_amount: number | null;
  is_stackable: boolean;
  requires_document: boolean;
  max_amount: number | null;
  gl_code: string | null;
  created_at: string;
  updated_at: string;
}
export interface DiscountTypesInsert {
  id?: string;
  legacy_id?: string | null;
  code: string;
  name: string;
  discount_percent?: number;
  discount_source?: string | null;
  requires_approval?: boolean;
  max_beneficiaries?: number | null;
  description?: string | null;
  is_active?: boolean;
  effective_school_year?: string | null;
  applicable_academic_unit?: string | null;
  applies_to?: string | null;
  discount_basis?: string | null;
  discount_fixed_amount?: number | null;
  is_stackable?: boolean;
  requires_document?: boolean;
  max_amount?: number | null;
  gl_code?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface DiscountTypesUpdate {
  id?: string;
  legacy_id?: string | null;
  code?: string;
  name?: string;
  discount_percent?: number;
  discount_source?: string | null;
  requires_approval?: boolean;
  max_beneficiaries?: number | null;
  description?: string | null;
  is_active?: boolean;
  effective_school_year?: string | null;
  applicable_academic_unit?: string | null;
  applies_to?: string | null;
  discount_basis?: string | null;
  discount_fixed_amount?: number | null;
  is_stackable?: boolean;
  requires_document?: boolean;
  max_amount?: number | null;
  gl_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountRequestsRow {
  id: string;
  legacy_id: string | null;
  reference_no: string;
  student_id: string;
  discount_type_id: string | null;
  requested_by: string | null;
  requested_at: string;
  status: string;
  sibling_student_ids: string[];
  sibling_names: string[];
  level1_status: string | null;
  level1_approved_by: string | null;
  level1_approved_at: string | null;
  level2_status: string | null;
  level2_approved_by: string | null;
  level2_approved_at: string | null;
  remarks: string | null;
  attachment_names: string[];
  created_at: string;
  updated_at: string;
}
export interface DiscountRequestsInsert {
  id?: string;
  legacy_id?: string | null;
  reference_no: string;
  student_id: string;
  discount_type_id?: string | null;
  requested_by?: string | null;
  requested_at?: string;
  status?: string;
  sibling_student_ids?: string[];
  sibling_names?: string[];
  level1_status?: string | null;
  level1_approved_by?: string | null;
  level1_approved_at?: string | null;
  level2_status?: string | null;
  level2_approved_by?: string | null;
  level2_approved_at?: string | null;
  remarks?: string | null;
  attachment_names?: string[];
  created_at?: string;
  updated_at?: string;
}
export interface DiscountRequestsUpdate {
  id?: string;
  legacy_id?: string | null;
  reference_no?: string;
  student_id?: string;
  discount_type_id?: string | null;
  requested_by?: string | null;
  requested_at?: string;
  status?: string;
  sibling_student_ids?: string[];
  sibling_names?: string[];
  level1_status?: string | null;
  level1_approved_by?: string | null;
  level1_approved_at?: string | null;
  level2_status?: string | null;
  level2_approved_by?: string | null;
  level2_approved_at?: string | null;
  remarks?: string | null;
  attachment_names?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DiscountRequestAuditTrailRow {
  id: string;
  legacy_id: string | null;
  discount_request_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  details: string | null;
  created_at: string;
}
export interface DiscountRequestAuditTrailInsert {
  id?: string;
  legacy_id?: string | null;
  discount_request_id: string;
  action: string;
  performed_by?: string | null;
  performed_at?: string;
  details?: string | null;
  created_at?: string;
}
export interface DiscountRequestAuditTrailUpdate {
  id?: string;
  legacy_id?: string | null;
  discount_request_id?: string;
  action?: string;
  performed_by?: string | null;
  performed_at?: string;
  details?: string | null;
  created_at?: string;
}

export interface StudentLedgerSummariesRow {
  id: string;
  student_id: string;
  school_year: string;
  total_assessed: number;
  total_paid: number;
  discount_applied: number;
  balance: number;
  financial_hold_status: string | null;
  clearance_status: string | null;
  last_payment_date: string | null;
  created_at: string;
  updated_at: string;
}
export interface StudentLedgerSummariesInsert {
  id?: string;
  student_id: string;
  school_year: string;
  total_assessed?: number;
  total_paid?: number;
  discount_applied?: number;
  balance?: number;
  financial_hold_status?: string | null;
  clearance_status?: string | null;
  last_payment_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface StudentLedgerSummariesUpdate {
  id?: string;
  student_id?: string;
  school_year?: string;
  total_assessed?: number;
  total_paid?: number;
  discount_applied?: number;
  balance?: number;
  financial_hold_status?: string | null;
  clearance_status?: string | null;
  last_payment_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerTransactionsRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  date: string;
  description: string | null;
  type: string | null;
  debit: number;
  credit: number;
  balance: number;
  reference: string | null;
  created_at: string;
}
export interface LedgerTransactionsInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  date: string;
  description?: string | null;
  type?: string | null;
  debit?: number;
  credit?: number;
  balance?: number;
  reference?: string | null;
  created_at?: string;
}
export interface LedgerTransactionsUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  date?: string;
  description?: string | null;
  type?: string | null;
  debit?: number;
  credit?: number;
  balance?: number;
  reference?: string | null;
  created_at?: string;
}

export interface FinancialHoldsRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  hold_type: string | null;
  hold_category: string | null;
  reason: string | null;
  balance_amount: number;
  created_by: string | null;
  status: string;
  cleared_by: string | null;
  cleared_at: string | null;
  clearance_remarks: string | null;
  created_at: string;
  updated_at: string;
}
export interface FinancialHoldsInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  hold_type?: string | null;
  hold_category?: string | null;
  reason?: string | null;
  balance_amount?: number;
  created_by?: string | null;
  status?: string;
  cleared_by?: string | null;
  cleared_at?: string | null;
  clearance_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface FinancialHoldsUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  hold_type?: string | null;
  hold_category?: string | null;
  reason?: string | null;
  balance_amount?: number;
  created_by?: string | null;
  status?: string;
  cleared_by?: string | null;
  cleared_at?: string | null;
  clearance_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentBillingSummariesRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  school_year: string | null;
  semester: string | null;
  academic_unit: string | null;
  fee_template_name: string | null;
  total_assessment: number;
  amount_due: number;
  balance: number;
  status: string | null;
  created_at: string;
  updated_at: string;
}
export interface AssessmentBillingSummariesInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  school_year?: string | null;
  semester?: string | null;
  academic_unit?: string | null;
  fee_template_name?: string | null;
  total_assessment?: number;
  amount_due?: number;
  balance?: number;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface AssessmentBillingSummariesUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  school_year?: string | null;
  semester?: string | null;
  academic_unit?: string | null;
  fee_template_name?: string | null;
  total_assessment?: number;
  amount_due?: number;
  balance?: number;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentCollectionSummariesRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  amount: number;
  payment_method: string | null;
  reference_no: string | null;
  payment_date: string;
  cashier: string | null;
  term: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}
export interface PaymentCollectionSummariesInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  amount?: number;
  payment_method?: string | null;
  reference_no?: string | null;
  payment_date?: string;
  cashier?: string | null;
  term?: string | null;
  verification_status?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface PaymentCollectionSummariesUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  amount?: number;
  payment_method?: string | null;
  reference_no?: string | null;
  payment_date?: string;
  cashier?: string | null;
  term?: string | null;
  verification_status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromissoryNotesRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  amount: number;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface PromissoryNotesInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  amount?: number;
  due_date?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
export interface PromissoryNotesUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  amount?: number;
  due_date?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectClassLoadsRow {
  id: string;
  legacy_id: string | null;
  teacher_id: string;
  subject_id: string | null;
  section_id: string | null;
  department: string;
  school_year: string | null;
  semester: string | null;
  created_at: string;
  updated_at: string;
}
export interface SubjectClassLoadsInsert {
  id?: string;
  legacy_id?: string | null;
  teacher_id: string;
  subject_id?: string | null;
  section_id?: string | null;
  department: string;
  school_year?: string | null;
  semester?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface SubjectClassLoadsUpdate {
  id?: string;
  legacy_id?: string | null;
  teacher_id?: string;
  subject_id?: string | null;
  section_id?: string | null;
  department?: string;
  school_year?: string | null;
  semester?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClassLoadStudentsRow {
  id: string;
  class_load_id: string;
  student_id: string;
  created_at: string;
}
export interface ClassLoadStudentsInsert {
  id?: string;
  class_load_id: string;
  student_id: string;
  created_at?: string;
}
export interface ClassLoadStudentsUpdate {
  id?: string;
  class_load_id?: string;
  student_id?: string;
  created_at?: string;
}

export interface GradePeriodsRow {
  id: string;
  legacy_id: string | null;
  label: string;
  subject_id: string | null;
  section_id: string | null;
  school_year: string | null;
  teacher_id: string | null;
  is_finalized: boolean;
  finalized_at: string | null;
  finalized_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface GradePeriodsInsert {
  id?: string;
  legacy_id?: string | null;
  label: string;
  subject_id?: string | null;
  section_id?: string | null;
  school_year?: string | null;
  teacher_id?: string | null;
  is_finalized?: boolean;
  finalized_at?: string | null;
  finalized_by?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface GradePeriodsUpdate {
  id?: string;
  legacy_id?: string | null;
  label?: string;
  subject_id?: string | null;
  section_id?: string | null;
  school_year?: string | null;
  teacher_id?: string | null;
  is_finalized?: boolean;
  finalized_at?: string | null;
  finalized_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GradeCategoriesRow {
  id: string;
  grade_period_id: string;
  name: string;
  weight: number;
  created_at: string;
}
export interface GradeCategoriesInsert {
  id?: string;
  grade_period_id: string;
  name: string;
  weight?: number;
  created_at?: string;
}
export interface GradeCategoriesUpdate {
  id?: string;
  grade_period_id?: string;
  name?: string;
  weight?: number;
  created_at?: string;
}

export interface GradeItemsRow {
  id: string;
  legacy_id: string | null;
  grade_period_id: string;
  label: string;
  category: string;
  max_score: number;
  sort_order: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
export interface GradeItemsInsert {
  id?: string;
  legacy_id?: string | null;
  grade_period_id: string;
  label: string;
  category: string;
  max_score?: number;
  sort_order?: number;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface GradeItemsUpdate {
  id?: string;
  legacy_id?: string | null;
  grade_period_id?: string;
  label?: string;
  category?: string;
  max_score?: number;
  sort_order?: number;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentGradeEntriesRow {
  id: string;
  legacy_id: string | null;
  grade_period_id: string;
  student_id: string;
  grade_item_id: string;
  score: number | null;
  created_at: string;
  updated_at: string;
}
export interface StudentGradeEntriesInsert {
  id?: string;
  legacy_id?: string | null;
  grade_period_id: string;
  student_id: string;
  grade_item_id: string;
  score?: number | null;
  created_at?: string;
  updated_at?: string;
}
export interface StudentGradeEntriesUpdate {
  id?: string;
  legacy_id?: string | null;
  grade_period_id?: string;
  student_id?: string;
  grade_item_id?: string;
  score?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface GradesRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  school_year: string | null;
  semester: string | null;
  midterm_grade: number | null;
  final_grade: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}
export interface GradesInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  subject_id?: string | null;
  teacher_id?: string | null;
  school_year?: string | null;
  semester?: string | null;
  midterm_grade?: number | null;
  final_grade?: number | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface GradesUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  subject_id?: string | null;
  teacher_id?: string | null;
  school_year?: string | null;
  semester?: string | null;
  midterm_grade?: number | null;
  final_grade?: number | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementsRow {
  id: string;
  legacy_id: string | null;
  title: string;
  content: string | null;
  date: string;
  category: string | null;
  author: string | null;
  created_at: string;
  updated_at: string;
}
export interface AnnouncementsInsert {
  id?: string;
  legacy_id?: string | null;
  title: string;
  content?: string | null;
  date?: string;
  category?: string | null;
  author?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface AnnouncementsUpdate {
  id?: string;
  legacy_id?: string | null;
  title?: string;
  content?: string | null;
  date?: string;
  category?: string | null;
  author?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolEventsRow {
  id: string;
  legacy_id: string | null;
  title: string;
  description: string | null;
  date: string;
  department: string | null;
  created_at: string;
  updated_at: string;
}
export interface SchoolEventsInsert {
  id?: string;
  legacy_id?: string | null;
  title: string;
  description?: string | null;
  date: string;
  department?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface SchoolEventsUpdate {
  id?: string;
  legacy_id?: string | null;
  title?: string;
  description?: string | null;
  date?: string;
  department?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LearningMaterialsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  title: string;
  description: string | null;
  subject_id: string | null;
  section: string | null;
  teacher_id: string | null;
  learning_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  publish_status: string;
  upload_date: string;
  department: string | null;
  year_level: string | null;
  track_or_course: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
export interface LearningMaterialsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  title: string;
  description?: string | null;
  subject_id?: string | null;
  section?: string | null;
  teacher_id?: string | null;
  learning_type: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  publish_status?: string;
  upload_date?: string;
  department?: string | null;
  year_level?: string | null;
  track_or_course?: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}
export interface LearningMaterialsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  title?: string;
  description?: string | null;
  subject_id?: string | null;
  section?: string | null;
  teacher_id?: string | null;
  learning_type?: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  publish_status?: string;
  upload_date?: string;
  department?: string | null;
  year_level?: string | null;
  track_or_course?: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLogsRow {
  id: string;
  legacy_id: string | null;
  actor_name: string | null;
  action: string;
  subject_label: string | null;
  activity_type: string | null;
  occurred_at: string;
  created_at: string;
}
export interface ActivityLogsInsert {
  id?: string;
  legacy_id?: string | null;
  actor_name?: string | null;
  action: string;
  subject_label?: string | null;
  activity_type?: string | null;
  occurred_at?: string;
  created_at?: string;
}
export interface ActivityLogsUpdate {
  id?: string;
  legacy_id?: string | null;
  actor_name?: string | null;
  action?: string;
  subject_label?: string | null;
  activity_type?: string | null;
  occurred_at?: string;
  created_at?: string;
}

export interface EnrollmentHistoryStatsRow {
  id: string;
  school_year: string;
  school_id: string;
  student_count: number;
  created_at: string;
  updated_at: string;
}
export interface EnrollmentHistoryStatsInsert {
  id?: string;
  school_year: string;
  school_id: string;
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}
export interface EnrollmentHistoryStatsUpdate {
  id?: string;
  school_year?: string;
  school_id?: string;
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollRow {
  id: string;
  legacy_id: string | null;
  employee_id: string | null;
  employee_name: string | null;
  position: string | null;
  basic_salary: number;
  allowances: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  tax_deduction: number;
  net_pay: number;
  period: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface PayrollInsert {
  id?: string;
  legacy_id?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  position?: string | null;
  basic_salary?: number;
  allowances?: number;
  sss_deduction?: number;
  philhealth_deduction?: number;
  pagibig_deduction?: number;
  tax_deduction?: number;
  net_pay?: number;
  period?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
export interface PayrollUpdate {
  id?: string;
  legacy_id?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  position?: string | null;
  basic_salary?: number;
  allowances?: number;
  sss_deduction?: number;
  philhealth_deduction?: number;
  pagibig_deduction?: number;
  tax_deduction?: number;
  net_pay?: number;
  period?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      schools: { Row: SchoolsRow; Insert: SchoolsInsert; Update: SchoolsUpdate };
      setup_items: { Row: SetupItemsRow; Insert: SetupItemsInsert; Update: SetupItemsUpdate };
      users: { Row: UsersRow; Insert: UsersInsert; Update: UsersUpdate };
      courses: { Row: CoursesRow; Insert: CoursesInsert; Update: CoursesUpdate };
      subjects: { Row: SubjectsRow; Insert: SubjectsInsert; Update: SubjectsUpdate };
      teachers: { Row: TeachersRow; Insert: TeachersInsert; Update: TeachersUpdate };
      students: { Row: StudentsRow; Insert: StudentsInsert; Update: StudentsUpdate };
      student_registrar_profiles: { Row: StudentRegistrarProfilesRow; Insert: StudentRegistrarProfilesInsert; Update: StudentRegistrarProfilesUpdate };
      registrar_import_batches: { Row: RegistrarImportBatchesRow; Insert: RegistrarImportBatchesInsert; Update: RegistrarImportBatchesUpdate };
      registrar_import_rows: { Row: RegistrarImportRowsRow; Insert: RegistrarImportRowsInsert; Update: RegistrarImportRowsUpdate };
      employees: { Row: EmployeesRow; Insert: EmployeesInsert; Update: EmployeesUpdate };
      curriculums: { Row: CurriculumsRow; Insert: CurriculumsInsert; Update: CurriculumsUpdate };
      curriculum_subjects: { Row: CurriculumSubjectsRow; Insert: CurriculumSubjectsInsert; Update: CurriculumSubjectsUpdate };
      sections: { Row: SectionsRow; Insert: SectionsInsert; Update: SectionsUpdate };
      section_students: { Row: SectionStudentsRow; Insert: SectionStudentsInsert; Update: SectionStudentsUpdate };
      rooms: { Row: RoomsRow; Insert: RoomsInsert; Update: RoomsUpdate };
      class_schedules: { Row: ClassSchedulesRow; Insert: ClassSchedulesInsert; Update: ClassSchedulesUpdate };
      schedules: { Row: SchedulesRow; Insert: SchedulesInsert; Update: SchedulesUpdate };
      requirements: { Row: RequirementsRow; Insert: RequirementsInsert; Update: RequirementsUpdate };
      book_packages: { Row: BookPackagesRow; Insert: BookPackagesInsert; Update: BookPackagesUpdate };
      book_package_items: { Row: BookPackageItemsRow; Insert: BookPackageItemsInsert; Update: BookPackageItemsUpdate };
      assessments: { Row: AssessmentsRow; Insert: AssessmentsInsert; Update: AssessmentsUpdate };
      assessment_fees: { Row: AssessmentFeesRow; Insert: AssessmentFeesInsert; Update: AssessmentFeesUpdate };
      assessment_audit_trail: { Row: AssessmentAuditTrailRow; Insert: AssessmentAuditTrailInsert; Update: AssessmentAuditTrailUpdate };
      enrollments: { Row: EnrollmentsRow; Insert: EnrollmentsInsert; Update: EnrollmentsUpdate };
      enrollment_subjects: { Row: EnrollmentSubjectsRow; Insert: EnrollmentSubjectsInsert; Update: EnrollmentSubjectsUpdate };
      payments: { Row: PaymentsRow; Insert: PaymentsInsert; Update: PaymentsUpdate };
      discount_types: { Row: DiscountTypesRow; Insert: DiscountTypesInsert; Update: DiscountTypesUpdate };
      discount_requests: { Row: DiscountRequestsRow; Insert: DiscountRequestsInsert; Update: DiscountRequestsUpdate };
      discount_request_audit_trail: { Row: DiscountRequestAuditTrailRow; Insert: DiscountRequestAuditTrailInsert; Update: DiscountRequestAuditTrailUpdate };
      student_ledger_summaries: { Row: StudentLedgerSummariesRow; Insert: StudentLedgerSummariesInsert; Update: StudentLedgerSummariesUpdate };
      ledger_transactions: { Row: LedgerTransactionsRow; Insert: LedgerTransactionsInsert; Update: LedgerTransactionsUpdate };
      financial_holds: { Row: FinancialHoldsRow; Insert: FinancialHoldsInsert; Update: FinancialHoldsUpdate };
      assessment_billing_summaries: { Row: AssessmentBillingSummariesRow; Insert: AssessmentBillingSummariesInsert; Update: AssessmentBillingSummariesUpdate };
      payment_collection_summaries: { Row: PaymentCollectionSummariesRow; Insert: PaymentCollectionSummariesInsert; Update: PaymentCollectionSummariesUpdate };
      promissory_notes: { Row: PromissoryNotesRow; Insert: PromissoryNotesInsert; Update: PromissoryNotesUpdate };
      subject_class_loads: { Row: SubjectClassLoadsRow; Insert: SubjectClassLoadsInsert; Update: SubjectClassLoadsUpdate };
      class_load_students: { Row: ClassLoadStudentsRow; Insert: ClassLoadStudentsInsert; Update: ClassLoadStudentsUpdate };
      grade_periods: { Row: GradePeriodsRow; Insert: GradePeriodsInsert; Update: GradePeriodsUpdate };
      grade_categories: { Row: GradeCategoriesRow; Insert: GradeCategoriesInsert; Update: GradeCategoriesUpdate };
      grade_items: { Row: GradeItemsRow; Insert: GradeItemsInsert; Update: GradeItemsUpdate };
      student_grade_entries: { Row: StudentGradeEntriesRow; Insert: StudentGradeEntriesInsert; Update: StudentGradeEntriesUpdate };
      grades: { Row: GradesRow; Insert: GradesInsert; Update: GradesUpdate };
      announcements: { Row: AnnouncementsRow; Insert: AnnouncementsInsert; Update: AnnouncementsUpdate };
      school_events: { Row: SchoolEventsRow; Insert: SchoolEventsInsert; Update: SchoolEventsUpdate };
      learning_materials: { Row: LearningMaterialsRow; Insert: LearningMaterialsInsert; Update: LearningMaterialsUpdate };
      activity_logs: { Row: ActivityLogsRow; Insert: ActivityLogsInsert; Update: ActivityLogsUpdate };
      enrollment_history_stats: { Row: EnrollmentHistoryStatsRow; Insert: EnrollmentHistoryStatsInsert; Update: EnrollmentHistoryStatsUpdate };
      payroll: { Row: PayrollRow; Insert: PayrollInsert; Update: PayrollUpdate };
    };
  };
}
