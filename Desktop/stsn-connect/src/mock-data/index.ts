/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Student,
  Teacher,
  Employee,
  Course,
  Subject,
  Curriculum,
  Requirement,
  Enrollment,
  StudentAssessment,
  Payment,
  Grade,
  Schedule,
  Announcement,
  SchoolEvent,
  PayrollRow
} from "../types";

export const MOCK_USERS: User[] = [
  { id: "user-admin", email: "admin@stsn.edu.ph", name: "Admin Administrator", role: "SUPER_ADMIN", isActive: true, avatarUrl: "", department: "Administration" },
  { id: "user-registrar", email: "registrar@stsn.edu.ph", name: "Cynthia Ramos, LPT", role: "REGISTRAR", isActive: true, avatarUrl: "", department: "Support" },
  { id: "user-accounting", email: "accounting@stsn.edu.ph", name: "Eduardo Bonto, CPA", role: "ACCOUNTING", isActive: true, avatarUrl: "", department: "Support" },
  { id: "user-teacher", email: "teacher@stsn.edu.ph", name: "Prof. Arthur Reyes", role: "TEACHER", isActive: true, avatarUrl: "", department: "College" },
  { id: "user-student", email: "student@stsn.edu.ph", name: "Enrico Veloso", role: "STUDENT", isActive: true, avatarUrl: "", department: "Basic Education" },
  { id: "user-hr", email: "hr@stsn.edu.ph", name: "Gemma Santos", role: "HR", isActive: true, avatarUrl: "", department: "Administration" }
];

// ============================================================
// BASIC EDUCATION STUDENTS — St. Theresa's School of Novaliches
// ============================================================
export const MOCK_STUDENTS_BASIC_ED: Student[] = [
  // --- PRESCHOOL ---
  {
    id: "stud-nursery-01", studentNo: "STSN-2026-0101",
    firstName: "Sofia", lastName: "Reyes", middleName: "Cruz",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2022-03-10", birthplace: "Quezon City",
    email: "sofia.reyes@stsn.edu.ph", contactNo: "+639170000001",
    address: "#15 Sampaguita St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Nursery", trackOrCourse: "Preschool",
    section: "Little Angels", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-kinder1-01", studentNo: "STSN-2026-0102",
    firstName: "Liam", lastName: "Bautista", middleName: "Torres",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2021-06-15", birthplace: "Novaliches",
    email: "liam.bautista@stsn.edu.ph", contactNo: "+639170000002",
    address: "#3 Maligaya Ave, Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Kinder 1", trackOrCourse: "Preschool",
    section: "Sunshine", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-kinder2-01", studentNo: "STSN-2026-0103",
    firstName: "Isabella", lastName: "Santos", middleName: "Garcia",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2020-09-22", birthplace: "Caloocan",
    email: "isabella.santos@stsn.edu.ph", contactNo: "+639170000003",
    address: "#7 Sampaguita St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Kinder 2", trackOrCourse: "Preschool",
    section: "Rainbow", enrollmentStatus: "Enrolled"
  },

  // --- PRIMARY (Grade 1-3) ---
  {
    id: "stud-g1-01", studentNo: "STSN-2026-0111",
    firstName: "Marco", lastName: "Fernandez", middleName: "Dela Cruz",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2019-04-05", birthplace: "Quezon City",
    email: "marco.fernandez@stsn.edu.ph", contactNo: "+639170000011",
    address: "#22 Rizal Ave, Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 1", trackOrCourse: "Elementary",
    section: "St. Joseph", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g2-01", studentNo: "STSN-2026-0112",
    firstName: "Camille", lastName: "Villanueva", middleName: "Tan",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2018-07-18", birthplace: "Marikina",
    email: "camille.villanueva@stsn.edu.ph", contactNo: "+639170000012",
    address: "#10 Dagohoy St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 2", trackOrCourse: "Elementary",
    section: "St. Francis", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g3-01", studentNo: "STSN-2026-0113",
    firstName: "Rafael", lastName: "Mendoza", middleName: "Flores",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2017-11-30", birthplace: "Bulacan",
    email: "rafael.mendoza@stsn.edu.ph", contactNo: "+639170000013",
    address: "#5 Mabini St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 3", trackOrCourse: "Elementary",
    section: "St. Anthony", enrollmentStatus: "Enrolled"
  },

  // --- INTERMEDIATE (Grade 4-6) ---
  {
    id: "stud-g4-01", studentNo: "STSN-2026-0121",
    firstName: "Andrea", lastName: "Castillo", middleName: "Ocampo",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2016-02-14", birthplace: "Quezon City",
    email: "andrea.castillo@stsn.edu.ph", contactNo: "+639170000021",
    address: "#18 Makabayan St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 4", trackOrCourse: "Elementary",
    section: "St. Michael", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g5-01", studentNo: "STSN-2026-0122",
    firstName: "Paolo", lastName: "Aguilar", middleName: "Santos",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2015-08-25", birthplace: "Novaliches",
    email: "paolo.aguilar@stsn.edu.ph", contactNo: "+639170000022",
    address: "#30 Lapu-Lapu St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 5", trackOrCourse: "Elementary",
    section: "St. Gabriel", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g6-01", studentNo: "STSN-2026-0123",
    firstName: "Bianca", lastName: "Torres", middleName: "Reyes",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2014-05-10", birthplace: "Bulacan",
    email: "bianca.torres@stsn.edu.ph", contactNo: "+639170000023",
    address: "#8 Del Pilar St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 6", trackOrCourse: "Elementary",
    section: "St. Raphael", enrollmentStatus: "Enrolled"
  },

  // --- JUNIOR HIGH (Grade 7-10) ---
  {
    id: "stud-g7-01", studentNo: "STSN-2026-0131",
    firstName: "Nathan", lastName: "Gomez", middleName: "Dela Peña",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2013-01-20", birthplace: "Quezon City",
    email: "nathan.gomez@stsn.edu.ph", contactNo: "+639170000031",
    address: "#14 Bonifacio St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 7", trackOrCourse: "Junior High",
    section: "St. Theresa", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g8-01", studentNo: "STSN-2026-0132",
    firstName: "Patricia", lastName: "Lopez", middleName: "Valdez",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2012-06-08", birthplace: "Manila",
    email: "patricia.lopez@stsn.edu.ph", contactNo: "+639170000032",
    address: "#2 Aguinaldo St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 8", trackOrCourse: "Junior High",
    section: "St. Paul", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g9-01", studentNo: "STSN-2026-0133",
    firstName: "Jerome", lastName: "Santos", middleName: "Cruz",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2011-09-15", birthplace: "Caloocan",
    email: "jerome.santos@stsn.edu.ph", contactNo: "+639170000033",
    address: "#25 Luna St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 9", trackOrCourse: "Junior High",
    section: "St. Mark", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-g10-01", studentNo: "STSN-2026-0134",
    firstName: "Daniela", lastName: "Ramos", middleName: "Santiago",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2010-12-03", birthplace: "Novaliches",
    email: "daniela.ramos@stsn.edu.ph", contactNo: "+639170000034",
    address: "#9 Kalayaan Ave, Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 10", trackOrCourse: "Junior High",
    section: "St. Luke", enrollmentStatus: "Enrolled"
  },

  // --- SENIOR HIGH (Grade 11-12) — original + additions ---
  {
    id: "stud-enrico", studentNo: "STSN-2026-0001",
    firstName: "Enrico", lastName: "Veloso", middleName: "Santos",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "1990-02-02", birthplace: "Manila",
    email: "student@stsn.edu.ph", contactNo: "+639170191575",
    address: "#7 Kingfisher St. Zabarte Subdivision, Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    userId: "user-student",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "STEM",
    section: "St. Thomas", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-katherine", studentNo: "STSN-2026-0004",
    firstName: "Katherine", lastName: "Alvarez", middleName: "Gomez",
    gender: "Female", civilStatus: "Single", religion: "Christian", nationality: "Filipino",
    birthday: "2010-01-15", birthplace: "Quezon City",
    email: "katherine.alvarez@gmail.com", contactNo: "+639227654321",
    address: "123 Katipunan Avenue", province: "Metro Manila", municipality: "Quezon City", zipCode: "1108",
    department: "Basic Education", yearLevel: "Grade 12", trackOrCourse: "ABM",
    section: "St. Catherine", enrollmentStatus: "Pending"
  },
  {
    id: "stud-miguel", studentNo: "STSN-2026-0005",
    firstName: "Miguel", lastName: "Santos", middleName: "Castillo",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2007-06-18", birthplace: "Pasig City",
    email: "miguel.santos@gmail.com", contactNo: "+639198765432",
    address: "55 Oranbo Drive", province: "Metro Manila", municipality: "Pasig", zipCode: "1600",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "HUMSS",
    section: "St. Albert", enrollmentStatus: "Approved"
  },
  {
    id: "stud-g12-02", studentNo: "STSN-2026-0141",
    firstName: "Sophia", lastName: "Mercado", middleName: "Chan",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2008-03-27", birthplace: "Quezon City",
    email: "sophia.mercado@stsn.edu.ph", contactNo: "+639170000041",
    address: "#33 Heroes St., Novaliches", province: "Metro Manila", municipality: "Quezon City", zipCode: "1123",
    department: "Basic Education", yearLevel: "Grade 12", trackOrCourse: "STEM",
    section: "St. Teresa", enrollmentStatus: "Enrolled"
  }
];

