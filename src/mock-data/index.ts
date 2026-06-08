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
  PayrollRow,
  SetupItem,
  DiscountType,
  DiscountRequest,
  ClassSchedule,
  LearningMaterial,
  SchoolSection,
  Room
} from "../types";

export const MOCK_USERS: User[] = [
  // ---- SUPER ADMIN (both schools) ----
  { id: "user-admin", email: "admin@stsn.edu.ph", name: "Admin Administrator", role: "SUPER_ADMIN", isActive: true, avatarUrl: "", department: "Administration" },
  // ---- St. Theresa's School of Novaliches (STSN) ----
  { id: "user-registrar", schoolId: "STSN", email: "registrar@stsn.edu.ph", name: "Cynthia Ramos, LPT", role: "REGISTRAR", isActive: true, avatarUrl: "", department: "Support" },
  { id: "user-accounting", schoolId: "STSN", email: "accounting@stsn.edu.ph", name: "Eduardo Bonto, CPA", role: "ACCOUNTING", isActive: true, avatarUrl: "", department: "Support" },
  { id: "user-teacher", schoolId: "STSN", email: "teacher@stsn.edu.ph", name: "Prof. Arthur Reyes", role: "TEACHER", isActive: true, avatarUrl: "", department: "College" },
  { id: "user-student", schoolId: "STSN", email: "student@stsn.edu.ph", name: "Enrico Veloso", role: "STUDENT", isActive: true, avatarUrl: "", department: "Basic Education" },
  { id: "user-hr", schoolId: "STSN", email: "hr@stsn.edu.ph", name: "Gemma Santos", role: "HR", isActive: true, avatarUrl: "", department: "Administration" },
  // ---- Colegio de Sta. Teresa de Avila (CDSTA) ----
  { id: "user-cdsta-admin", schoolId: "CDSTA", email: "admin@cdsta.edu.ph", name: "CDSTA Administrator", role: "ADMIN", isActive: true, avatarUrl: "", department: "Administration" },
  { id: "user-cdsta-registrar", schoolId: "CDSTA", email: "registrar@cdsta.edu.ph", name: "Maria Luz Aquino, LPT", role: "REGISTRAR", isActive: true, avatarUrl: "", department: "Support" },
  { id: "user-cdsta-accounting", schoolId: "CDSTA", email: "accounting@cdsta.edu.ph", name: "Jose Macaraig, CPA", role: "ACCOUNTING", isActive: true, avatarUrl: "", department: "Support" },
  { id: "user-cdsta-teacher", schoolId: "CDSTA", email: "teacher@cdsta.edu.ph", name: "Prof. Renato Villanueva", role: "TEACHER", isActive: true, avatarUrl: "", department: "College" },
  { id: "user-cdsta-student", schoolId: "CDSTA", email: "student@cdsta.edu.ph", name: "Maria Clara Dela Cruz", role: "STUDENT", isActive: true, avatarUrl: "", department: "College" },
  { id: "user-cdsta-hr", schoolId: "CDSTA", email: "hr@cdsta.edu.ph", name: "Teresa Navarro", role: "HR", isActive: true, avatarUrl: "", department: "Administration" },
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
  // ---- STSN Teachers ----
  {
    id: "teach-arthur", schoolId: "STSN", firstName: "Arthur", lastName: "Reyes", middleName: "Panganiban",
    department: "College", email: "arthur.reyes@stsn.edu.ph", phone: "+639151231122",
    specialization: "Information Technology & Computer Networks", advisorySection: "IT101", isActive: true
  },
  {
    id: "teach-beatriz", schoolId: "STSN", firstName: "Beatriz", lastName: "Cruz", middleName: "Soriano",
    department: "Basic Education", email: "beatriz.cruz@stsn.edu.ph", phone: "+639163211155",
    specialization: "General Mathematics & Statistics", advisorySection: "St. Thomas", isActive: true
  },
  {
    id: "teach-carlo", schoolId: "STSN", firstName: "Carlo", lastName: "Vergara", middleName: "Dizon",
    department: "College", email: "carlo.vergara@stsn.edu.ph", phone: "+639174567890",
    specialization: "Business Economics & Finance", advisorySection: "BA201", isActive: true
  },
  {
    id: "teach-elena", schoolId: "STSN", firstName: "Elena", lastName: "Soriano", middleName: "Basa",
    department: "Basic Education", email: "elena.soriano@stsn.edu.ph", phone: "+639182345678",
    specialization: "English Language & Literature", advisorySection: "St. Paul", isActive: true
  },
  // ---- CDSTA Teachers ----
  {
    id: "teach-renato", schoolId: "CDSTA", firstName: "Renato", lastName: "Villanueva", middleName: "De Vera",
    department: "College", email: "teacher@cdsta.edu.ph", phone: "+639205551001",
    specialization: "Programming & Software Engineering", advisorySection: "BSIT-1A", isActive: true
  },
  {
    id: "teach-lorena", schoolId: "CDSTA", firstName: "Lorena", lastName: "Castaneda", middleName: "Sabado",
    department: "College", email: "lorena.castaneda@cdsta.edu.ph", phone: "+639205551002",
    specialization: "Accounting & Finance", advisorySection: "BSA-2A", isActive: true
  },
  {
    id: "teach-jerome", schoolId: "CDSTA", firstName: "Jerome", lastName: "Navarro", middleName: "Cayco",
    department: "College", email: "jerome.navarro@cdsta.edu.ph", phone: "+639205551003",
    specialization: "Business Administration & Management", advisorySection: "BSBA-1A", isActive: true
  },
  {
    id: "teach-fe", schoolId: "CDSTA", firstName: "Fe", lastName: "Domingo", middleName: "Lacson",
    department: "College", email: "fe.domingo@cdsta.edu.ph", phone: "+639205551004",
    specialization: "Hospitality Management", advisorySection: "BSHM-1A", isActive: true
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  // ---- STSN Employees ----
  { id: "emp-registrar", schoolId: "STSN", firstName: "Cynthia", lastName: "Ramos", middleName: "Bautista", email: "registrar@stsn.edu.ph", position: "Senior Registrar", positionTitle: "Senior Registrar", department: "Registrar", salary: 42000, status: "Full-Time", leaveBalance: 15, contact: "+639171000101", address: "#5 Rosario St., Novaliches, QC", emergencyContact: "Lino Ramos +639171000200" },
  { id: "emp-accounting", schoolId: "STSN", firstName: "Eduardo", lastName: "Bonto", middleName: "Marasigan", email: "accounting@stsn.edu.ph", position: "Chief Accountant", positionTitle: "Chief Accountant / CPA", department: "Accounting", salary: 58000, status: "Full-Time", leaveBalance: 18, contact: "+639171000102", address: "#12 Avocado St., Fairview, QC", emergencyContact: "Lily Bonto +639171000201" },
  { id: "emp-hr", schoolId: "STSN", firstName: "Gemma", lastName: "Santos", middleName: "Macaraig", email: "hr@stsn.edu.ph", position: "HR Manager", positionTitle: "Human Resources Manager", department: "HR", salary: 45000, status: "Full-Time", leaveBalance: 14, contact: "+639171000103", address: "#8 Sampaguita Ave., Novaliches, QC", emergencyContact: "Ramon Santos +639171000202" },
  { id: "emp-assistant", schoolId: "STSN", firstName: "Ronaldo", lastName: "Mercado", middleName: "Guevara", email: "ronald.mercado@stsn.edu.ph", position: "Administrative Assistant", positionTitle: "Administrative Assistant I", department: "Administration", salary: 22000, status: "Full-Time", leaveBalance: 12, contact: "+639171000104", address: "#3 Maligaya Rd., Novaliches, QC", emergencyContact: "Luz Mercado +639171000203" },
  { id: "emp-stsn-05", schoolId: "STSN", firstName: "Mariflor", lastName: "Belen", middleName: "Dela Torre", email: "mariflor.belen@stsn.edu.ph", position: "Guidance Counselor", positionTitle: "Guidance Counselor", department: "Administration", salary: 32000, status: "Full-Time", leaveBalance: 15, contact: "+639171000105", address: "#21 Kaibigan St., Novaliches, QC", emergencyContact: "Carlos Belen +639171000204" },
  { id: "emp-stsn-06", schoolId: "STSN", firstName: "Roberto", lastName: "Espino", middleName: "Tanedo", email: "roberto.espino@stsn.edu.ph", position: "Librarian", positionTitle: "Head Librarian", department: "Administration", salary: 28000, status: "Full-Time", leaveBalance: 15, contact: "+639171000106", address: "#7 Limasawa St., Novaliches, QC", emergencyContact: "Fe Espino +639171000205" },
  { id: "emp-stsn-07", schoolId: "STSN", firstName: "Natividad", lastName: "Pareja", middleName: "Cabrera", email: "natividad.pareja@stsn.edu.ph", position: "School Nurse", positionTitle: "Registered Nurse", department: "Administration", salary: 27000, status: "Full-Time", leaveBalance: 15, contact: "+639171000107", address: "#15 Bahaghari St., Novaliches, QC", emergencyContact: "Pedro Pareja +639171000206" },
  { id: "emp-stsn-08", schoolId: "STSN", firstName: "Danilo", lastName: "Cruz", middleName: "Poblete", email: "danilo.cruz@stsn.edu.ph", position: "Instructor", positionTitle: "Instructor I — Math Dept.", department: "Basic Education", salary: 30000, status: "Full-Time", leaveBalance: 15, contact: "+639171000108", address: "#4 Kalayaan Blvd., Novaliches, QC", emergencyContact: "Elena Cruz +639171000207" },
  { id: "emp-stsn-09", schoolId: "STSN", firstName: "Leonora", lastName: "Viray", middleName: "Sison", email: "leonora.viray@stsn.edu.ph", position: "Instructor", positionTitle: "Instructor II — English Dept.", department: "Basic Education", salary: 31000, status: "Part-Time", leaveBalance: 7, contact: "+639171000109", address: "#6 Maharlika St., Novaliches, QC", emergencyContact: "Domingo Viray +639171000208" },
  { id: "emp-stsn-10", schoolId: "STSN", firstName: "Cesar", lastName: "Bonifacio", middleName: "Salanga", email: "cesar.bonifacio@stsn.edu.ph", position: "Instructor", positionTitle: "Instructor I — Science Dept.", department: "Basic Education", salary: 30000, status: "Contractual", leaveBalance: 5, contact: "+639171000110", address: "#19 Katipunan St., Novaliches, QC", emergencyContact: "Nenita Bonifacio +639171000209" },
  // ---- CDSTA Employees ----
  { id: "emp-cdsta-01", schoolId: "CDSTA", firstName: "Maria Luz", lastName: "Aquino", middleName: "Bañez", email: "registrar@cdsta.edu.ph", position: "Senior Registrar", positionTitle: "Senior Registrar", department: "Registrar", salary: 44000, status: "Full-Time", leaveBalance: 15, contact: "+639205552001", address: "#10 Sto. Tomas St., Novaliches, QC", emergencyContact: "Jose Aquino +639205552100" },
  { id: "emp-cdsta-02", schoolId: "CDSTA", firstName: "Jose", lastName: "Macaraig", middleName: "Reyes", email: "accounting@cdsta.edu.ph", position: "Chief Accountant", positionTitle: "Chief Accountant / CPA", department: "Accounting", salary: 60000, status: "Full-Time", leaveBalance: 18, contact: "+639205552002", address: "#22 Sta. Cruz St., Novaliches, QC", emergencyContact: "Alma Macaraig +639205552101" },
  { id: "emp-cdsta-03", schoolId: "CDSTA", firstName: "Teresa", lastName: "Navarro", middleName: "Ramos", email: "hr@cdsta.edu.ph", position: "HR Manager", positionTitle: "Human Resources Manager", department: "HR", salary: 46000, status: "Full-Time", leaveBalance: 14, contact: "+639205552003", address: "#5 Brgy. Pasong Putik, Novaliches, QC", emergencyContact: "Luis Navarro +639205552102" },
  { id: "emp-cdsta-04", schoolId: "CDSTA", firstName: "Renato", lastName: "Villanueva", middleName: "De Vera", email: "teacher@cdsta.edu.ph", position: "Associate Professor", positionTitle: "Associate Professor — IT", department: "College", salary: 52000, status: "Full-Time", leaveBalance: 15, contact: "+639205552004", address: "#8 Commonwealth Ave., Ext.", emergencyContact: "Anita Villanueva +639205552103" },
  { id: "emp-cdsta-05", schoolId: "CDSTA", firstName: "Lorena", lastName: "Castaneda", middleName: "Sabado", email: "lorena.castaneda@cdsta.edu.ph", position: "Instructor", positionTitle: "Instructor II — Accounting", department: "Accounting", salary: 38000, status: "Full-Time", leaveBalance: 15, contact: "+639205552005", address: "#17 BF Homes, Quezon City", emergencyContact: "Mario Castaneda +639205552104" },
  { id: "emp-cdsta-06", schoolId: "CDSTA", firstName: "Jerome", lastName: "Navarro", middleName: "Cayco", email: "jerome.navarro@cdsta.edu.ph", position: "Instructor", positionTitle: "Instructor III — Business", department: "College", salary: 36000, status: "Full-Time", leaveBalance: 15, contact: "+639205552006", address: "#3 Congressional Ave., QC", emergencyContact: "Carla Navarro +639205552105" },
  { id: "emp-cdsta-07", schoolId: "CDSTA", firstName: "Elisa", lastName: "Medina", middleName: "Flores", email: "elisa.medina@cdsta.edu.ph", position: "Administrative Assistant", positionTitle: "Admin. Assistant II", department: "Administration", salary: 24000, status: "Full-Time", leaveBalance: 12, contact: "+639205552007", address: "#9 Villa Carmel Subd., QC", emergencyContact: "Pedro Medina +639205552106" },
  { id: "emp-cdsta-08", schoolId: "CDSTA", firstName: "Armando", lastName: "Lajom", middleName: "Santos", email: "armando.lajom@cdsta.edu.ph", position: "Campus Security Head", positionTitle: "Security Head / Senior Guard", department: "Administration", salary: 20000, status: "Full-Time", leaveBalance: 10, contact: "+639205552008", address: "#45 Muñoz, Novaliches, QC", emergencyContact: "Rosa Lajom +639205552107" },
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
    paymentTerm: "Cash Basis", balance: 0
  },
  {
    id: "as-miguel", studentId: "stud-miguel", schoolYear: "2026-2027", semester: "First Semester",
    fees: [
      { feeName: "Tuition Fee (Flat SHS)", category: "Tuition", amount: 18000 },
      { feeName: "Registration & Misc Fee", category: "Miscellaneous", amount: 4500 },
      { feeName: "Computer Laboratory Fee", category: "Laboratory", amount: 3500 }
    ],
    totalAmount: 26000, discountPercentage: 100, discountAmount: 26000,
    scholarshipName: "STSN Presidential Scholarship (Full Academic)", paymentTerm: "Cash Basis", balance: 0
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

// ============================================================
// CORE SETUP SEED DATA
// ============================================================
const d = (id: string, code: string, name: string, desc?: string, extra?: Record<string, any>): SetupItem => ({
  id, code, name, description: desc, isActive: true, createdAt: "2026-01-01", createdBy: "Admin Administrator", ...extra
});

export const MOCK_SETUP_DATA: Record<string, SetupItem[]> = {
  academic_categories: [
    d("ac-1","PRESCH","Preschool Education","Early childhood learning"),
    d("ac-2","PRIM","Primary Education","Grades 1 to 3"),
    d("ac-3","INT","Intermediate Education","Grades 4 to 6"),
    d("ac-4","JHS","Junior High School","Grades 7 to 10"),
    d("ac-5","SHS","Senior High School","Grades 11 to 12"),
    d("ac-6","COL","College / Tertiary","Undergraduate degree programs"),
  ],
  academic_levels: [
    d("al-1","PRESCH","Preschool","Preschool level",{category:"Preschool Education"}),
    d("al-2","ELEM","Elementary","Primary & Intermediate",{category:"Primary Education"}),
    d("al-3","JHS","Junior High School","Grades 7-10",{category:"Junior High School"}),
    d("al-4","SHS","Senior High School","Grades 11-12",{category:"Senior High School"}),
    d("al-5","COLL","College","Tertiary level",{category:"College / Tertiary"}),
  ],
  year_levels: [
    d("yl-1","NURS","Nursery","",{level:0,academicLevel:"Preschool"}),
    d("yl-2","K1","Kinder 1","",{level:1,academicLevel:"Preschool"}),
    d("yl-3","K2","Kinder 2","",{level:2,academicLevel:"Preschool"}),
    d("yl-4","G1","Grade 1","",{level:3,academicLevel:"Elementary"}),
    d("yl-5","G2","Grade 2","",{level:4,academicLevel:"Elementary"}),
    d("yl-6","G3","Grade 3","",{level:5,academicLevel:"Elementary"}),
    d("yl-7","G4","Grade 4","",{level:6,academicLevel:"Elementary"}),
    d("yl-8","G5","Grade 5","",{level:7,academicLevel:"Elementary"}),
    d("yl-9","G6","Grade 6","",{level:8,academicLevel:"Elementary"}),
    d("yl-10","G7","Grade 7","",{level:9,academicLevel:"Junior High School"}),
    d("yl-11","G8","Grade 8","",{level:10,academicLevel:"Junior High School"}),
    d("yl-12","G9","Grade 9","",{level:11,academicLevel:"Junior High School"}),
    d("yl-13","G10","Grade 10","",{level:12,academicLevel:"Junior High School"}),
    d("yl-14","G11","Grade 11","",{level:13,academicLevel:"Senior High School"}),
    d("yl-15","G12","Grade 12","",{level:14,academicLevel:"Senior High School"}),
    d("yl-16","Y1","1st Year","",{level:15,academicLevel:"College"}),
    d("yl-17","Y2","2nd Year","",{level:16,academicLevel:"College"}),
    d("yl-18","Y3","3rd Year","",{level:17,academicLevel:"College"}),
    d("yl-19","Y4","4th Year","",{level:18,academicLevel:"College"}),
  ],
  school_years: [
    d("sy-1","SY2024","2024-2025","",{startDate:"2024-06-01",endDate:"2025-03-31",isCurrent:false}),
    d("sy-2","SY2025","2025-2026","",{startDate:"2025-06-01",endDate:"2026-03-31",isCurrent:false}),
    d("sy-3","SY2026","2026-2027","",{startDate:"2026-06-01",endDate:"2027-03-31",isCurrent:true}),
  ],
  semesters: [
    d("sem-1","SEM1","First Semester","August to December",{semesterNumber:1}),
    d("sem-2","SEM2","Second Semester","January to May",{semesterNumber:2}),
    d("sem-3","SUM","Summer","May to June",{semesterNumber:3}),
    d("sem-4","FY","Full Year","June to March — Basic Ed",{semesterNumber:0}),
  ],
  departments: [
    d("dept-1","BASED","Basic Education","K-12 department"),
    d("dept-2","COLL","College","Tertiary programs"),
    d("dept-3","ACCT","Accounting","Finance and billing"),
    d("dept-4","REGR","Registrar","Records management"),
    d("dept-5","HR","Human Resources","Staff management"),
    d("dept-6","ADMIN","Administration","Executive office"),
  ],
  holidays: [
    d("hol-1","RH-NY","New Year's Day","January 1",{date:"2027-01-01",holidayType:"Regular"}),
    d("hol-2","RH-PNR","Pampanga National Day","April 9",{date:"2027-04-09",holidayType:"Regular"}),
    d("hol-3","RH-LD","Labor Day","May 1",{date:"2027-05-01",holidayType:"Regular"}),
    d("hol-4","RH-IND","Independence Day","June 12",{date:"2027-06-12",holidayType:"Regular"}),
    d("hol-5","SH-NDSR","National Day of Sacrifice for Rizal","December 30",{date:"2027-12-30",holidayType:"Special Non-Working"}),
  ],
  admission_types: [
    d("at-1","NEW","New Student","First time enrollment"),
    d("at-2","OLD","Old Student / Continuing","Returning from previous year"),
    d("at-3","TRANS","Transferee","Coming from another school"),
    d("at-4","RET","Returnee","Readmitted after absence"),
    d("at-5","CROSS","Cross-Enrollee","Enrolled in another school"),
  ],
  enrollment_requirements: [
    d("er-1","PSA","PSA Birth Certificate","Original and photocopy",{isRequired:true}),
    d("er-2","GMC","Good Moral Certificate","From previous school",{isRequired:true}),
    d("er-3","TOR","Transcript of Records","Official TOR from last school",{isRequired:true}),
    d("er-4","F137","Form 137 / SF9","For basic education",{isRequired:true}),
    d("er-5","2X2","ID Picture (2x2)","Recent photo on white background",{isRequired:true}),
    d("er-6","BRGY","Barangay Clearance","For new students",{isRequired:false}),
  ],
  student_statuses: [
    d("ss-1","ENRL","Enrolled","Currently enrolled and active"),
    d("ss-2","PEND","Pending","Application under review"),
    d("ss-3","APPR","Approved","Enrollment approved, pending payment"),
    d("ss-4","REJ","Rejected","Application denied"),
    d("ss-5","LOA","Leave of Absence","Temporary leave"),
    d("ss-6","DROP","Dropped","Officially dropped enrollment"),
    d("ss-7","GRAD","Graduated","Completed program"),
  ],
  campuses: [
    d("camp-1","STSN","St. Theresa's School of Novaliches","Main campus",{address:"Novaliches, Quezon City",contactNo:"+63 2 1234 5678"}),
    d("camp-2","CDSTA","Colegio de Sta. Teresa de Avila","College campus",{address:"Novaliches, Quezon City",contactNo:"+63 2 8765 4321"}),
  ],
  buildings: [
    d("bld-1","MAIN","Main Building","Primary academic building",{campusId:"camp-1",numberOfFloors:4}),
    d("bld-2","SCI","Science Building","Laboratories and science rooms",{campusId:"camp-1",numberOfFloors:3}),
    d("bld-3","GYM","Gymnasium","Sports and events venue",{campusId:"camp-1",numberOfFloors:1}),
    d("bld-4","COLL-MAIN","College Main Building","",{campusId:"camp-2",numberOfFloors:5}),
    d("bld-5","LIB","Library Building","Academic resources",{campusId:"camp-1",numberOfFloors:2}),
  ],
  room_types: [
    d("rt-1","REG","Regular Classroom","Standard learning room",{maxCapacity:45}),
    d("rt-2","LAB","Computer Laboratory","IT lab",{maxCapacity:35}),
    d("rt-3","SCI","Science Laboratory","Science experiments",{maxCapacity:30}),
    d("rt-4","LANG","Language Laboratory","Audio-visual language room",{maxCapacity:30}),
    d("rt-5","LEC","Lecture Hall","Large lecture venue",{maxCapacity:120}),
    d("rt-6","CONF","Conference Room","Meetings and deliberations",{maxCapacity:20}),
    d("rt-7","AUD","Auditorium","Events and ceremonies",{maxCapacity:500}),
  ],
  rooms: [
    d("rm-1","101","Room 101","",{buildingId:"bld-1",roomTypeId:"rt-1",capacity:45}),
    d("rm-2","102","Room 102","",{buildingId:"bld-1",roomTypeId:"rt-1",capacity:45}),
    d("rm-3","201","Room 201","",{buildingId:"bld-1",roomTypeId:"rt-1",capacity:45}),
    d("rm-4","202","Room 202","",{buildingId:"bld-1",roomTypeId:"rt-1",capacity:45}),
    d("rm-5","SCI-L1","Science Lab 1","",{buildingId:"bld-2",roomTypeId:"rt-3",capacity:30}),
    d("rm-6","IT-L1","IT Lab 1","",{buildingId:"bld-2",roomTypeId:"rt-2",capacity:35}),
    d("rm-7","IT-L2","IT Lab 2","",{buildingId:"bld-2",roomTypeId:"rt-2",capacity:35}),
    d("rm-8","GYM-MAIN","Main Gym","",{buildingId:"bld-3",roomTypeId:"rt-7",capacity:500}),
  ],
  time_slots: [
    d("ts-1","7AM","07:00 AM - 08:00 AM","",{startTime:"07:00",endTime:"08:00",durationMinutes:60}),
    d("ts-2","8AM","08:00 AM - 09:00 AM","",{startTime:"08:00",endTime:"09:00",durationMinutes:60}),
    d("ts-3","9AM","09:00 AM - 10:00 AM","",{startTime:"09:00",endTime:"10:00",durationMinutes:60}),
    d("ts-4","10AM","10:00 AM - 11:00 AM","",{startTime:"10:00",endTime:"11:00",durationMinutes:60}),
    d("ts-5","11AM","11:00 AM - 12:00 PM","",{startTime:"11:00",endTime:"12:00",durationMinutes:60}),
    d("ts-6","1PM","01:00 PM - 02:00 PM","",{startTime:"13:00",endTime:"14:00",durationMinutes:60}),
    d("ts-7","2PM","02:00 PM - 03:00 PM","",{startTime:"14:00",endTime:"15:00",durationMinutes:60}),
    d("ts-8","3PM","03:00 PM - 04:00 PM","",{startTime:"15:00",endTime:"16:00",durationMinutes:60}),
    d("ts-9","4PM","04:00 PM - 05:00 PM","",{startTime:"16:00",endTime:"17:00",durationMinutes:60}),
    d("ts-10","7-9AM","07:00 AM - 09:00 AM","",{startTime:"07:00",endTime:"09:00",durationMinutes:120}),
    d("ts-11","9-11AM","09:00 AM - 11:00 AM","",{startTime:"09:00",endTime:"11:00",durationMinutes:120}),
    d("ts-12","1-3PM","01:00 PM - 03:00 PM","",{startTime:"13:00",endTime:"15:00",durationMinutes:120}),
    d("ts-13","3-5PM","03:00 PM - 05:00 PM","",{startTime:"15:00",endTime:"17:00",durationMinutes:120}),
  ],
  faculty_ranks: [
    d("fr-1","INST-1","Instructor I","Entry level instructor",{level:1}),
    d("fr-2","INST-2","Instructor II","",{level:2}),
    d("fr-3","INST-3","Instructor III","",{level:3}),
    d("fr-4","ASST-PROF-1","Assistant Professor I","",{level:4}),
    d("fr-5","ASST-PROF-2","Assistant Professor II","",{level:5}),
    d("fr-6","ASSOC-PROF","Associate Professor","",{level:6}),
    d("fr-7","PROF","Professor","Full professor rank",{level:7}),
  ],
  employment_types: [
    d("et-1","FT","Full-Time","Permanent full-time employee",{isFullTime:true}),
    d("et-2","PT","Part-Time","Part-time or fractional",{isFullTime:false}),
    d("et-3","CONT","Contractual","Fixed-term contract",{isFullTime:false}),
    d("et-4","COS","Contract of Service","Per project/semester",{isFullTime:false}),
  ],
  fee_categories: [
    d("fc-1","TUI","Tuition","Academic instruction fee"),
    d("fc-2","MISC","Miscellaneous","Registration, activity, insurance"),
    d("fc-3","LAB","Laboratory","Science and IT lab fees"),
    d("fc-4","ID","ID / Facilities","School ID and facilities"),
    d("fc-5","PEN","Penalty","Late payment penalties"),
    d("fc-6","OTHER","Other Fees","Miscellaneous uncategorized fees"),
  ],
  fee_items: [
    d("fi-1","SHS-TUI","SHS Tuition Fee","Standard SHS tuition",{categoryId:"fc-1",amount:18000}),
    d("fi-2","COL-TUI","College Tuition per Unit","Per credit unit",{categoryId:"fc-1",amount:950}),
    d("fi-3","REGFEE","Registration & Misc Fee","Annual registration",{categoryId:"fc-2",amount:4500}),
    d("fi-4","LABFEE","Computer Lab Fee","IT laboratory access",{categoryId:"fc-3",amount:3500}),
    d("fi-5","IDFEE","School ID / Facilities Fee","ID and campus access",{categoryId:"fc-4",amount:1000}),
    d("fi-6","LATEPEN","Late Payment Penalty","Monthly late penalty",{categoryId:"fc-5",amount:500}),
  ],
  payment_terms: [
    d("pt-1","CASH","Full Cash Payment","One-time full payment",{numberOfInstallments:1,downpaymentPercent:100}),
    d("pt-2","SEMI","Installment - 2 Payments","Semestral payment",{numberOfInstallments:2,downpaymentPercent:60}),
    d("pt-3","QTRLY","Installment - 4 Payments","Quarterly payment",{numberOfInstallments:4,downpaymentPercent:40}),
  ],
  payment_methods: [
    d("pm-1","CASH","Cash","Over-the-counter cash",{type:"Cash"}),
    d("pm-2","GCASH","GCash","Mobile wallet - GCash",{type:"Digital"}),
    d("pm-3","BDO","Bank Transfer (BDO)","BDO bank deposit/transfer",{type:"Bank"}),
    d("pm-4","BPI","Bank Transfer (BPI)","BPI bank deposit/transfer",{type:"Bank"}),
    d("pm-5","CC","Credit Card","Visa/Mastercard",{type:"Card"}),
    d("pm-6","CHECK","Manager's Check","Bank-certified check",{type:"Bank"}),
  ],
  chart_of_accounts: [
    d("coa-1","1000","Cash on Hand","",{accountType:"Asset",accountNo:"1000"}),
    d("coa-2","1100","Cash in Bank - BDO","",{accountType:"Asset",accountNo:"1100"}),
    d("coa-3","1200","Cash in Bank - BPI","",{accountType:"Asset",accountNo:"1200"}),
    d("coa-4","1300","Accounts Receivable - Students","",{accountType:"Asset",accountNo:"1300"}),
    d("coa-5","4000","Tuition Revenue","",{accountType:"Revenue",accountNo:"4000"}),
    d("coa-6","4100","Miscellaneous Revenue","",{accountType:"Revenue",accountNo:"4100"}),
    d("coa-7","4200","Laboratory Fee Revenue","",{accountType:"Revenue",accountNo:"4200"}),
    d("coa-8","5000","Salaries and Wages","",{accountType:"Expense",accountNo:"5000"}),
    d("coa-9","5100","SSS Contribution","",{accountType:"Expense",accountNo:"5100"}),
    d("coa-10","5200","PhilHealth Contribution","",{accountType:"Expense",accountNo:"5200"}),
  ],
  accounting_periods: [
    d("ap-1","AY2025-S1","AY 2025-2026 - First Semester","Aug 2025 to Dec 2025",{startDate:"2025-08-01",endDate:"2025-12-31",isClosed:true}),
    d("ap-2","AY2025-S2","AY 2025-2026 - Second Semester","Jan 2026 to May 2026",{startDate:"2026-01-01",endDate:"2026-05-31",isClosed:false}),
    d("ap-3","AY2026-S1","AY 2026-2027 - First Semester","Aug 2026 to Dec 2026",{startDate:"2026-08-01",endDate:"2026-12-31",isClosed:false}),
  ],
  or_series: [
    d("ors-1","OR2026","OR-2026-XXXXX","Official receipts for AY 2026-2027",{prefix:"OR-2026",currentSerial:10460,year:2026}),
    d("ors-2","OR2025","OR-2025-XXXXX","Official receipts for AY 2025-2026",{prefix:"OR-2025",currentSerial:8832,year:2025}),
  ],
  refund_reasons: [
    d("rr-1","OVERPY","Overpayment Refund","Amount paid exceeds assessment"),
    d("rr-2","CANCEL","Enrollment Cancellation","Student cancelled before start"),
    d("rr-3","DUP","Duplicate Payment","Payment recorded twice"),
    d("rr-4","SCHOL","Scholarship Grant Applied","Refund due to retroactive scholarship"),
  ],
  void_reasons: [
    d("vr-1","ERR","Data Entry Error","Incorrect receipt data"),
    d("vr-2","DUP","Duplicate Receipt","Receipt issued twice for same payment"),
    d("vr-3","CANCEL","Transaction Cancelled","Payment transaction reversed"),
    d("vr-4","WRONG-STU","Wrong Student","Receipt issued to incorrect student"),
  ],
  nationalities: [
    d("nat-1","FIL","Filipino","Philippine nationality"),
    d("nat-2","CHN","Chinese",""),
    d("nat-3","KOR","Korean",""),
    d("nat-4","JPN","Japanese",""),
    d("nat-5","USA","American",""),
    d("nat-6","OTHER","Other","Non-listed nationality"),
  ],
  civil_statuses: [
    d("cs-1","SGL","Single",""),
    d("cs-2","MAR","Married",""),
    d("cs-3","WIDW","Widowed",""),
    d("cs-4","SEP","Legally Separated",""),
    d("cs-5","ANN","Annulled",""),
  ],
  religions: [
    d("rel-1","CAT","Roman Catholic",""),
    d("rel-2","PROT","Protestant",""),
    d("rel-3","IGL","Iglesia ni Cristo",""),
    d("rel-4","ADB","Adventist",""),
    d("rel-5","ISLAM","Islam",""),
    d("rel-6","OTHER","Other Religion",""),
  ],
  student_types: [
    d("st-1","REG","Regular Student","Full-time enrolled"),
    d("st-2","IRREG","Irregular Student","Not following standard curriculum"),
    d("st-3","CROSS","Cross-Enrollee","Enrolled from another school"),
    d("st-4","SPEC","Special Student","Non-degree or certificate program"),
  ],
  grade_scales: [
    d("gs-1","A","1.00","Excellent",{minGrade:98,maxGrade:100,equivalent:"1.00",remarks:"Excellent"}),
    d("gs-2","B","1.25","Very Good",{minGrade:95,maxGrade:97,equivalent:"1.25",remarks:"Very Good"}),
    d("gs-3","C","1.50","Good",{minGrade:92,maxGrade:94,equivalent:"1.50",remarks:"Good"}),
    d("gs-4","D","1.75","Good",{minGrade:89,maxGrade:91,equivalent:"1.75",remarks:"Good"}),
    d("gs-5","E","2.00","Satisfactory",{minGrade:86,maxGrade:88,equivalent:"2.00",remarks:"Satisfactory"}),
    d("gs-6","F","2.25","Satisfactory",{minGrade:83,maxGrade:85,equivalent:"2.25",remarks:"Satisfactory"}),
    d("gs-7","G","2.50","Fair",{minGrade:80,maxGrade:82,equivalent:"2.50",remarks:"Fair"}),
    d("gs-8","H","2.75","Fair",{minGrade:77,maxGrade:79,equivalent:"2.75",remarks:"Fair"}),
    d("gs-9","I","3.00","Passing",{minGrade:75,maxGrade:76,equivalent:"3.00",remarks:"Passing"}),
    d("gs-10","F","5.00","Failed",{minGrade:0,maxGrade:74,equivalent:"5.00",remarks:"Failed"}),
  ],
  document_types: [
    d("dt-1","TOR","Transcript of Records","Official TOR",{isRequired:true}),
    d("dt-2","COR","Certificate of Registration","Semestral COR",{isRequired:false}),
    d("dt-3","DIPL","Diploma","Graduation diploma",{isRequired:false}),
    d("dt-4","CERT","Certificate of Good Moral","Moral character cert",{isRequired:true}),
    d("dt-5","PSA","PSA Birth Certificate","Civil registry cert",{isRequired:true}),
    d("dt-6","DISP","Certificate of Dismissal","Transfer credential",{isRequired:false}),
  ],
  collection_types: [
    d("ct-1","TUI","Tuition Collection","Regular tuition payments"),
    d("ct-2","MISC","Miscellaneous Collection","Misc fee payments"),
    d("ct-3","PEN","Penalty Collection","Late fee penalties"),
    d("ct-4","REFUND","Refund","Student refund transactions"),
    d("ct-5","ADJ","Adjustment","Assessment corrections"),
  ],
  // Workflow, Access Control & ID Card setup items
  roles_setup: [
    d("role-1","SUPER_ADMIN","Super Administrator","Full system access",{level:10}),
    d("role-2","ADMIN","Administrator","Module-level administration",{level:9}),
    d("role-3","REGISTRAR","Registrar","Enrollment and records",{level:7}),
    d("role-4","ACCOUNTING","Accounting Officer","Financial management",{level:7}),
    d("role-5","TEACHER","Teacher","Grade encoding and attendance",{level:5}),
    d("role-6","HR","HR Manager","Payroll and employee management",{level:6}),
    d("role-7","STUDENT","Student","Portal access only",{level:1}),
  ],
  permissions_setup: [
    d("perm-1","STUD_VIEW","View Students","Access student directory",{module:"Registrar"}),
    d("perm-2","STUD_CREATE","Create Students","Add new student records",{module:"Registrar"}),
    d("perm-3","STUD_EDIT","Edit Students","Modify student records",{module:"Registrar"}),
    d("perm-4","ENRL_APPROVE","Approve Enrollment","Approve/reject enrollments",{module:"Registrar"}),
    d("perm-5","PAY_VIEW","View Payments","Access payment history",{module:"Accounting"}),
    d("perm-6","PAY_POST","Post Payments","Record new payments",{module:"Accounting"}),
    d("perm-7","DISC_APPROVE","Approve Discounts","Approve discount requests",{module:"Accounting"}),
    d("perm-8","GRADE_ENCODE","Encode Grades","Submit and edit grades",{module:"Grading"}),
    d("perm-9","HR_PAYROLL","Process Payroll","Generate and post payroll",{module:"HR"}),
    d("perm-10","SETUP_MANAGE","Manage Setup","Configure system setup",{module:"Core Setup"}),
  ],
  id_card_templates: [
    d("ict-1","STSN-STUD","STSN Student ID 2026","Current student ID template",{campus:"St. Theresa's School",cardColor:"#5C4533",logoPath:"/logos/stsn.png"}),
    d("ict-2","CDSTA-STUD","Colegio Student ID 2026","College student ID template",{campus:"Colegio de Sta. Teresa",cardColor:"#1d4ed8",logoPath:"/logos/cdsta.png"}),
    d("ict-3","STAFF","Staff ID 2026","Employee and faculty ID",{campus:"Both",cardColor:"#4A3728",logoPath:"/logos/stsn.png"}),
  ],
  enrollment_workflows: [
    d("ew-1","BASIC-ED","Basic Education Enrollment Flow","K-12 enrollment process",{steps:["Application","Document Submission","Assessment","Payment","Approval"]}),
    d("ew-2","COLLEGE","College Enrollment Flow","Tertiary enrollment process",{steps:["Pre-enrollment","Requirements","Subject Selection","Assessment","Payment","Enrollment"]}),
    d("ew-3","TRANSFER","Transferee Enrollment Flow","Transferee process",{steps:["Application","Evaluation","Document Verification","Assessment","Approval"]}),
  ],
  clearance_workflows: [
    d("cw-1","SEM-CLEAR","Semestral Clearance","End of semester clearance",{departments:["Library","Accounting","Registrar","Subject Teachers","Dean/Principal"]}),
    d("cw-2","GRAD-CLEAR","Graduation Clearance","Pre-graduation clearance",{departments:["All Academic","Accounting","Registrar","Guidance","Alumni"]}),
  ],
};

// ============================================================
// DISCOUNT TYPES SEED DATA
// ============================================================
export const MOCK_DISCOUNT_TYPES: DiscountType[] = [
  {
    id: "dt-gov-1", code: "GOV-PWD", name: "PWD Discount",
    discountPercent: 20, discountSource: "Government",
    requiresApproval: false, description: "Persons with Disability - RA 10524",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-gov-2", code: "GOV-SP", name: "Solo Parent Discount",
    discountPercent: 10, discountSource: "Government",
    requiresApproval: false, description: "Children of solo parents - RA 8972",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-gov-3", code: "GOV-4PS", name: "4Ps / Pantawid Pamilya",
    discountPercent: 100, discountSource: "Government",
    requiresApproval: false, description: "Beneficiaries of DSWD Pantawid Pamilyang Pilipino Program",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-sib-1", code: "SIB-2", name: "2nd Sibling Discount",
    discountPercent: 5, discountSource: "Sibling",
    requiresApproval: true, maxBeneficiaries: 1,
    description: "5% discount for second sibling enrolled in the same school year",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-sib-2", code: "SIB-3", name: "3rd+ Sibling Discount",
    discountPercent: 10, discountSource: "Sibling",
    requiresApproval: true, maxBeneficiaries: 999,
    description: "10% discount for 3rd and subsequent siblings",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-own-1", code: "OWN-EMP", name: "Employee / Owner Dependent Discount",
    discountPercent: 100, discountSource: "Owner",
    requiresApproval: true, maxBeneficiaries: 3,
    description: "Full tuition waiver for qualified employee dependents",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-schol-1", code: "PRES-SCHOL", name: "Presidential Scholarship",
    discountPercent: 100, discountSource: "Scholarship",
    requiresApproval: true, maxBeneficiaries: 5,
    description: "Full academic scholarship for top-performing students",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-schol-2", code: "ACAD-SCHOL", name: "Academic Excellence Award",
    discountPercent: 50, discountSource: "Scholarship",
    requiresApproval: true, maxBeneficiaries: 10,
    description: "50% scholarship for Dean's Listers",
    isActive: true, createdAt: "2026-01-01"
  },
  {
    id: "dt-emp-1", code: "FAM-DISC", name: "Family Discount",
    discountPercent: 10, discountSource: "Employee",
    requiresApproval: false, description: "General family discount for staff members",
    isActive: true, createdAt: "2026-01-01"
  },
];

// ============================================================
// DISCOUNT REQUESTS SEED DATA
// ============================================================
export const MOCK_DISCOUNT_REQUESTS: DiscountRequest[] = [
  {
    id: "dreq-1",
    referenceNo: "DISC-2026-1001",
    studentId: "stud-enrico",
    studentName: "Enrico Veloso",
    studentNo: "STSN-2026-0121",
    discountTypeId: "dt-sib-1",
    discountTypeName: "2nd Sibling Discount",
    discountPercent: 5,
    requestedBy: "Eduardo Bonto, CPA",
    requestedAt: "2026-05-10 09:30",
    status: "Approved",
    siblingStudentIds: ["stud-g6-01"],
    siblingNames: ["Maria Clara Veloso"],
    level1Status: "Approved",
    level1ApprovedBy: "Cynthia Ramos, LPT",
    level1ApprovedAt: "2026-05-11 10:00",
    level2Status: "Approved",
    level2ApprovedBy: "Admin Administrator",
    level2ApprovedAt: "2026-05-12 14:30",
    remarks: "Verified sibling enrollment. Discount applied for AY 2026-2027.",
    attachmentNames: ["enrollment_proof_sibling.pdf"],
    auditTrail: [
      { id: "ae-1", action: "REQUEST_SUBMITTED", performedBy: "Eduardo Bonto, CPA", performedAt: "2026-05-10 09:30", details: "Discount request submitted for 2nd Sibling Discount" },
      { id: "ae-2", action: "LEVEL_1_APPROVED", performedBy: "Cynthia Ramos, LPT", performedAt: "2026-05-11 10:00", details: "Approved - Sibling enrollment verified in system" },
      { id: "ae-3", action: "LEVEL_2_APPROVED", performedBy: "Admin Administrator", performedAt: "2026-05-12 14:30", details: "Final approval granted. 5% discount applied." },
    ]
  },
  {
    id: "dreq-2",
    referenceNo: "DISC-2026-1002",
    studentId: "stud-g11-stem",
    studentName: "Gabrielle Torres",
    studentNo: "STSN-2026-0119",
    discountTypeId: "dt-gov-1",
    discountTypeName: "PWD Discount",
    discountPercent: 20,
    requestedBy: "Eduardo Bonto, CPA",
    requestedAt: "2026-05-14 11:00",
    status: "Pending",
    level1Status: "Pending",
    level2Status: "Pending",
    remarks: "",
    attachmentNames: ["pwd_id_scan.jpg"],
    auditTrail: [
      { id: "ae-4", action: "REQUEST_SUBMITTED", performedBy: "Eduardo Bonto, CPA", performedAt: "2026-05-14 11:00", details: "PWD Discount request submitted. Awaiting L1 approval." }
    ]
  },
  {
    id: "dreq-3",
    referenceNo: "DISC-2026-1003",
    studentId: "stud-bsit-1",
    studentName: "Andrei Santos",
    studentNo: "STSN-2026-0301",
    discountTypeId: "dt-sib-2",
    discountTypeName: "3rd+ Sibling Discount",
    discountPercent: 10,
    requestedBy: "Eduardo Bonto, CPA",
    requestedAt: "2026-05-20 14:00",
    status: "For Review",
    siblingStudentIds: ["stud-g11-stem","stud-g9-01"],
    siblingNames: ["Gabrielle Santos", "Paolo Santos"],
    level1Status: "Approved",
    level1ApprovedBy: "Cynthia Ramos, LPT",
    level1ApprovedAt: "2026-05-21 09:00",
    level2Status: "Pending",
    remarks: "L1 approved. Pending L2 final review.",
    attachmentNames: [],
    auditTrail: [
      { id: "ae-5", action: "REQUEST_SUBMITTED", performedBy: "Eduardo Bonto, CPA", performedAt: "2026-05-20 14:00", details: "3rd sibling discount request submitted" },
      { id: "ae-6", action: "LEVEL_1_APPROVED", performedBy: "Cynthia Ramos, LPT", performedAt: "2026-05-21 09:00", details: "Sibling IDs verified. Forwarded to L2." }
    ]
  },
];

// ============================================================
// CLASS SCHEDULES SEED DATA
// ============================================================
export const MOCK_CLASS_SCHEDULES: ClassSchedule[] = [
  {
    id: "csched-1",
    subjectCode: "IT-101", subjectName: "Introduction to Computing",
    teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    section: "BSIT-1A", roomName: "IT Lab 1",
    day: "Monday", startTime: "08:00", endTime: "10:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "College", yearLevel: "1st Year", courseOrTrack: "BSIT"
  },
  {
    id: "csched-2",
    subjectCode: "IT-101", subjectName: "Introduction to Computing",
    teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    section: "BSIT-1A", roomName: "IT Lab 1",
    day: "Wednesday", startTime: "08:00", endTime: "10:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "College", yearLevel: "1st Year", courseOrTrack: "BSIT"
  },
  {
    id: "csched-3",
    subjectCode: "CS-201", subjectName: "Data Structures & Algorithms",
    teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    section: "BSCS-2A", roomName: "IT Lab 2",
    day: "Tuesday", startTime: "10:00", endTime: "12:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "College", yearLevel: "2nd Year", courseOrTrack: "BSCS"
  },
  {
    id: "csched-4",
    subjectCode: "MATH-11", subjectName: "Pre-Calculus",
    teacherId: "teach-mariz", teacherName: "Ma. Mariz Dizon",
    section: "SHS-STEM-11A", roomName: "Room 201",
    day: "Monday", startTime: "07:00", endTime: "09:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "Basic Education", yearLevel: "Grade 11", courseOrTrack: "STEM"
  },
  {
    id: "csched-5",
    subjectCode: "MATH-11", subjectName: "Pre-Calculus",
    teacherId: "teach-mariz", teacherName: "Ma. Mariz Dizon",
    section: "SHS-STEM-11A", roomName: "Room 201",
    day: "Wednesday", startTime: "07:00", endTime: "09:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "Basic Education", yearLevel: "Grade 11", courseOrTrack: "STEM"
  },
  {
    id: "csched-6",
    subjectCode: "STEM-12A", subjectName: "Research in Daily Life",
    teacherId: "teach-mariz", teacherName: "Ma. Mariz Dizon",
    section: "SHS-STEM-12A", roomName: "Room 202",
    day: "Friday", startTime: "13:00", endTime: "16:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "Basic Education", yearLevel: "Grade 12", courseOrTrack: "STEM"
  },
  {
    id: "csched-7",
    subjectCode: "ENG-101", subjectName: "Purposive Communication",
    teacherId: "teach-aurora", teacherName: "Aurora Lim",
    section: "BSBA-1A", roomName: "Room 101",
    day: "Tuesday", startTime: "13:00", endTime: "15:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "College", yearLevel: "1st Year", courseOrTrack: "BSBA"
  },
  {
    id: "csched-8",
    subjectCode: "ENG-101", subjectName: "Purposive Communication",
    teacherId: "teach-aurora", teacherName: "Aurora Lim",
    section: "BSBA-1A", roomName: "Room 101",
    day: "Thursday", startTime: "13:00", endTime: "15:00",
    schoolYear: "2026-2027", semester: "First Semester",
    isActive: true, department: "College", yearLevel: "1st Year", courseOrTrack: "BSBA"
  },
];

// ============================================================
// LEARNING MATERIALS — STSN & CDSTA (LMS Demo Data)
// ============================================================
export const MOCK_LEARNING_MATERIALS: LearningMaterial[] = [
  // ---- STSN — Basic Education — Videos ----
  {
    id: "lm-stsn-v01", schoolId: "STSN",
    title: "Algebra Basics: Linear Equations Explained",
    description: "Comprehensive introduction to solving linear equations with step-by-step examples and practice problems for Grade 9 students.",
    subjectCode: "JHS-MATH9", subjectName: "Mathematics 9 (Algebra)",
    section: "St. Mark", teacherId: "teach-beatriz", teacherName: "Prof. Beatriz Cruz",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/NybHckSEQBI",
    thumbnailUrl: "https://img.youtube.com/vi/NybHckSEQBI/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-10",
    department: "Basic Education", yearLevel: "Grade 9", trackOrCourse: "Junior High",
    tags: ["algebra", "math", "grade9"]
  },
  {
    id: "lm-stsn-v02", schoolId: "STSN",
    title: "Earth Science: Structure of the Earth",
    description: "Visual guide to the Earth's interior layers, plate tectonics, and geological processes. Includes diagrams and animations.",
    subjectCode: "JHS-SCI8", subjectName: "Earth Science 8",
    section: "St. Paul", teacherId: "teach-beatriz", teacherName: "Prof. Beatriz Cruz",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/eIBe6qB0HdI",
    thumbnailUrl: "https://img.youtube.com/vi/eIBe6qB0HdI/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-12",
    department: "Basic Education", yearLevel: "Grade 8", trackOrCourse: "Junior High",
    tags: ["earth science", "geology"]
  },
  {
    id: "lm-stsn-v03", schoolId: "STSN",
    title: "Oral Communication: Public Speaking Techniques",
    description: "Learn effective public speaking, voice projection, and non-verbal communication skills required for SHS Oral Communication.",
    subjectCode: "SHS-ORAL-COM", subjectName: "Oral Communication",
    section: "St. Thomas", teacherId: "teach-elena", teacherName: "Prof. Elena Soriano",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/tShavGuo0_E",
    thumbnailUrl: "https://img.youtube.com/vi/tShavGuo0_E/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-14",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "STEM",
    tags: ["communication", "speech", "grade11"]
  },
  {
    id: "lm-stsn-v04", schoolId: "STSN",
    title: "General Mathematics: Functions and Relations",
    description: "Master functions, domain, range, and function operations. Perfect review for Grade 11 STEM students.",
    subjectCode: "SHS-GEN-MATH", subjectName: "General Mathematics",
    section: "St. Thomas", teacherId: "teach-beatriz", teacherName: "Prof. Beatriz Cruz",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/52tpYl2tTqk",
    thumbnailUrl: "https://img.youtube.com/vi/52tpYl2tTqk/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-16",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "STEM",
    tags: ["functions", "math", "stem"]
  },
  {
    id: "lm-stsn-v05", schoolId: "STSN",
    title: "Statistics and Probability: Measures of Central Tendency",
    description: "Deep dive into mean, median, mode, and their applications in real-world data analysis for SHS STEM.",
    subjectCode: "SHS-STAT-PROB", subjectName: "Statistics and Probability",
    section: "St. Thomas", teacherId: "teach-beatriz", teacherName: "Prof. Beatriz Cruz",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/kn83BA7cRNM",
    thumbnailUrl: "https://img.youtube.com/vi/kn83BA7cRNM/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-18",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "STEM",
    tags: ["statistics", "probability", "stem"]
  },
  {
    id: "lm-stsn-v06", schoolId: "STSN",
    title: "Biology 9: Cell Division — Mitosis & Meiosis",
    description: "Animated walkthrough of cell division processes, with clear diagrams of mitosis and meiosis phases for Grade 9.",
    subjectCode: "JHS-SCI9", subjectName: "Biology 9",
    section: "St. Mark", teacherId: "teach-beatriz", teacherName: "Prof. Beatriz Cruz",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/L0k-enzoeOM",
    thumbnailUrl: "https://img.youtube.com/vi/L0k-enzoeOM/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-20",
    department: "Basic Education", yearLevel: "Grade 9", trackOrCourse: "Junior High",
    tags: ["biology", "cell division", "science"]
  },
  // ---- STSN — Basic Education — Modules / Documents ----
  {
    id: "lm-stsn-m01", schoolId: "STSN",
    title: "English Grammar: Parts of Speech Complete Guide",
    description: "Comprehensive written module covering nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, and interjections.",
    subjectCode: "JHS-ENG7", subjectName: "English 7",
    section: "St. Theresa", teacherId: "teach-elena", teacherName: "Prof. Elena Soriano",
    learningType: "Module",
    fileUrl: "#module-pdf-grammar",
    fileName: "English_Grammar_Parts_of_Speech.pdf",
    fileSize: "2.4 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-08",
    department: "Basic Education", yearLevel: "Grade 7", trackOrCourse: "Junior High",
    tags: ["english", "grammar", "grade7"]
  },
  {
    id: "lm-stsn-m02", schoolId: "STSN",
    title: "Entrepreneurship: Business Plan Workshop Workbook",
    description: "Step-by-step workbook for creating a business plan including market research, financial projections, and SWOT analysis.",
    subjectCode: "SHS-ABM-PRIN", subjectName: "Fundamentals of ABM",
    section: "St. Catherine", teacherId: "teach-carlo", teacherName: "Prof. Carlo Vergara",
    learningType: "Document",
    fileUrl: "#doc-biz-plan",
    fileName: "Business_Plan_Workshop.docx",
    fileSize: "1.8 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-22",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "ABM",
    tags: ["entrepreneurship", "abm", "business"]
  },
  {
    id: "lm-stsn-m03", schoolId: "STSN",
    title: "ICT Fundamentals: Introduction to Computers & Operating Systems",
    description: "Module covering computer hardware, software, operating systems, and basic troubleshooting for Grade 11 students.",
    subjectCode: "SHS-GEN-MATH", subjectName: "General Mathematics",
    section: "St. Thomas", teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    learningType: "Module",
    fileUrl: "#module-ict-fundamentals",
    fileName: "ICT_Fundamentals_Module1.pdf",
    fileSize: "3.1 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-25",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "STEM",
    tags: ["ict", "computers", "technology"]
  },
  // ---- STSN — College — Videos ----
  {
    id: "lm-stsn-cv01", schoolId: "STSN",
    title: "Programming Logic: Introduction to Algorithms",
    description: "Foundational concepts of algorithms, flowcharts, pseudocode, and problem-solving approaches for BSIT 1st year students.",
    subjectCode: "IT101", subjectName: "Introduction to Computing",
    section: "IT101", teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/rL8X2mlNHPM",
    thumbnailUrl: "https://img.youtube.com/vi/rL8X2mlNHPM/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-06",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSIT",
    tags: ["programming", "algorithms", "bsit"]
  },
  {
    id: "lm-stsn-cv02", schoolId: "STSN",
    title: "Computer Programming 1: Variables and Data Types",
    description: "Learn Python variables, data types, type casting, and basic input/output operations with live coding demonstrations.",
    subjectCode: "IT102", subjectName: "Computer Programming 1",
    section: "IT101", teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw",
    thumbnailUrl: "https://img.youtube.com/vi/rfscVS0vtbw/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-09",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSIT",
    tags: ["python", "programming", "variables"]
  },
  {
    id: "lm-stsn-cv03", schoolId: "STSN",
    title: "Database Management: SQL SELECT Statements",
    description: "Complete SQL SELECT tutorial covering WHERE clauses, ORDER BY, GROUP BY, JOINs, and subqueries for BSIT 2nd year.",
    subjectCode: "IT202", subjectName: "Database Management Systems",
    section: "IT201", teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/7S_tz1z_5bA",
    thumbnailUrl: "https://img.youtube.com/vi/7S_tz1z_5bA/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-11",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSIT",
    tags: ["sql", "database", "bsit"]
  },
  {
    id: "lm-stsn-cm01", schoolId: "STSN",
    title: "Web Development 1: HTML & CSS Fundamentals",
    description: "Comprehensive module covering HTML5 structure, semantic tags, CSS selectors, box model, flexbox, and responsive design.",
    subjectCode: "IT201", subjectName: "Web Development 1",
    section: "IT201", teacherId: "teach-arthur", teacherName: "Prof. Arthur Reyes",
    learningType: "Module",
    fileUrl: "#module-web-dev",
    fileName: "WebDev1_HTML_CSS_Module.pdf",
    fileSize: "4.2 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-15",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSIT",
    tags: ["html", "css", "web development"]
  },
  // ---- CDSTA — College — Videos ----
  {
    id: "lm-cdsta-v01", schoolId: "CDSTA",
    title: "Programming Logic & Design: Introduction",
    description: "Foundational course on programming logic, flowcharts, pseudocode, and structured programming for BSIT freshmen.",
    subjectCode: "IT101", subjectName: "Introduction to Computing",
    section: "BSIT-1A", teacherId: "teach-renato", teacherName: "Prof. Renato Villanueva",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/zOjov-2OZ0E",
    thumbnailUrl: "https://img.youtube.com/vi/zOjov-2OZ0E/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-07",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSIT",
    tags: ["programming", "logic", "bsit"]
  },
  {
    id: "lm-cdsta-v02", schoolId: "CDSTA",
    title: "Fundamentals of Accounting 1: The Accounting Cycle",
    description: "Full walkthrough of the accounting cycle from source documents to trial balance, with journal and ledger examples.",
    subjectCode: "ACCT101", subjectName: "Fundamentals of Accounting 1",
    section: "BSA-1A", teacherId: "teach-lorena", teacherName: "Prof. Lorena Castaneda",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/WNcXFoypWN0",
    thumbnailUrl: "https://img.youtube.com/vi/WNcXFoypWN0/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-08",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSA",
    tags: ["accounting", "cycle", "bsa"]
  },
  {
    id: "lm-cdsta-v03", schoolId: "CDSTA",
    title: "Principles of Management: Planning & Organizing",
    description: "Management functions explained with real-world business case studies. Covers planning, organizing, leading, and controlling.",
    subjectCode: "BA101", subjectName: "Principles of Management",
    section: "BSBA-1A", teacherId: "teach-jerome", teacherName: "Prof. Jerome Navarro",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/KBpoBocJg_U",
    thumbnailUrl: "https://img.youtube.com/vi/KBpoBocJg_U/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-10",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSBA",
    tags: ["management", "business", "bsba"]
  },
  {
    id: "lm-cdsta-v04", schoolId: "CDSTA",
    title: "Hospitality Industry: Introduction to Hotel Operations",
    description: "Overview of hotel departments, front desk operations, housekeeping standards, and food & beverage service for BSHM 1st year.",
    subjectCode: "HM101", subjectName: "Introduction to Hospitality Industry",
    section: "BSHM-1A", teacherId: "teach-fe", teacherName: "Prof. Fe Domingo",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/q0A24RDKLXA",
    thumbnailUrl: "https://img.youtube.com/vi/q0A24RDKLXA/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-12",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSHM",
    tags: ["hospitality", "hotel", "bshm"]
  },
  {
    id: "lm-cdsta-v05", schoolId: "CDSTA",
    title: "Data Structures: Arrays and Linked Lists",
    description: "Visual explanation of arrays, singly linked lists, doubly linked lists, and circular linked lists with code implementations.",
    subjectCode: "CS201", subjectName: "Data Structures",
    section: "BSCS-2A", teacherId: "teach-renato", teacherName: "Prof. Renato Villanueva",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/B31LgI4Y4DQ",
    thumbnailUrl: "https://img.youtube.com/vi/B31LgI4Y4DQ/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-14",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSCS",
    tags: ["data structures", "arrays", "bscs"]
  },
  {
    id: "lm-cdsta-v06", schoolId: "CDSTA",
    title: "Biology Introduction: Cell Structure and Function",
    description: "Learn about prokaryotic and eukaryotic cells, organelles, cell membrane, and cellular processes for Biology 101.",
    subjectCode: "ED101", subjectName: "Child and Adolescent Development",
    section: "BSED-1A", teacherId: "teach-fe", teacherName: "Prof. Fe Domingo",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/URUJD5NEXC8",
    thumbnailUrl: "https://img.youtube.com/vi/URUJD5NEXC8/hqdefault.jpg",
    publishStatus: "Published", uploadDate: "2026-05-16",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSED",
    tags: ["biology", "cells", "bsed"]
  },
  // ---- CDSTA — Modules / Documents ----
  {
    id: "lm-cdsta-m01", schoolId: "CDSTA",
    title: "Financial Accounting: Balance Sheet & Income Statement",
    description: "Detailed module on preparing financial statements, analyzing balance sheets, and income statement components for BSA 2nd year.",
    subjectCode: "ACCT201", subjectName: "Financial Accounting",
    section: "BSA-2A", teacherId: "teach-lorena", teacherName: "Prof. Lorena Castaneda",
    learningType: "Module",
    fileUrl: "#module-financial-accounting",
    fileName: "Financial_Accounting_Module2.pdf",
    fileSize: "3.6 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-20",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSA",
    tags: ["financial accounting", "balance sheet", "bsa"]
  },
  {
    id: "lm-cdsta-m02", schoolId: "CDSTA",
    title: "Human Resource Management: Recruitment & Selection",
    description: "Complete guide to HR planning, job analysis, recruitment strategies, selection process, and onboarding procedures.",
    subjectCode: "BA201", subjectName: "Human Resource Management",
    section: "BSBA-2A", teacherId: "teach-jerome", teacherName: "Prof. Jerome Navarro",
    learningType: "Document",
    fileUrl: "#doc-hrm",
    fileName: "HRM_Recruitment_Selection_Guide.docx",
    fileSize: "2.1 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-22",
    department: "College", yearLevel: "2nd Year", trackOrCourse: "BSBA",
    tags: ["hrm", "recruitment", "bsba"]
  },
  {
    id: "lm-cdsta-m03", schoolId: "CDSTA",
    title: "Food and Beverage Service: Table Setting Standards",
    description: "Illustrated guide to formal and informal table settings, service styles (American, French, Russian), and dining etiquette.",
    subjectCode: "HM102", subjectName: "Food and Beverage Service",
    section: "BSHM-1A", teacherId: "teach-fe", teacherName: "Prof. Fe Domingo",
    learningType: "Module",
    fileUrl: "#module-fnb",
    fileName: "FnB_Table_Setting_Standards.pdf",
    fileSize: "5.2 MB",
    thumbnailUrl: "",
    publishStatus: "Published", uploadDate: "2026-05-24",
    department: "College", yearLevel: "1st Year", trackOrCourse: "BSHM",
    tags: ["hospitality", "food beverage", "table setting"]
  },
  // ---- Draft materials ----
  {
    id: "lm-stsn-draft01", schoolId: "STSN",
    title: "Physical Science: Newton's Laws of Motion [DRAFT]",
    description: "Video lesson on Newton's three laws with practical demonstrations and problem-solving exercises. Pending review.",
    subjectCode: "SHS-PHYS-SCI", subjectName: "Physical Science",
    section: "St. Thomas", teacherId: "teach-beatriz", teacherName: "Prof. Beatriz Cruz",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/kKKM8Y-u7ds",
    thumbnailUrl: "https://img.youtube.com/vi/kKKM8Y-u7ds/hqdefault.jpg",
    publishStatus: "Draft", uploadDate: "2026-06-01",
    department: "Basic Education", yearLevel: "Grade 11", trackOrCourse: "STEM",
    tags: ["physics", "newton", "stem"]
  },
  {
    id: "lm-cdsta-draft01", schoolId: "CDSTA",
    title: "Network Administration: IP Addressing & Subnetting [DRAFT]",
    description: "Comprehensive video covering IPv4/IPv6 addressing, subnet masks, CIDR notation, and network design principles.",
    subjectCode: "IT302", subjectName: "Network Administration",
    section: "BSIT-3A", teacherId: "teach-renato", teacherName: "Prof. Renato Villanueva",
    learningType: "Video",
    videoUrl: "https://www.youtube.com/embed/s_gy5jSLkVA",
    thumbnailUrl: "https://img.youtube.com/vi/s_gy5jSLkVA/hqdefault.jpg",
    publishStatus: "Draft", uploadDate: "2026-06-02",
    department: "College", yearLevel: "3rd Year", trackOrCourse: "BSIT",
    tags: ["networking", "ip", "bsit"]
  },
];

// ============================================================
// MASTER SECTIONS — Class Sectioning Repository
// ============================================================
export const MOCK_SECTIONS: SchoolSection[] = [
  // Basic Ed — Junior High
  { id: "sec-g7-avila", schoolId: "STSN", code: "G7-AVILA", name: "St. Avila", department: "Basic Education", yearLevel: "Grade 7", strandOrTrack: "Junior High", adviserId: "teach-beatriz", adviserName: "Prof. Beatriz Cruz", capacity: 40, currentCount: 35, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-g8-thomas", schoolId: "STSN", code: "G8-THOMAS", name: "St. Thomas", department: "Basic Education", yearLevel: "Grade 8", strandOrTrack: "Junior High", adviserId: "teach-arthur", adviserName: "Prof. Arthur Reyes", capacity: 40, currentCount: 38, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-g9-cath", schoolId: "STSN", code: "G9-CATH", name: "St. Catherine", department: "Basic Education", yearLevel: "Grade 9", strandOrTrack: "Junior High", adviserId: "teach-beatriz", adviserName: "Prof. Beatriz Cruz", capacity: 40, currentCount: 30, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-g10-albert", schoolId: "STSN", code: "G10-ALBERT", name: "St. Albert", department: "Basic Education", yearLevel: "Grade 10", strandOrTrack: "Junior High", adviserId: "teach-arthur", adviserName: "Prof. Arthur Reyes", capacity: 40, currentCount: 32, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  // Basic Ed — Senior High
  { id: "sec-g11-stem-a", schoolId: "STSN", code: "G11-STEM-A", name: "STEM 11-A", department: "Basic Education", yearLevel: "Grade 11", strandOrTrack: "STEM", adviserId: "teach-arthur", adviserName: "Prof. Arthur Reyes", capacity: 45, currentCount: 42, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-g11-humss-a", schoolId: "STSN", code: "G11-HUMSS-A", name: "HUMSS 11-A", department: "Basic Education", yearLevel: "Grade 11", strandOrTrack: "HUMSS", adviserId: "teach-beatriz", adviserName: "Prof. Beatriz Cruz", capacity: 45, currentCount: 40, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-g12-abm-a", schoolId: "STSN", code: "G12-ABM-A", name: "ABM 12-A", department: "Basic Education", yearLevel: "Grade 12", strandOrTrack: "ABM", adviserId: "teach-beatriz", adviserName: "Prof. Beatriz Cruz", capacity: 45, currentCount: 38, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-g12-stem-a", schoolId: "STSN", code: "G12-STEM-A", name: "STEM 12-A", department: "Basic Education", yearLevel: "Grade 12", strandOrTrack: "STEM", adviserId: "teach-arthur", adviserName: "Prof. Arthur Reyes", capacity: 45, currentCount: 44, academicYear: "2026-2027", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  // College — BSIT
  { id: "sec-bsit-1a", schoolId: "CDSTA", code: "BSIT-1A", name: "BSIT 1-A", department: "College", yearLevel: "1st Year", strandOrTrack: "BSIT", adviserId: "teach-renato", adviserName: "Prof. Renato Villanueva", capacity: 35, currentCount: 33, academicYear: "2026-2027", semester: "First Semester", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-bsit-2a", schoolId: "CDSTA", code: "BSIT-2A", name: "BSIT 2-A", department: "College", yearLevel: "2nd Year", strandOrTrack: "BSIT", adviserId: "teach-renato", adviserName: "Prof. Renato Villanueva", capacity: 35, currentCount: 28, academicYear: "2026-2027", semester: "First Semester", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-bsba-1a", schoolId: "CDSTA", code: "BSBA-1A", name: "BSBA 1-A", department: "College", yearLevel: "1st Year", strandOrTrack: "BSBA", adviserId: "teach-lorena", adviserName: "Prof. Lorena Santos", capacity: 35, currentCount: 30, academicYear: "2026-2027", semester: "First Semester", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
  { id: "sec-bsed-1a", schoolId: "CDSTA", code: "BSED-1A", name: "BSED 1-A", department: "College", yearLevel: "1st Year", strandOrTrack: "BSED", adviserId: "teach-jerome", adviserName: "Prof. Jerome Garcia", capacity: 35, currentCount: 25, academicYear: "2026-2027", semester: "First Semester", isActive: true, createdAt: "2026-06-01", enrolledStudentIds: [] },
];

// ============================================================
// ROOMS — Room Management Repository
// ============================================================
export const MOCK_ROOMS: Room[] = [
  { id: "room-101", schoolId: "STSN", code: "R101", name: "Room 101", building: "Main Building", floor: "1st Floor", capacity: 45, type: "Classroom", isActive: true, status: "Available" },
  { id: "room-102", schoolId: "STSN", code: "R102", name: "Room 102", building: "Main Building", floor: "1st Floor", capacity: 45, type: "Classroom", isActive: true, status: "Available" },
  { id: "room-201", schoolId: "STSN", code: "R201", name: "Room 201", building: "Main Building", floor: "2nd Floor", capacity: 45, type: "Classroom", isActive: true, status: "Available" },
  { id: "room-202", schoolId: "STSN", code: "R202", name: "Room 202", building: "Main Building", floor: "2nd Floor", capacity: 45, type: "Classroom", isActive: true, status: "Available" },
  { id: "room-lab1", schoolId: "STSN", code: "LAB1", name: "Science Lab 1", building: "Science Wing", floor: "1st Floor", capacity: 30, type: "Laboratory", isActive: true, status: "Available" },
  { id: "room-itlab1", schoolId: "STSN", code: "ITLAB1", name: "IT Lab 1", building: "Technology Wing", floor: "1st Floor", capacity: 35, type: "Laboratory", isActive: true, status: "Available" },
  { id: "room-gym", schoolId: "STSN", code: "GYM", name: "Gymnasium", building: "Sports Complex", floor: "Ground Floor", capacity: 200, type: "Gymnasium", isActive: true, status: "Available" },
  { id: "room-aud", schoolId: "STSN", code: "AUD", name: "Auditorium", building: "Main Building", floor: "Ground Floor", capacity: 300, type: "Auditorium", isActive: true, status: "Available" },
  // CDSTA Rooms
  { id: "room-cdsta-101", schoolId: "CDSTA", code: "C-R101", name: "College Room 101", building: "College Building", floor: "1st Floor", capacity: 40, type: "Classroom", isActive: true, status: "Available" },
  { id: "room-cdsta-102", schoolId: "CDSTA", code: "C-R102", name: "College Room 102", building: "College Building", floor: "1st Floor", capacity: 40, type: "Classroom", isActive: true, status: "Available" },
  { id: "room-cdsta-itlab", schoolId: "CDSTA", code: "C-ITLAB", name: "College IT Lab", building: "IT Building", floor: "2nd Floor", capacity: 35, type: "Laboratory", isActive: true, status: "Available" },
  { id: "room-cdsta-301", schoolId: "CDSTA", code: "C-R301", name: "College Room 301", building: "College Building", floor: "3rd Floor", capacity: 40, type: "Classroom", isActive: true, status: "Under Maintenance" },
];
