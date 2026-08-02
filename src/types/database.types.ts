// Supabase schema reference, synchronized through migration 20260802090000.
// Regenerate from the applied Supabase project when the migration is deployed.

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
  auth_user_id: string | null;
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
  auth_user_id?: string | null;
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
  auth_user_id?: string | null;
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
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
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
  created_via: string;
  source_metadata: Json;
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
  created_via?: string;
  source_metadata?: Json;
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
  created_via?: string;
  source_metadata?: Json;
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
  adviser_employee_id: string | null;
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
  adviser_employee_id?: string | null;
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
  adviser_employee_id?: string | null;
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
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
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
  enrollment_id: string | null;
  approved_at: string | null;
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
  enrollment_id?: string | null;
  approved_at?: string | null;
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
  enrollment_id?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentFeesRow {
  id: string;
  assessment_id: string;
  invoice_id: string | null;
  fee_name: string;
  category: string;
  amount: number;
  quantity: number;
  unit_amount: number;
  revenue_account_code: string;
  created_at: string;
  fee_schedule_id: string | null;
  fee_schedule_rate_id: string | null;
  fee_item_id: string | null;
  fee_category_id: string | null;
}
export interface AssessmentFeesInsert {
  id?: string;
  assessment_id: string;
  invoice_id?: string | null;
  fee_name: string;
  category: string;
  amount?: number;
  quantity?: number;
  unit_amount?: number;
  revenue_account_code?: string;
  created_at?: string;
  fee_schedule_id?: string | null;
  fee_schedule_rate_id?: string | null;
  fee_item_id?: string | null;
  fee_category_id?: string | null;
}
export interface AssessmentFeesUpdate {
  id?: string;
  assessment_id?: string;
  fee_name?: string;
  category?: string;
  amount?: number;
  quantity?: number;
  unit_amount?: number;
  revenue_account_code?: string;
  created_at?: string;
  fee_schedule_id?: string | null;
  fee_schedule_rate_id?: string | null;
  fee_item_id?: string | null;
  fee_category_id?: string | null;
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
  enrollment_source: string;
  is_online_enrollment: boolean;
  online_application_id: string | null;
  completion_status: string;
  missing_fields: string[];
  source_metadata: Json;
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
  enrollment_source?: string;
  is_online_enrollment?: boolean;
  online_application_id?: string | null;
  completion_status?: string;
  missing_fields?: string[];
  source_metadata?: Json;
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
  enrollment_source?: string;
  is_online_enrollment?: boolean;
  online_application_id?: string | null;
  completion_status?: string;
  missing_fields?: string[];
  source_metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface OnlineEnrollmentApplicationsRow {
  id: string;
  reference_no: string;
  student_id: string | null;
  enrollment_id: string | null;
  school_id: string | null;
  enrollment_type: string;
  lrn: string | null;
  school_year: string;
  semester: string | null;
  grade_level_applying_for: string | null;
  strand_or_track: string | null;
  previous_school: string | null;
  previous_school_address: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  birth_date: string | null;
  gender: string | null;
  email: string | null;
  contact_no: string | null;
  complete_address: string | null;
  barangay: string | null;
  city_municipality: string | null;
  province: string | null;
  zip_code: string | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
  guardian_contact_no: string | null;
  guardian_email: string | null;
  guardian_address: string | null;
  status: string;
  completion_status: string;
  missing_fields: string[];
  payload: Json;
  submitted_from: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}
export interface OnlineEnrollmentApplicationsInsert {
  id?: string;
  reference_no?: string;
  student_id?: string | null;
  enrollment_id?: string | null;
  school_id?: string | null;
  enrollment_type: string;
  lrn?: string | null;
  school_year: string;
  semester?: string | null;
  grade_level_applying_for?: string | null;
  strand_or_track?: string | null;
  previous_school?: string | null;
  previous_school_address?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  email?: string | null;
  contact_no?: string | null;
  complete_address?: string | null;
  barangay?: string | null;
  city_municipality?: string | null;
  province?: string | null;
  zip_code?: string | null;
  guardian_name?: string | null;
  guardian_relationship?: string | null;
  guardian_contact_no?: string | null;
  guardian_email?: string | null;
  guardian_address?: string | null;
  status?: string;
  completion_status?: string;
  missing_fields?: string[];
  payload?: Json;
  submitted_from?: string;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}
export interface OnlineEnrollmentApplicationsUpdate {
  id?: string;
  reference_no?: string;
  student_id?: string | null;
  enrollment_id?: string | null;
  school_id?: string | null;
  enrollment_type?: string;
  lrn?: string | null;
  school_year?: string;
  semester?: string | null;
  grade_level_applying_for?: string | null;
  strand_or_track?: string | null;
  previous_school?: string | null;
  previous_school_address?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  email?: string | null;
  contact_no?: string | null;
  complete_address?: string | null;
  barangay?: string | null;
  city_municipality?: string | null;
  province?: string | null;
  zip_code?: string | null;
  guardian_name?: string | null;
  guardian_relationship?: string | null;
  guardian_contact_no?: string | null;
  guardian_email?: string | null;
  guardian_address?: string | null;
  status?: string;
  completion_status?: string;
  missing_fields?: string[];
  payload?: Json;
  submitted_from?: string;
  submitted_at?: string;
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
  transaction_type: string;
  payment_category: string | null;
  payment_method_id: string | null;
  collection_category_id: string | null;
  currency_code: string;
  status: string;
  posted_by: string | null;
  posted_at: string;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  idempotency_key: string | null;
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
  transaction_type?: string;
  payment_category?: string | null;
  payment_method_id?: string | null;
  collection_category_id?: string | null;
  currency_code?: string;
  status?: string;
  posted_by?: string | null;
  posted_at?: string;
  voided_by?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  idempotency_key?: string | null;
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
  transaction_type?: string;
  payment_category?: string | null;
  payment_method_id?: string | null;
  collection_category_id?: string | null;
  currency_code?: string;
  status?: string;
  posted_by?: string | null;
  posted_at?: string;
  voided_by?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  idempotency_key?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentVoidRequestsRow {
  id: string;
  payment_id: string;
  school_id: string | null;
  requested_by: string;
  requested_at: string;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_remarks: string | null;
  created_at: string;
  updated_at: string;
}
export interface PaymentVoidRequestsInsert {
  id?: string;
  payment_id: string;
  school_id?: string | null;
  requested_by: string;
  requested_at?: string;
  reason: string;
  status?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type PaymentVoidRequestsUpdate = Partial<PaymentVoidRequestsInsert>;

export interface StudentPaymentMethodsRow {
  id: string;
  code: string;
  name: string;
  cash_account_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface StudentPaymentMethodsInsert {
  id?: string;
  code: string;
  name: string;
  cash_account_code: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
export type StudentPaymentMethodsUpdate = Partial<StudentPaymentMethodsInsert>;

export interface StudentCollectionCategoriesRow {
  id: string;
  code: string;
  name: string;
  revenue_account_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface StudentCollectionCategoriesInsert {
  id?: string;
  code: string;
  name: string;
  revenue_account_code: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
export type StudentCollectionCategoriesUpdate = Partial<StudentCollectionCategoriesInsert>;

export interface StudentFinanceAdjustmentsRow {
  id: string;
  assessment_id: string;
  discount_request_id: string | null;
  adjustment_type: string;
  amount: number;
  description: string;
  status: string;
  reversal_of_id: string | null;
  idempotency_key: string | null;
  posted_by: string;
  posted_at: string;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
}
export interface StudentFinanceAdjustmentsInsert {
  id?: string;
  assessment_id: string;
  discount_request_id?: string | null;
  adjustment_type: string;
  amount: number;
  description: string;
  status?: string;
  reversal_of_id?: string | null;
  idempotency_key?: string | null;
  posted_by: string;
  posted_at?: string;
  voided_by?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type StudentFinanceAdjustmentsUpdate = Partial<StudentFinanceAdjustmentsInsert>;

export interface StudentFinanceJournalLinksRow {
  id: string;
  event_type: string;
  journal_entry_id: string;
  assessment_id: string | null;
  payment_id: string | null;
  adjustment_id: string | null;
  created_at: string;
}
export interface StudentFinanceJournalLinksInsert {
  id?: string;
  event_type: string;
  journal_entry_id: string;
  assessment_id?: string | null;
  payment_id?: string | null;
  adjustment_id?: string | null;
  created_at?: string;
}
export type StudentFinanceJournalLinksUpdate = Partial<StudentFinanceJournalLinksInsert>;

export interface CashVouchersRow {
  id: string;
  school_id: string | null;
  voucher_no: string;
  payee_type: string;
  payee_student_id: string | null;
  payee_name: string;
  category: string;
  amount: number;
  purpose: string;
  requested_by: string;
  requested_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  review_remarks: string | null;
  released_by: string | null;
  released_at: string | null;
  reference_no: string | null;
  created_at: string;
  updated_at: string;
}
export interface CashVouchersInsert {
  id?: string;
  school_id?: string | null;
  voucher_no: string;
  payee_type: string;
  payee_student_id?: string | null;
  payee_name: string;
  category: string;
  amount: number;
  purpose: string;
  requested_by: string;
  requested_at?: string;
  status?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  review_remarks?: string | null;
  released_by?: string | null;
  released_at?: string | null;
  reference_no?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type CashVouchersUpdate = Partial<CashVouchersInsert>;

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
  school_id: string | null;
  academic_year_id: string | null;
  sibling_position: number | null;
  exclusive_group: string | null;
  effective_from: string | null;
  effective_to: string | null;
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
  school_id?: string | null;
  academic_year_id?: string | null;
  sibling_position?: number | null;
  exclusive_group?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
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
  school_id?: string | null;
  academic_year_id?: string | null;
  sibling_position?: number | null;
  exclusive_group?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
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
  school_year: string | null;
  source_type: string | null;
  source_id: string | null;
  reversed_transaction_id: string | null;
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
  school_year?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  reversed_transaction_id?: string | null;
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
  school_year?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  reversed_transaction_id?: string | null;
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
  assessment_id: string | null;
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
  assessment_id?: string | null;
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
  assessment_id?: string | null;
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
  payment_id: string | null;
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
  payment_id?: string | null;
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
  payment_id?: string | null;
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
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
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
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
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
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GradesRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
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
  employee_id: string | null;
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
  employee_id?: string | null;
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
  employee_id?: string | null;
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

export interface EmployeeFacultyProfilesRow {
  id: string;
  employee_id: string;
  teacher_id: string | null;
  specialization: string | null;
  advisory_section: string | null;
  faculty_rank: string | null;
  is_teaching_staff: boolean;
  created_at: string;
  updated_at: string;
}
export interface EmployeeFacultyProfilesInsert {
  id?: string;
  employee_id: string;
  teacher_id?: string | null;
  specialization?: string | null;
  advisory_section?: string | null;
  faculty_rank?: string | null;
  is_teaching_staff?: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface EmployeeFacultyProfilesUpdate {
  id?: string;
  employee_id?: string;
  teacher_id?: string | null;
  specialization?: string | null;
  advisory_section?: string | null;
  faculty_rank?: string | null;
  is_teaching_staff?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentAttendanceRow {
  id: string;
  legacy_id: string | null;
  student_id: string;
  section: string | null;
  date: string;
  status: string;
  recorded_by: string | null;
  recorded_by_employee_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface StudentAttendanceInsert {
  id?: string;
  legacy_id?: string | null;
  student_id: string;
  section?: string | null;
  date: string;
  status?: string;
  recorded_by?: string | null;
  recorded_by_employee_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface StudentAttendanceUpdate {
  id?: string;
  legacy_id?: string | null;
  student_id?: string;
  section?: string | null;
  date?: string;
  status?: string;
  recorded_by?: string | null;
  recorded_by_employee_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationAppointmentsRow {
  id: string;
  legacy_id: string | null;
  school_id: string | null;
  student_id: string | null;
  teacher_id: string | null;
  employee_id: string | null;
  requested_by: string;
  requestor_role: string;
  purpose: string;
  appointment_date: string | null;
  appointment_time: string | null;
  venue: string | null;
  status: string;
  remarks: string | null;
  teacher_notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface ConsultationAppointmentsInsert {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  student_id?: string | null;
  teacher_id?: string | null;
  employee_id?: string | null;
  requested_by: string;
  requestor_role?: string;
  purpose: string;
  appointment_date?: string | null;
  appointment_time?: string | null;
  venue?: string | null;
  status?: string;
  remarks?: string | null;
  teacher_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface ConsultationAppointmentsUpdate {
  id?: string;
  legacy_id?: string | null;
  school_id?: string | null;
  student_id?: string | null;
  teacher_id?: string | null;
  employee_id?: string | null;
  requested_by?: string;
  requestor_role?: string;
  purpose?: string;
  appointment_date?: string | null;
  appointment_time?: string | null;
  venue?: string | null;
  status?: string;
  remarks?: string | null;
  teacher_notes?: string | null;
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

export interface StudentFinanceInvoicesRow {
  id: string;
  assessment_id: string;
  enrollment_id: string | null;
  school_id: string;
  student_id: string;
  invoice_no: string;
  academic_year: string;
  semester: string | null;
  currency_code: string;
  status: "Draft" | "Posted" | "Voided";
  issued_at: string | null;
  issued_by: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
}
export type StudentFinanceInvoicesInsert = Partial<StudentFinanceInvoicesRow> &
  Pick<StudentFinanceInvoicesRow, "assessment_id" | "school_id" | "student_id" | "invoice_no" | "academic_year" | "status">;
export type StudentFinanceInvoicesUpdate = Partial<StudentFinanceInvoicesRow>;

export interface StudentFinanceInvoiceLinesRow {
  id: string;
  invoice_id: string;
  assessment_fee_id: string | null;
  line_no: number;
  description: string;
  category: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  revenue_account_code: string;
  created_at: string;
}
export type StudentFinanceInvoiceLinesInsert = Partial<StudentFinanceInvoiceLinesRow> &
  Pick<StudentFinanceInvoiceLinesRow, "invoice_id" | "line_no" | "description" | "category" | "quantity" | "unit_amount" | "amount" | "revenue_account_code">;
export type StudentFinanceInvoiceLinesUpdate = Partial<StudentFinanceInvoiceLinesRow>;

export interface StudentInvoicePaymentPlansRow {
  id: string;
  invoice_id: string;
  template_id: string;
  template_version: number;
  status: "Active" | "Superseded";
  created_at: string;
}
export type StudentInvoicePaymentPlansInsert = Partial<StudentInvoicePaymentPlansRow> &
  Pick<StudentInvoicePaymentPlansRow, "invoice_id" | "template_id" | "template_version">;
export type StudentInvoicePaymentPlansUpdate = Partial<StudentInvoicePaymentPlansRow>;

export interface StudentInvoiceInstallmentsRow {
  id: string;
  payment_plan_id: string;
  sequence_no: number;
  label: string;
  due_date: string;
  amount: number;
  created_at: string;
}
export type StudentInvoiceInstallmentsInsert = Partial<StudentInvoiceInstallmentsRow> &
  Pick<StudentInvoiceInstallmentsRow, "payment_plan_id" | "sequence_no" | "label" | "due_date" | "amount">;
export type StudentInvoiceInstallmentsUpdate = Partial<StudentInvoiceInstallmentsRow>;

export interface StudentReceiptsRow {
  id: string;
  legacy_payment_id: string | null;
  school_id: string;
  student_id: string;
  receipt_no: string;
  receipt_date: string;
  payment_method_id: string;
  amount: number;
  currency_code: string;
  status: "Posted" | "Voided";
  remarks: string | null;
  posted_by: string;
  posted_at: string;
  idempotency_key: string | null;
  allow_unapplied_credit: boolean;
  unapplied_authorized_by: string | null;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
}
export type StudentReceiptsInsert = Partial<StudentReceiptsRow> &
  Pick<StudentReceiptsRow, "school_id" | "student_id" | "receipt_no" | "payment_method_id" | "amount" | "posted_by">;
export type StudentReceiptsUpdate = Partial<StudentReceiptsRow>;

export interface StudentReceiptAllocationsRow {
  id: string;
  receipt_id: string;
  invoice_id: string;
  amount: number;
  source: "Receipt" | "UnappliedCredit" | "Reallocation";
  idempotency_key: string | null;
  allocated_by: string;
  allocated_at: string;
}
export type StudentReceiptAllocationsInsert = Partial<StudentReceiptAllocationsRow> &
  Pick<StudentReceiptAllocationsRow, "receipt_id" | "invoice_id" | "amount" | "allocated_by">;
export type StudentReceiptAllocationsUpdate = Partial<StudentReceiptAllocationsRow>;

export interface StudentDirectCollectionLinesRow {
  id: string;
  receipt_id: string;
  collection_category_id: string;
  amount: number;
  description: string | null;
  created_at: string;
}
export type StudentDirectCollectionLinesInsert = Partial<StudentDirectCollectionLinesRow> &
  Pick<StudentDirectCollectionLinesRow, "receipt_id" | "collection_category_id" | "amount">;
export type StudentDirectCollectionLinesUpdate = Partial<StudentDirectCollectionLinesRow>;

export interface StudentAllocationReversalsRow {
  id: string;
  allocation_id: string;
  amount: number;
  reason: string;
  reversed_by: string;
  reversed_at: string;
  replacement_allocation_id: string | null;
  idempotency_key: string | null;
}
export type StudentAllocationReversalsInsert = Partial<StudentAllocationReversalsRow> &
  Pick<StudentAllocationReversalsRow, "allocation_id" | "amount" | "reason" | "reversed_by">;
export type StudentAllocationReversalsUpdate = Partial<StudentAllocationReversalsRow>;

export interface StudentAllocationReallocationRequestsRow {
  id: string;
  allocation_id: string;
  destination_invoice_id: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_remarks: string | null;
  created_at: string;
}
export type StudentAllocationReallocationRequestsInsert =
  Partial<StudentAllocationReallocationRequestsRow> &
  Pick<StudentAllocationReallocationRequestsRow, "allocation_id" | "destination_invoice_id" | "amount" | "reason" | "requested_by">;
export type StudentAllocationReallocationRequestsUpdate =
  Partial<StudentAllocationReallocationRequestsRow>;

export interface StudentReceiptVoidRequestsRow {
  id: string;
  receipt_id: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_remarks: string | null;
}
export type StudentReceiptVoidRequestsInsert = Partial<StudentReceiptVoidRequestsRow> &
  Pick<StudentReceiptVoidRequestsRow, "receipt_id" | "reason" | "requested_by">;
export type StudentReceiptVoidRequestsUpdate = Partial<StudentReceiptVoidRequestsRow>;

export interface SystemRuntimeControlsRow {
  control_key: string;
  enabled: boolean;
  changed_by: string | null;
  changed_at: string;
  remarks: string | null;
}
export type SystemRuntimeControlsInsert = Partial<SystemRuntimeControlsRow> &
  Pick<SystemRuntimeControlsRow, "control_key">;
export type SystemRuntimeControlsUpdate = Partial<SystemRuntimeControlsRow>;

export interface StudentPaymentTermTemplatesRow {
  id: string;
  school_id: string;
  academic_year: string;
  code: string;
  name: string;
  version: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
export type StudentPaymentTermTemplatesInsert = Partial<StudentPaymentTermTemplatesRow> &
  Pick<StudentPaymentTermTemplatesRow, "school_id" | "academic_year" | "code" | "name">;
export type StudentPaymentTermTemplatesUpdate = Partial<StudentPaymentTermTemplatesRow>;

export interface StudentPaymentTermTemplateInstallmentsRow {
  id: string;
  template_id: string;
  sequence_no: number;
  label: string;
  percentage: number;
  due_date: string;
}
export type StudentPaymentTermTemplateInstallmentsInsert =
  Partial<StudentPaymentTermTemplateInstallmentsRow> &
  Pick<StudentPaymentTermTemplateInstallmentsRow, "template_id" | "sequence_no" | "label" | "percentage" | "due_date">;
export type StudentPaymentTermTemplateInstallmentsUpdate =
  Partial<StudentPaymentTermTemplateInstallmentsRow>;

export interface StudentReceiptJournalLinksRow {
  id: string;
  event_type: "Receipt" | "ReceiptVoid" | "CreditApplication" | "Reallocation";
  journal_entry_id: string;
  receipt_id: string | null;
  allocation_id: string | null;
  reversal_id: string | null;
  created_at: string;
}
export type StudentReceiptJournalLinksInsert = Partial<StudentReceiptJournalLinksRow> &
  Pick<StudentReceiptJournalLinksRow, "event_type" | "journal_entry_id">;
export type StudentReceiptJournalLinksUpdate = Partial<StudentReceiptJournalLinksRow>;

export interface AcademicYearsRow { id: string; code: string; name: string; start_date: string; end_date: string; status: string; is_current: boolean; created_at: string; updated_at: string }
export type AcademicYearsInsert = Partial<AcademicYearsRow> & Pick<AcademicYearsRow,"code"|"name"|"start_date"|"end_date">;
export type AcademicYearsUpdate = Partial<AcademicYearsRow>;
export interface AcademicYearLevelsRow { id: string; code: string; name: string; academic_unit: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
export type AcademicYearLevelsInsert = Partial<AcademicYearLevelsRow> & Pick<AcademicYearLevelsRow,"code"|"name"|"academic_unit"|"sort_order">;
export type AcademicYearLevelsUpdate = Partial<AcademicYearLevelsRow>;
export interface StudentFeeCategoriesRow { id: string; school_id: string; code: string; name: string; posting_category: string; revenue_account_code: string; is_active: boolean; created_at: string; updated_at: string }
export type StudentFeeCategoriesInsert = Partial<StudentFeeCategoriesRow> & Pick<StudentFeeCategoriesRow,"school_id"|"code"|"name"|"posting_category"|"revenue_account_code">;
export type StudentFeeCategoriesUpdate = Partial<StudentFeeCategoriesRow>;
export interface StudentFeeItemsRow { id: string; school_id: string; code: string; name: string; category_id: string; billing_basis: string; is_required: boolean; is_discountable: boolean; is_active: boolean; sort_order: number; created_at: string; updated_at: string }
export type StudentFeeItemsInsert = Partial<StudentFeeItemsRow> & Pick<StudentFeeItemsRow,"school_id"|"code"|"name"|"category_id">;
export type StudentFeeItemsUpdate = Partial<StudentFeeItemsRow>;
export interface StudentFeeSchedulesRow { id: string; school_id: string; academic_year_id: string; academic_unit: string; version: number; status: string; source_reference: string|null; source_notes: string|null; created_by: string|null; published_by: string|null; published_at: string|null; created_at: string; updated_at: string }
export type StudentFeeSchedulesInsert = Partial<StudentFeeSchedulesRow> & Pick<StudentFeeSchedulesRow,"school_id"|"academic_year_id"|"academic_unit">;
export type StudentFeeSchedulesUpdate = Partial<StudentFeeSchedulesRow>;
export interface StudentFeeScheduleRatesRow { id: string; schedule_id: string; fee_item_id: string; year_level_id: string; course_id: string|null; amount: number; is_required: boolean|null; note: string|null; created_at: string; updated_at: string }
export type StudentFeeScheduleRatesInsert = Partial<StudentFeeScheduleRatesRow> & Pick<StudentFeeScheduleRatesRow,"schedule_id"|"fee_item_id"|"year_level_id"|"amount">;
export type StudentFeeScheduleRatesUpdate = Partial<StudentFeeScheduleRatesRow>;
export interface DiscountTypeFeeCategoriesRow { discount_type_id: string; fee_category_id: string; created_at: string }
export type DiscountTypeFeeCategoriesInsert = Partial<DiscountTypeFeeCategoriesRow> & Pick<DiscountTypeFeeCategoriesRow,"discount_type_id"|"fee_category_id">;
export type DiscountTypeFeeCategoriesUpdate = Partial<DiscountTypeFeeCategoriesRow>;
export interface DiscountRequestStudentsRow { discount_request_id: string; student_id: string; enrollment_id: string|null; relationship_role: string; verified_at: string|null; verified_by: string|null; created_at: string }
export type DiscountRequestStudentsInsert = Partial<DiscountRequestStudentsRow> & Pick<DiscountRequestStudentsRow,"discount_request_id"|"student_id"|"relationship_role">;
export type DiscountRequestStudentsUpdate = Partial<DiscountRequestStudentsRow>;
export interface StudentAidProgramsRow { id:string; school_id:string; code:string; name:string; sponsor_name:string; benefit_basis:string; benefit_value:number; academic_year_id:string|null; is_active:boolean; created_at:string; updated_at:string }
export type StudentAidProgramsInsert = Partial<StudentAidProgramsRow> & Pick<StudentAidProgramsRow,"school_id"|"code"|"name"|"sponsor_name"|"benefit_basis"|"benefit_value">;
export type StudentAidProgramsUpdate = Partial<StudentAidProgramsRow>;
export interface StudentAidAwardsRow { id:string; program_id:string; student_id:string; enrollment_id:string|null; approved_amount:number; status:string; reference_no:string|null; approved_by:string|null; approved_at:string|null; created_at:string; updated_at:string }
export type StudentAidAwardsInsert = Partial<StudentAidAwardsRow> & Pick<StudentAidAwardsRow,"program_id"|"student_id"|"approved_amount">;
export type StudentAidAwardsUpdate = Partial<StudentAidAwardsRow>;

export interface Database {
  public: {
    Tables: {
      schools: { Row: SchoolsRow; Insert: SchoolsInsert; Update: SchoolsUpdate };
      setup_items: { Row: SetupItemsRow; Insert: SetupItemsInsert; Update: SetupItemsUpdate };
      users: { Row: UsersRow; Insert: UsersInsert; Update: UsersUpdate };
      system_runtime_controls: { Row: SystemRuntimeControlsRow; Insert: SystemRuntimeControlsInsert; Update: SystemRuntimeControlsUpdate };
      courses: { Row: CoursesRow; Insert: CoursesInsert; Update: CoursesUpdate };
      subjects: { Row: SubjectsRow; Insert: SubjectsInsert; Update: SubjectsUpdate };
      teachers: { Row: TeachersRow; Insert: TeachersInsert; Update: TeachersUpdate };
      students: { Row: StudentsRow; Insert: StudentsInsert; Update: StudentsUpdate };
      student_registrar_profiles: { Row: StudentRegistrarProfilesRow; Insert: StudentRegistrarProfilesInsert; Update: StudentRegistrarProfilesUpdate };
      registrar_import_batches: { Row: RegistrarImportBatchesRow; Insert: RegistrarImportBatchesInsert; Update: RegistrarImportBatchesUpdate };
      registrar_import_rows: { Row: RegistrarImportRowsRow; Insert: RegistrarImportRowsInsert; Update: RegistrarImportRowsUpdate };
      employees: { Row: EmployeesRow; Insert: EmployeesInsert; Update: EmployeesUpdate };
      employee_faculty_profiles: { Row: EmployeeFacultyProfilesRow; Insert: EmployeeFacultyProfilesInsert; Update: EmployeeFacultyProfilesUpdate };
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
      online_enrollment_applications: { Row: OnlineEnrollmentApplicationsRow; Insert: OnlineEnrollmentApplicationsInsert; Update: OnlineEnrollmentApplicationsUpdate };
      enrollment_subjects: { Row: EnrollmentSubjectsRow; Insert: EnrollmentSubjectsInsert; Update: EnrollmentSubjectsUpdate };
      payments: { Row: PaymentsRow; Insert: PaymentsInsert; Update: PaymentsUpdate };
      payment_void_requests: { Row: PaymentVoidRequestsRow; Insert: PaymentVoidRequestsInsert; Update: PaymentVoidRequestsUpdate };
      student_payment_methods: { Row: StudentPaymentMethodsRow; Insert: StudentPaymentMethodsInsert; Update: StudentPaymentMethodsUpdate };
      student_collection_categories: { Row: StudentCollectionCategoriesRow; Insert: StudentCollectionCategoriesInsert; Update: StudentCollectionCategoriesUpdate };
      student_finance_adjustments: { Row: StudentFinanceAdjustmentsRow; Insert: StudentFinanceAdjustmentsInsert; Update: StudentFinanceAdjustmentsUpdate };
      student_finance_journal_links: { Row: StudentFinanceJournalLinksRow; Insert: StudentFinanceJournalLinksInsert; Update: StudentFinanceJournalLinksUpdate };
      student_payment_term_templates: { Row: StudentPaymentTermTemplatesRow; Insert: StudentPaymentTermTemplatesInsert; Update: StudentPaymentTermTemplatesUpdate };
      student_payment_term_template_installments: { Row: StudentPaymentTermTemplateInstallmentsRow; Insert: StudentPaymentTermTemplateInstallmentsInsert; Update: StudentPaymentTermTemplateInstallmentsUpdate };
      academic_years: { Row: AcademicYearsRow; Insert: AcademicYearsInsert; Update: AcademicYearsUpdate };
      academic_year_levels: { Row: AcademicYearLevelsRow; Insert: AcademicYearLevelsInsert; Update: AcademicYearLevelsUpdate };
      student_fee_categories: { Row: StudentFeeCategoriesRow; Insert: StudentFeeCategoriesInsert; Update: StudentFeeCategoriesUpdate };
      student_fee_items: { Row: StudentFeeItemsRow; Insert: StudentFeeItemsInsert; Update: StudentFeeItemsUpdate };
      student_fee_schedules: { Row: StudentFeeSchedulesRow; Insert: StudentFeeSchedulesInsert; Update: StudentFeeSchedulesUpdate };
      student_fee_schedule_rates: { Row: StudentFeeScheduleRatesRow; Insert: StudentFeeScheduleRatesInsert; Update: StudentFeeScheduleRatesUpdate };
      discount_type_fee_categories: { Row: DiscountTypeFeeCategoriesRow; Insert: DiscountTypeFeeCategoriesInsert; Update: DiscountTypeFeeCategoriesUpdate };
      discount_request_students: { Row: DiscountRequestStudentsRow; Insert: DiscountRequestStudentsInsert; Update: DiscountRequestStudentsUpdate };
      student_aid_programs: { Row: StudentAidProgramsRow; Insert: StudentAidProgramsInsert; Update: StudentAidProgramsUpdate };
      student_aid_awards: { Row: StudentAidAwardsRow; Insert: StudentAidAwardsInsert; Update: StudentAidAwardsUpdate };
      student_finance_invoices: { Row: StudentFinanceInvoicesRow; Insert: StudentFinanceInvoicesInsert; Update: StudentFinanceInvoicesUpdate };
      student_finance_invoice_lines: { Row: StudentFinanceInvoiceLinesRow; Insert: StudentFinanceInvoiceLinesInsert; Update: StudentFinanceInvoiceLinesUpdate };
      student_invoice_payment_plans: { Row: StudentInvoicePaymentPlansRow; Insert: StudentInvoicePaymentPlansInsert; Update: StudentInvoicePaymentPlansUpdate };
      student_invoice_installments: { Row: StudentInvoiceInstallmentsRow; Insert: StudentInvoiceInstallmentsInsert; Update: StudentInvoiceInstallmentsUpdate };
      student_receipts: { Row: StudentReceiptsRow; Insert: StudentReceiptsInsert; Update: StudentReceiptsUpdate };
      student_receipt_allocations: { Row: StudentReceiptAllocationsRow; Insert: StudentReceiptAllocationsInsert; Update: StudentReceiptAllocationsUpdate };
      student_direct_collection_lines: { Row: StudentDirectCollectionLinesRow; Insert: StudentDirectCollectionLinesInsert; Update: StudentDirectCollectionLinesUpdate };
      student_allocation_reversals: { Row: StudentAllocationReversalsRow; Insert: StudentAllocationReversalsInsert; Update: StudentAllocationReversalsUpdate };
      student_allocation_reallocation_requests: { Row: StudentAllocationReallocationRequestsRow; Insert: StudentAllocationReallocationRequestsInsert; Update: StudentAllocationReallocationRequestsUpdate };
      student_receipt_void_requests: { Row: StudentReceiptVoidRequestsRow; Insert: StudentReceiptVoidRequestsInsert; Update: StudentReceiptVoidRequestsUpdate };
      student_receipt_journal_links: { Row: StudentReceiptJournalLinksRow; Insert: StudentReceiptJournalLinksInsert; Update: StudentReceiptJournalLinksUpdate };
      cash_vouchers: { Row: CashVouchersRow; Insert: CashVouchersInsert; Update: CashVouchersUpdate };
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
      student_attendance: { Row: StudentAttendanceRow; Insert: StudentAttendanceInsert; Update: StudentAttendanceUpdate };
      announcements: { Row: AnnouncementsRow; Insert: AnnouncementsInsert; Update: AnnouncementsUpdate };
      school_events: { Row: SchoolEventsRow; Insert: SchoolEventsInsert; Update: SchoolEventsUpdate };
      consultation_appointments: { Row: ConsultationAppointmentsRow; Insert: ConsultationAppointmentsInsert; Update: ConsultationAppointmentsUpdate };
      learning_materials: { Row: LearningMaterialsRow; Insert: LearningMaterialsInsert; Update: LearningMaterialsUpdate };
      activity_logs: { Row: ActivityLogsRow; Insert: ActivityLogsInsert; Update: ActivityLogsUpdate };
      enrollment_history_stats: { Row: EnrollmentHistoryStatsRow; Insert: EnrollmentHistoryStatsInsert; Update: EnrollmentHistoryStatsUpdate };
      payroll: { Row: PayrollRow; Insert: PayrollInsert; Update: PayrollUpdate };
    };
  };
}