// ============================================================
// COLLEGE STUDENTS — Colegio de Sta. Teresa de Avila
// ============================================================
export const MOCK_STUDENTS_COLLEGE: Student[] = [
  {
    id: "stud-clara", studentNo: "CDSTA-2026-0002",
    firstName: "Maria Clara", lastName: "Dela Cruz", middleName: "Ilustre",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2005-05-12", birthplace: "Calamba, Laguna",
    email: "clara.delacruz@stsn.edu.ph", contactNo: "+639182345678",
    address: "Unit 4C High Street Condominium", province: "Laguna", municipality: "Calamba", zipCode: "4027",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSIT",
    section: "IT101", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-juan", studentNo: "CDSTA-2026-0003",
    firstName: "Juan", lastName: "Luna", middleName: "Novicio",
    gender: "Male", civilStatus: "Single", religion: "Aglipayan", nationality: "Filipino",
    birthday: "2004-10-23", birthplace: "Badoc, Ilocos Norte",
    email: "juan.luna@stsn.edu.ph", contactNo: "+639151234567",
    address: "15 Kalayaan Ave", province: "Ilocos Norte", municipality: "Badoc", zipCode: "2904",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSBA",
    section: "BA201", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-leandro", studentNo: "CDSTA-2026-0006",
    firstName: "Leandro", lastName: "Santiago", middleName: "Mendoza",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2005-11-30", birthplace: "San Fernando, Pampanga",
    email: "leandro.santiago@stsn.edu.ph", contactNo: "+639351239876",
    address: "Villa de Pampanga", province: "Pampanga", municipality: "San Fernando", zipCode: "2000",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSCS",
    section: "CS101", enrollmentStatus: "Pending"
  },
  {
    id: "stud-college-04", studentNo: "CDSTA-2026-0007",
    firstName: "Angela", lastName: "Reyes", middleName: "Bautista",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2005-07-12", birthplace: "Cebu City",
    email: "angela.reyes@cdsta.edu.ph", contactNo: "+639221234567",
    address: "45 Gen. Luna St., Cebu City", province: "Cebu", municipality: "Cebu City", zipCode: "6000",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSA",
    section: "AC201", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-college-05", studentNo: "CDSTA-2026-0008",
    firstName: "Christian", lastName: "Lim", middleName: "Go",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2004-02-28", birthplace: "Binondo, Manila",
    email: "christian.lim@cdsta.edu.ph", contactNo: "+639281239876",
    address: "88 Ongpin St., Binondo, Manila", province: "Metro Manila", municipality: "Manila", zipCode: "1006",
    department: "College", yearLevel: "3rd Year", trackOrCourse: "BSIT",
    section: "IT301", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-college-06", studentNo: "CDSTA-2026-0009",
    firstName: "Maricel", lastName: "Buenaventura", middleName: "Diaz",
    gender: "Female", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2006-05-19", birthplace: "Davao City",
    email: "maricel.buenaventura@cdsta.edu.ph", contactNo: "+639391234123",
    address: "22 JP Laurel Ave, Davao City", province: "Davao del Sur", municipality: "Davao City", zipCode: "8000",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSHM",
    section: "HM101", enrollmentStatus: "Enrolled"
  },
  {
    id: "stud-college-07", studentNo: "CDSTA-2026-0010",
    firstName: "Rodolfo", lastName: "Macaraeg", middleName: "Pascual",
    gender: "Male", civilStatus: "Single", religion: "Catholic", nationality: "Filipino",
    birthday: "2003-11-07", birthplace: "Taguig City",
    email: "rodolfo.macaraeg@cdsta.edu.ph", contactNo: "+639174561234",
    address: "100 Rizal St., Taguig City", province: "Metro Manila", municipality: "Taguig", zipCode: "1630",
    department: "College", yearLevel: "4th Year", trackOrCourse: "BSED",
    section: "ED401", enrollmentStatus: "Enrolled"
  }
];

export const MOCK_STUDENTS: Student[] = [
  ...MOCK_STUDENTS_BASIC_ED,
  ...MOCK_STUDENTS_COLLEGE
];

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: "teach-arthur", firstName: "Arthur", lastName: "Reyes", middleName: "Panganiban",
    department: "College", email: "arthur.reyes@stsn.edu.ph", phone: "+639151231122",
    specialization: "Information Technology & Computer Networks", advisorySection: "IT101", isActive: true
  },
  {
    id: "teach-beatriz", firstName: "Beatriz", lastName: "Cruz", middleName: "Soriano",
    department: "Basic Education", email: "beatriz.cruz@stsn.edu.ph", phone: "+639163211155",
    specialization: "General Mathematics & Statistics", advisorySection: "St. Thomas", isActive: true
  },
  {
    id: "teach-carlo", firstName: "Carlo", lastName: "Vergara", middleName: "Dizon",
    department: "College", email: "carlo.vergara@stsn.edu.ph", phone: "+639174567890",
    specialization: "Business Economics & Finance", advisorySection: "BA201", isActive: true
  },
  {
    id: "teach-elena", firstName: "Elena", lastName: "Soriano", middleName: "Basa",
    department: "Basic Education", email: "elena.soriano@stsn.edu.ph", phone: "+639182345678",
    specialization: "English Language & Literature", advisorySection: "St. Paul", isActive: true
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: "emp-registrar", firstName: "Cynthia", lastName: "Ramos", middleName: "Bautista", email: "registrar@stsn.edu.ph", position: "Senior Registrar", department: "Registrar", salary: 42000, status: "Full-Time", leaveBalance: 15 },
  { id: "emp-accounting", firstName: "Eduardo", lastName: "Bonto", middleName: "Marasigan", email: "accounting@stsn.edu.ph", position: "Chief Accountant", department: "Accounting", salary: 58000, status: "Full-Time", leaveBalance: 18 },
  { id: "emp-hr", firstName: "Gemma", lastName: "Santos", middleName: "Macaraig", email: "hr@stsn.edu.ph", position: "HR Manager", department: "HR", salary: 45000, status: "Full-Time", leaveBalance: 14 },
  { id: "emp-assistant", firstName: "Ronaldo", lastName: "Mercado", middleName: "Guevara", email: "ronald.mercado@stsn.edu.ph", position: "Administrative Assistant", department: "Administration", salary: 22000, status: "Full-Time", leaveBalance: 12 }
];

export const MOCK_COURSES: Course[] = [
  // College Programs
  { id: "c-bsit", code: "BSIT", name: "BS Information Technology", department: "College", durationYears: 4 },
  { id: "c-bscs", code: "BSCS", name: "BS Computer Science", department: "College", durationYears: 4 },
  { id: "c-bsba", code: "BSBA", name: "BS Business Administration", department: "College", durationYears: 4 },
  { id: "c-bsa", code: "BSA", name: "BS Accountancy", department: "College", durationYears: 4 },
  { id: "c-bshm", code: "BSHM", name: "BS Hospitality Management", department: "College", durationYears: 4 },
  { id: "c-bsed", code: "BSED", name: "BS Education", department: "College", durationYears: 4 },
  // Basic Education Program Categories (used as "course" for display)
  { id: "c-preschool", code: "Preschool", name: "Preschool Program", department: "Basic Education", durationYears: 3 },
  { id: "c-elementary", code: "Elementary", name: "Elementary Education (Grade 1-6)", department: "Basic Education", durationYears: 6 },
  { id: "c-jhs", code: "Junior High", name: "Junior High School (Grade 7-10)", department: "Basic Education", durationYears: 4 },
  { id: "c-stem", code: "STEM", name: "Senior High — Science, Technology, Engineering, and Mathematics", department: "Basic Education", durationYears: 2 },
  { id: "c-humss", code: "HUMSS", name: "Senior High — Humanities and Social Sciences", department: "Basic Education", durationYears: 2 },
  { id: "c-abm", code: "ABM", name: "Senior High — Accountancy, Business, and Management", department: "Basic Education", durationYears: 2 },
  { id: "c-gas", code: "GAS", name: "Senior High — General Academic Strand", department: "Basic Education", durationYears: 2 }
];

export const MOCK_SUBJECTS: Subject[] = [
  // ===================== BASIC EDUCATION =====================

  // --- Preschool ---
  { id: "s-pre-01", code: "PRE-LANG", name: "Language Development", units: 0, department: "Basic Education", yearLevel: "Nursery", semester: "Full Year", trackOrCourse: "Preschool" },
  { id: "s-pre-02", code: "PRE-NUM", name: "Number Concepts", units: 0, department: "Basic Education", yearLevel: "Kinder 1", semester: "Full Year", trackOrCourse: "Preschool" },
  { id: "s-pre-03", code: "PRE-ART", name: "Arts & Creativity", units: 0, department: "Basic Education", yearLevel: "Kinder 2", semester: "Full Year", trackOrCourse: "Preschool" },

  // --- Elementary ---
  { id: "s-el-01", code: "EL-MATH", name: "Mathematics", units: 0, department: "Basic Education", yearLevel: "Grade 1", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-02", code: "EL-ENG", name: "English", units: 0, department: "Basic Education", yearLevel: "Grade 1", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-03", code: "EL-FIL", name: "Filipino", units: 0, department: "Basic Education", yearLevel: "Grade 1", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-04", code: "EL-MTB", name: "Mother Tongue Based", units: 0, department: "Basic Education", yearLevel: "Grade 1", semester: "Full Year", trackOrCourse: "Elementary" },

  { id: "s-el-05", code: "EL-MATH2", name: "Mathematics 2", units: 0, department: "Basic Education", yearLevel: "Grade 2", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-06", code: "EL-ENG2", name: "English 2", units: 0, department: "Basic Education", yearLevel: "Grade 2", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-07", code: "EL-SCI2", name: "Science 2", units: 0, department: "Basic Education", yearLevel: "Grade 2", semester: "Full Year", trackOrCourse: "Elementary" },

  { id: "s-el-08", code: "EL-MATH4", name: "Mathematics 4", units: 0, department: "Basic Education", yearLevel: "Grade 4", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-09", code: "EL-SCI4", name: "Science 4", units: 0, department: "Basic Education", yearLevel: "Grade 4", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-10", code: "EL-AP4", name: "Araling Panlipunan 4", units: 0, department: "Basic Education", yearLevel: "Grade 4", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-11", code: "EL-EPN4", name: "EPP / TLE 4", units: 0, department: "Basic Education", yearLevel: "Grade 4", semester: "Full Year", trackOrCourse: "Elementary" },

  { id: "s-el-12", code: "EL-MATH5", name: "Mathematics 5", units: 0, department: "Basic Education", yearLevel: "Grade 5", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-13", code: "EL-SCI5", name: "Science 5", units: 0, department: "Basic Education", yearLevel: "Grade 5", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-14", code: "EL-MATH6", name: "Mathematics 6", units: 0, department: "Basic Education", yearLevel: "Grade 6", semester: "Full Year", trackOrCourse: "Elementary" },
  { id: "s-el-15", code: "EL-SCI6", name: "Science 6", units: 0, department: "Basic Education", yearLevel: "Grade 6", semester: "Full Year", trackOrCourse: "Elementary" },

  // --- Junior High School ---
  { id: "s-jhs-01", code: "JHS-MATH7", name: "Mathematics 7", units: 0, department: "Basic Education", yearLevel: "Grade 7", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-02", code: "JHS-SCI7", name: "Integrated Science 7", units: 0, department: "Basic Education", yearLevel: "Grade 7", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-03", code: "JHS-ENG7", name: "English 7", units: 0, department: "Basic Education", yearLevel: "Grade 7", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-04", code: "JHS-FIL7", name: "Filipino 7", units: 0, department: "Basic Education", yearLevel: "Grade 7", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-05", code: "JHS-AP7", name: "Araling Panlipunan 7", units: 0, department: "Basic Education", yearLevel: "Grade 7", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-06", code: "JHS-TLE7", name: "TLE 7", units: 0, department: "Basic Education", yearLevel: "Grade 7", semester: "Full Year", trackOrCourse: "Junior High" },

  { id: "s-jhs-07", code: "JHS-MATH8", name: "Mathematics 8", units: 0, department: "Basic Education", yearLevel: "Grade 8", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-08", code: "JHS-SCI8", name: "Earth Science 8", units: 0, department: "Basic Education", yearLevel: "Grade 8", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-09", code: "JHS-MATH9", name: "Mathematics 9 (Algebra)", units: 0, department: "Basic Education", yearLevel: "Grade 9", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-10", code: "JHS-SCI9", name: "Biology 9", units: 0, department: "Basic Education", yearLevel: "Grade 9", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-11", code: "JHS-MATH10", name: "Mathematics 10", units: 0, department: "Basic Education", yearLevel: "Grade 10", semester: "Full Year", trackOrCourse: "Junior High" },
  { id: "s-jhs-12", code: "JHS-SCI10", name: "Physics 10", units: 0, department: "Basic Education", yearLevel: "Grade 10", semester: "Full Year", trackOrCourse: "Junior High" },

  // --- Senior High: STEM (Grade 11) ---
  { id: "s-16", code: "SHS-ORAL-COM", name: "Oral Communication", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "STEM" },
  { id: "s-17", code: "SHS-READ-WRITE", name: "Reading and Writing", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "STEM" },
  { id: "s-18", code: "SHS-GEN-MATH", name: "General Mathematics", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "STEM" },
  { id: "s-19", code: "SHS-STAT-PROB", name: "Statistics and Probability", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "STEM" },
  { id: "s-20", code: "SHS-EARTH-LIFE", name: "Earth and Life Science", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "STEM" },
  { id: "s-21", code: "SHS-PHYS-SCI", name: "Physical Science", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "Second Semester", trackOrCourse: "STEM" },
  { id: "s-22", code: "SHS-PER-DEV", name: "Personal Development", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "Second Semester", trackOrCourse: "STEM" },

  // --- Senior High: HUMSS (Grade 11) ---
  { id: "s-humss-01", code: "SHS-HUMSS-PCOM", name: "Philippine Politics and Governance", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "HUMSS" },
  { id: "s-humss-02", code: "SHS-HUMSS-CW", name: "Creative Writing", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "HUMSS" },
  { id: "s-humss-03", code: "SHS-HUMSS-DISP", name: "Disciplines & Ideas in Social Sciences", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "HUMSS" },

  // --- Senior High: ABM (Grade 11-12) ---
  { id: "s-abm-01", code: "SHS-ABM-OBA", name: "Organization and Management", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "ABM" },
  { id: "s-abm-02", code: "SHS-ABM-PRIN", name: "Fundamentals of ABM", units: 0, department: "Basic Education", yearLevel: "Grade 11", semester: "First Semester", trackOrCourse: "ABM" },
  { id: "s-abm-03", code: "SHS-ABM-BM", name: "Business Mathematics", units: 0, department: "Basic Education", yearLevel: "Grade 12", semester: "First Semester", trackOrCourse: "ABM" },
  { id: "s-abm-04", code: "SHS-ABM-ECON", name: "Applied Economics", units: 0, department: "Basic Education", yearLevel: "Grade 12", semester: "First Semester", trackOrCourse: "ABM" },

  // ===================== COLLEGE — BSIT =====================
  { id: "s-01", code: "IT101", name: "Introduction to Computing", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-02", code: "IT102", name: "Computer Programming 1", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-03", code: "MATH101", name: "College Algebra", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-04", code: "NSTP1", name: "National Service Training Program 1", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-05", code: "IT103", name: "Computer Programming 2", units: 3, department: "College", yearLevel: "1st Year", semester: "Second Semester", trackOrCourse: "BSIT", prerequisites: ["IT102"] },
  { id: "s-06", code: "IT104", name: "Data Structures and Algorithms", units: 3, department: "College", yearLevel: "1st Year", semester: "Second Semester", trackOrCourse: "BSIT", prerequisites: ["IT102"] },
  { id: "s-it-201", code: "IT201", name: "Web Development 1", units: 3, department: "College", yearLevel: "2nd Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-it-202", code: "IT202", name: "Database Management Systems", units: 3, department: "College", yearLevel: "2nd Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-it-301", code: "IT301", name: "System Analysis and Design", units: 3, department: "College", yearLevel: "3rd Year", semester: "First Semester", trackOrCourse: "BSIT" },
  { id: "s-it-302", code: "IT302", name: "Network Administration", units: 3, department: "College", yearLevel: "3rd Year", semester: "First Semester", trackOrCourse: "BSIT" },

  // ===================== COLLEGE — BSCS =====================
  { id: "s-cs-01", code: "CS101", name: "Introduction to Computer Science", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSCS" },
  { id: "s-cs-02", code: "CS102", name: "Discrete Mathematics", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSCS" },
  { id: "s-cs-03", code: "CS103", name: "Programming Fundamentals", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSCS" },
  { id: "s-cs-04", code: "CS201", name: "Data Structures", units: 3, department: "College", yearLevel: "2nd Year", semester: "First Semester", trackOrCourse: "BSCS" },

  // ===================== COLLEGE — BSBA =====================
  { id: "s-07", code: "BA101", name: "Principles of Management", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSBA" },
  { id: "s-08", code: "BA102", name: "Basic Microeconomics", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSBA" },
  { id: "s-09", code: "MATH102", name: "Business Mathematics", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSBA" },
  { id: "s-ba-201", code: "BA201", name: "Human Resource Management", units: 3, department: "College", yearLevel: "2nd Year", semester: "First Semester", trackOrCourse: "BSBA" },
  { id: "s-ba-202", code: "BA202", name: "Marketing Management", units: 3, department: "College", yearLevel: "2nd Year", semester: "First Semester", trackOrCourse: "BSBA" },

  // ===================== COLLEGE — BSA =====================
  { id: "s-bsa-01", code: "ACCT101", name: "Fundamentals of Accounting 1", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSA" },
  { id: "s-bsa-02", code: "ACCT102", name: "Fundamentals of Accounting 2", units: 3, department: "College", yearLevel: "1st Year", semester: "Second Semester", trackOrCourse: "BSA" },
  { id: "s-bsa-03", code: "ACCT201", name: "Financial Accounting", units: 3, department: "College", yearLevel: "2nd Year", semester: "First Semester", trackOrCourse: "BSA" },

  // ===================== COLLEGE — BSHM =====================
  { id: "s-hm-01", code: "HM101", name: "Introduction to Hospitality Industry", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSHM" },
  { id: "s-hm-02", code: "HM102", name: "Food and Beverage Service", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSHM" },
  { id: "s-hm-03", code: "HM103", name: "Housekeeping Operations", units: 3, department: "College", yearLevel: "1st Year", semester: "Second Semester", trackOrCourse: "BSHM" },

  // ===================== COLLEGE — BSED =====================
  { id: "s-ed-01", code: "ED101", name: "Child and Adolescent Development", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSED" },
  { id: "s-ed-02", code: "ED102", name: "The Teaching Profession", units: 3, department: "College", yearLevel: "1st Year", semester: "First Semester", trackOrCourse: "BSED" },
  { id: "s-ed-401", code: "ED401", name: "Student Teaching / Practicum", units: 6, department: "College", yearLevel: "4th Year", semester: "First Semester", trackOrCourse: "BSED" },
  { id: "s-ed-402", code: "ED402", name: "Educational Psychology", units: 3, department: "College", yearLevel: "4th Year", semester: "First Semester", trackOrCourse: "BSED" }
];

export const MOCK_CURRICULUMS: Curriculum[] = [
  {
    id: "curr-stem",
    courseCodeOrStrand: "STEM",
    name: "Enhanced K-12 STEM Curriculum (2026 Edition)",
    subjects: [
      { yearLevel: "Grade 11", semester: "First Semester", subjectCodes: ["SHS-ORAL-COM", "SHS-READ-WRITE", "SHS-GEN-MATH", "SHS-STAT-PROB", "SHS-EARTH-LIFE"] },
      { yearLevel: "Grade 11", semester: "Second Semester", subjectCodes: ["SHS-PHYS-SCI", "SHS-PER-DEV"] }
    ]
  },
  {
    id: "curr-humss",
    courseCodeOrStrand: "HUMSS",
    name: "Enhanced K-12 HUMSS Curriculum (2026 Edition)",
    subjects: [
      { yearLevel: "Grade 11", semester: "First Semester", subjectCodes: ["SHS-HUMSS-PCOM", "SHS-HUMSS-CW", "SHS-HUMSS-DISP"] }
    ]
  },
  {
    id: "curr-abm",
    courseCodeOrStrand: "ABM",
    name: "Enhanced K-12 ABM Curriculum (2026 Edition)",
    subjects: [
      { yearLevel: "Grade 11", semester: "First Semester", subjectCodes: ["SHS-ABM-OBA", "SHS-ABM-PRIN"] },
      { yearLevel: "Grade 12", semester: "First Semester", subjectCodes: ["SHS-ABM-BM", "SHS-ABM-ECON"] }
    ]
  },
  {
    id: "curr-bsit",
    courseCodeOrStrand: "BSIT",
    name: "BS Information Technology Curriculum v3",
    subjects: [
      { yearLevel: "1st Year", semester: "First Semester", subjectCodes: ["IT101", "IT102", "MATH101", "NSTP1"] },
      { yearLevel: "1st Year", semester: "Second Semester", subjectCodes: ["IT103", "IT104"] },
      { yearLevel: "2nd Year", semester: "First Semester", subjectCodes: ["IT201", "IT202"] },
      { yearLevel: "3rd Year", semester: "First Semester", subjectCodes: ["IT301", "IT302"] }
    ]
  },
  {
    id: "curr-bscs",
    courseCodeOrStrand: "BSCS",
    name: "BS Computer Science Curriculum",
    subjects: [
      { yearLevel: "1st Year", semester: "First Semester", subjectCodes: ["CS101", "CS102", "CS103"] },
      { yearLevel: "2nd Year", semester: "First Semester", subjectCodes: ["CS201"] }
    ]
  },
  {
    id: "curr-bsba",
    courseCodeOrStrand: "BSBA",
    name: "BS Business Administration Curriculum",
    subjects: [
      { yearLevel: "1st Year", semester: "First Semester", subjectCodes: ["BA101", "BA102", "MATH102"] },
      { yearLevel: "2nd Year", semester: "First Semester", subjectCodes: ["BA201", "BA202"] }
    ]
  },
  {
    id: "curr-bsa",
    courseCodeOrStrand: "BSA",
    name: "BS Accountancy Curriculum",
    subjects: [
      { yearLevel: "1st Year", semester: "First Semester", subjectCodes: ["ACCT101"] },
      { yearLevel: "1st Year", semester: "Second Semester", subjectCodes: ["ACCT102"] },
      { yearLevel: "2nd Year", semester: "First Semester", subjectCodes: ["ACCT201"] }
    ]
  },
  {
    id: "curr-bshm",
    courseCodeOrStrand: "BSHM",
    name: "BS Hospitality Management Curriculum",
    subjects: [
      { yearLevel: "1st Year", semester: "First Semester", subjectCodes: ["HM101", "HM102"] },
      { yearLevel: "1st Year", semester: "Second Semester", subjectCodes: ["HM103"] }
    ]
  },
  {
    id: "curr-bsed",
    courseCodeOrStrand: "BSED",
    name: "BS Education Curriculum",
    subjects: [
      { yearLevel: "1st Year", semester: "First Semester", subjectCodes: ["ED101", "ED102"] },
      { yearLevel: "4th Year", semester: "First Semester", subjectCodes: ["ED401", "ED402"] }
    ]
  }
];

export const MOCK_REQUIREMENTS: Requirement[] = [
  // Basic Ed — Enrico Veloso
  { id: "req-1", studentId: "stud-enrico", name: "PSA Birth Certificate", status: "Submitted", submittedDate: "2026-05-10" },
  { id: "req-2", studentId: "stud-enrico", name: "Good Moral Certificate", status: "Submitted", submittedDate: "2026-05-11" },
  { id: "req-3", studentId: "stud-enrico", name: "ID Picture (2x2)", status: "Submitted", submittedDate: "2026-05-10" },
  { id: "req-4", studentId: "stud-enrico", name: "Form 137 / SF9", status: "Submitted", submittedDate: "2026-05-15" },
  // Basic Ed — Katherine Alvarez
  { id: "req-9", studentId: "stud-katherine", name: "PSA Birth Certificate", status: "Submitted", submittedDate: "2026-05-20" },
  { id: "req-10", studentId: "stud-katherine", name: "Good Moral Certificate", status: "Pending" },
  { id: "req-11", studentId: "stud-katherine", name: "ID Picture (2x2)", status: "Submitted", submittedDate: "2026-05-20" },
  { id: "req-12", studentId: "stud-katherine", name: "Form 137 / SF9", status: "Pending" },
  // College — Maria Clara Dela Cruz
  { id: "req-5", studentId: "stud-clara", name: "PSA Birth Certificate", status: "Submitted", submittedDate: "2026-05-11" },
  { id: "req-6", studentId: "stud-clara", name: "Good Moral Certificate", status: "Submitted", submittedDate: "2026-05-11" },
  { id: "req-7", studentId: "stud-clara", name: "Transcript of Records (TOR)", status: "Submitted", submittedDate: "2026-05-12" },
  { id: "req-8", studentId: "stud-clara", name: "ID Picture (2x2)", status: "Submitted", submittedDate: "2026-05-11" },
  // College — Leandro Santiago
  { id: "req-13", studentId: "stud-leandro", name: "PSA Birth Certificate", status: "Submitted", submittedDate: "2026-05-22" },
  { id: "req-14", studentId: "stud-leandro", name: "Good Moral Certificate", status: "Pending" },
  { id: "req-15", studentId: "stud-leandro", name: "Transcript of Records (TOR)", status: "Pending" },
  { id: "req-16", studentId: "stud-leandro", name: "ID Picture (2x2)", status: "Submitted", submittedDate: "2026-05-22" }
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: "enr-01", studentId: "stud-enrico", schoolYear: "2026-2027", semester: "N/A",
    enrollmentType: "Old Student", status: "Enrolled", submittedAt: "2026-05-25 09:30",
    subjectCodes: ["SHS-ORAL-COM", "SHS-READ-WRITE", "SHS-GEN-MATH", "SHS-STAT-PROB", "SHS-EARTH-LIFE"],
    assessmentId: "as-enrico"
  },
  {
    id: "enr-02", studentId: "stud-clara", schoolYear: "2026-2027", semester: "First Semester",
    enrollmentType: "New Student", status: "Enrolled", submittedAt: "2026-05-26 11:22",
    subjectCodes: ["IT101", "IT102", "MATH101", "NSTP1"],
    assessmentId: "as-clara"
  },
  {
    id: "enr-03", studentId: "stud-katherine", schoolYear: "2026-2027", semester: "N/A",
    enrollmentType: "New Student", status: "Pending", submittedAt: "2026-05-28 14:15",
    subjectCodes: ["SHS-ABM-OBA", "SHS-ABM-PRIN"]
  },
  {
    id: "enr-04", studentId: "stud-miguel", schoolYear: "2026-2027", semester: "N/A",
    enrollmentType: "Returnee", status: "Approved", submittedAt: "2026-05-27 10:05",
    subjectCodes: ["SHS-HUMSS-PCOM", "SHS-HUMSS-CW", "SHS-HUMSS-DISP"],
    assessmentId: "as-miguel"
  },
  {
    id: "enr-05", studentId: "stud-juan", schoolYear: "2026-2027", semester: "First Semester",
    enrollmentType: "Old Student", status: "Enrolled", submittedAt: "2026-05-26 09:00",
    subjectCodes: ["BA201", "BA202"],
    assessmentId: "as-juan"
  }
];

export const MOCK_ASSESSMENTS: StudentAssessment[] = [
  {
    id: "as-enrico", studentId: "stud-enrico", schoolYear: "2026-2027", semester: "First Semester",
    fees: [
      { feeName: "Tuition Fee (Flat SHS)", category: "Tuition", amount: 18000 },
      { feeName: "Registration & Misc Fee", category: "Miscellaneous", amount: 4500 },
      { feeName: "Computer Laboratory Fee", category: "Laboratory", amount: 3500 },
      { feeName: "Student Council / ID Validation", category: "ID/Other", amount: 1200 }
    ],
    totalAmount: 27200, discountPercentage: 10, discountAmount: 2720,
    scholarshipName: "Family Discount (10%)", paymentTerm: "Installment - 4 Payments", balance: 14480
  },
  {
    id: "as-clara", studentId: "stud-clara", schoolYear: "2026-2027", semester: "First Semester",
    fees: [
      { feeName: "Tuition Fee (12 Units × ₱950/Unit)", category: "Tuition", amount: 11400 },
      { feeName: "Registration & Library Fee", category: "Miscellaneous", amount: 5200 },
      { feeName: "Laboratory Fee (Coding Labs)", category: "Laboratory", amount: 4000 },
      { feeName: "University ID Card Fee", category: "ID/Other", amount: 1500 }
    ],
    totalAmount: 22100, discountPercentage: 0, discountAmount: 0,
    paymentTerm: "Cash", balance: 0
  },
  {
    id: "as-miguel", studentId: "stud-miguel", schoolYear: "2026-2027", semester: "First Semester",
    fees: [
      { feeName: "Tuition Fee (Flat SHS)", category: "Tuition", amount: 18000 },
      { feeName: "Registration & Misc Fee", category: "Miscellaneous", amount: 4500 },
      { feeName: "Computer Laboratory Fee", category: "Laboratory", amount: 3500 }
    ],
    totalAmount: 26000, discountPercentage: 100, discountAmount: 26000,
    scholarshipName: "STSN Presidential Scholarship (Full Academic)", paymentTerm: "Cash", balance: 0
  },
  {
    id: "as-juan", studentId: "stud-juan", schoolYear: "2026-2027", semester: "First Semester",
    fees: [
      { feeName: "Tuition Fee (6 Units × ₱950/Unit)", category: "Tuition", amount: 5700 },
      { feeName: "Registration & Misc Fee", category: "Miscellaneous", amount: 4500 }
    ],
    totalAmount: 10200, discountPercentage: 0, discountAmount: 0,
    paymentTerm: "Installment - 2 Payments", balance: 5100
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay-1", studentId: "stud-enrico", amount: 10000, paymentDate: "2026-05-25 10:00",
    paymentMethod: "GCash", orNumber: "OR-2026-89421", term: "Downpayment",
    remarks: "Initial enrollment downpayment"
  },
  {
    id: "pay-2", studentId: "stud-clara", amount: 22100, paymentDate: "2026-05-26 11:45",
    paymentMethod: "Bank Transfer", orNumber: "OR-2026-89422", term: "Full Payment",
    remarks: "Full Tuition & Misc Fees Payment"
  },
  {
    id: "pay-3", studentId: "stud-juan", amount: 5100, paymentDate: "2026-05-27 09:30",
    paymentMethod: "GCash", orNumber: "OR-2026-89423", term: "Downpayment",
    remarks: "First semester downpayment"
  }
];

export const MOCK_GRADES: Grade[] = [
  // Enrico Veloso (Grade 11 - STEM)
  { id: "gr-1", studentId: "stud-enrico", subjectCode: "SHS-ORAL-COM", teacherId: "teach-beatriz", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: 88, finalGrade: 91, remarks: "Passed" },
  { id: "gr-2", studentId: "stud-enrico", subjectCode: "SHS-GEN-MATH", teacherId: "teach-beatriz", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: 84, finalGrade: 89, remarks: "Passed" },
  { id: "gr-3", studentId: "stud-enrico", subjectCode: "SHS-EARTH-LIFE", teacherId: "teach-beatriz", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: 92, finalGrade: 94, remarks: "Passed" },
  // Maria Clara Dela Cruz (BSIT - College)
  { id: "gr-4", studentId: "stud-clara", subjectCode: "IT101", teacherId: "teach-arthur", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: 90, finalGrade: 93, remarks: "Passed" },
  { id: "gr-5", studentId: "stud-clara", subjectCode: "IT102", teacherId: "teach-arthur", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: 87, finalGrade: 91, remarks: "Passed" },
  // Juan Luna (BSBA)
  { id: "gr-6", studentId: "stud-juan", subjectCode: "BA201", teacherId: "teach-carlo", schoolYear: "2026-2027", semester: "First Semester", midtermGrade: 82, finalGrade: 85, remarks: "Passed" }
];

export const MOCK_SCHEDULES: Schedule[] = [
  // Grade 11 St. Thomas (STEM)
  { id: "sch-1", subjectCode: "SHS-ORAL-COM", subjectName: "Oral Communication", teacherName: "Mrs. Beatriz Cruz", section: "St. Thomas", day: "Mon/Wed", time: "08:00 AM - 09:30 AM", room: "SHS-Room 201" },
  { id: "sch-2", subjectCode: "SHS-READ-WRITE", subjectName: "Reading and Writing", teacherName: "Mrs. Beatriz Cruz", section: "St. Thomas", day: "Mon/Wed", time: "09:45 AM - 11:15 AM", room: "SHS-Room 201" },
  { id: "sch-3", subjectCode: "SHS-GEN-MATH", subjectName: "General Mathematics", teacherName: "Mr. Arthur Reyes", section: "St. Thomas", day: "Tue/Thu", time: "08:30 AM - 10:00 AM", room: "Math Lab B" },
  { id: "sch-4", subjectCode: "SHS-STAT-PROB", subjectName: "Statistics and Probability", teacherName: "Mrs. Beatriz Cruz", section: "St. Thomas", day: "Tue/Thu", time: "10:15 AM - 11:45 AM", room: "SHS-Room 201" },
  { id: "sch-5", subjectCode: "SHS-EARTH-LIFE", subjectName: "Earth and Life Science", teacherName: "Dr. Ronald San Juan", section: "St. Thomas", day: "Friday", time: "08:00 AM - 11:00 AM", room: "Science Lab 1" },
  // College IT101
  { id: "sch-6", subjectCode: "IT101", subjectName: "Introduction to Computing", teacherName: "Arthur Reyes", section: "IT101", day: "Mon/Wed/Fri", time: "01:00 PM - 02:00 PM", room: "ComLab 3" },
  { id: "sch-7", subjectCode: "IT102", subjectName: "Computer Programming 1", teacherName: "Arthur Reyes", section: "IT101", day: "Tue/Thu", time: "01:30 PM - 03:00 PM", room: "ComLab 4" }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Start of First Semester School Year 2026-2027",
    content: "We are pleased to welcome all new and continuing students to St. Theresa School (STSN Connect). Standard classes for both Basic Education and College Departments will officially kick off on June 8, 2026. Please complete your physical requirements submission by June 12.",
    date: "2026-05-20", category: "Academic", author: "Registrar's Office"
  },
  {
    id: "ann-2",
    title: "Guidelines on Dynamic Installment Payments",
    content: "The Accounting Office is pleased to introduce flexible payment terms for SY 2026-2027. Students can now pay via Cash, Semestral (2 Payments), or Quarterly (4 Payments) installment schemes directly available in their STSN Connect portal. Payment channels like GCash, Maya, and BDO Bank Transfer are 100% active.",
    date: "2026-05-24", category: "Billing", author: "Accounting Office"
  },
  {
    id: "ann-3",
    title: "STSN Senior High Sports Intramurals 2026",
    content: "Signups for STSN Golden Lions sports teams (Basketball, Volleyball, Badminton, and Chess) are officially active from June 2 to June 10. Forms are available at the student sports council bureau.",
    date: "2026-05-28", category: "Event", author: "Student Council"
  },
  {
    id: "ann-4",
    title: "Enrollment Period for SY 2027-2028 Now Open",
    content: "The enrollment window for School Year 2027-2028 is officially open from June 1 to June 30, 2027. All continuing students are encouraged to complete the online pre-enrollment form through the STSN Connect Student Portal.",
    date: "2026-06-01", category: "Academic", author: "Registrar's Office"
  }
];

export const MOCK_EVENTS: SchoolEvent[] = [
  { id: "ev-1", title: "General Orientation for Freshmen & New Students", description: "Mandatory campus and portal guide held at the Theresa Hall Gym.", date: "2026-06-03", department: "All" },
  { id: "ev-2", title: "College IT Fair And Programming Exhibition", description: "BSIT and tech showcase on artificial intelligence & software systems.", date: "2026-06-18", department: "College" },
  { id: "ev-3", title: "SHS Acquaintance Night 2026", description: "Social networking and dance gathering for Senior High School strands.", date: "2026-06-25", department: "Basic Education" }
];

export const STARTING_PAYROLL: PayrollRow[] = [
  {
    id: "payr-01", employeeId: "emp-registrar", employeeName: "Cynthia Ramos", position: "Senior Registrar",
    basicSalary: 42000, allowances: 3500, sssDeduction: 1200, philhealthDeduction: 650, pagibigDeduction: 150, taxDeduction: 3100, netPay: 40400,
    period: "May 16 - 31, 2026", status: "Paid"
  },
  {
    id: "payr-02", employeeId: "emp-accounting", employeeName: "Eduardo Bonto", position: "Chief Accountant",
    basicSalary: 58000, allowances: 4200, sssDeduction: 1600, philhealthDeduction: 800, pagibigDeduction: 150, taxDeduction: 5200, netPay: 54450,
    period: "May 16 - 31, 2026", status: "Paid"
  },
  {
    id: "payr-03", employeeId: "emp-hr", employeeName: "Gemma Santos", position: "HR Manager",
    basicSalary: 45000, allowances: 3500, sssDeduction: 1300, philhealthDeduction: 700, pagibigDeduction: 150, taxDeduction: 3500, netPay: 42850,
    period: "May 16 - 31, 2026", status: "Paid"
  }
];
