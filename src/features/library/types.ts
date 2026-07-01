/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Domain models for the Library System (LIBRARY_SYSTEM module). Field names are
// camelCase mirrors of the snake_case columns in
// supabase/migrations/20260701140000_library_system_schema.sql, produced by the
// toCamel() mapper in services/supabaseCrud.ts.

export type LibraryBookStatus = "Active" | "Inactive" | "Archived";
export type LibraryCondition = "New" | "Good" | "Fair" | "Poor";
export type LibraryCopyStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "RESERVED"
  | "LOST"
  | "DAMAGED"
  | "ARCHIVED";
export type LibraryBorrowerType = "STUDENT" | "EMPLOYEE" | "FACULTY";
export type LibraryTransactionStatus =
  | "BORROWED"
  | "RETURNED"
  | "OVERDUE"
  | "LOST"
  | "DAMAGED"
  | "CANCELLED";
export type LibraryItemStatus =
  | "BORROWED"
  | "RETURNED"
  | "OVERDUE"
  | "LOST"
  | "DAMAGED";
export type LibraryFineType = "OVERDUE" | "LOST" | "DAMAGED";
export type LibraryFineStatus = "PENDING" | "PAID" | "WAIVED" | "CANCELLED";
export type LibraryLostFeeMode = "fixed" | "replacement_cost" | "multiplier";

export interface LibraryCategory {
  id: string;
  schoolId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface LibrarySubject {
  id: string;
  schoolId?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface LibraryShelf {
  id: string;
  schoolId?: string | null;
  code: string;
  name: string;
  location?: string | null;
  isActive: boolean;
}

export interface LibraryFineRule {
  id: string;
  schoolId?: string | null;
  name: string;
  finePerDay: number;
  graceDays: number;
  maxFine?: number | null;
  lostFeeMode: LibraryLostFeeMode;
  lostFeeValue?: number | null;
  effectiveFrom?: string | null;
  isActive: boolean;
}

export interface LibraryBook {
  id: string;
  schoolId?: string | null;
  isbn?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  categoryId?: string | null;
  subjectId?: string | null;
  gradeLevelApplicability?: string[] | null;
  edition?: string | null;
  language?: string | null;
  description?: string | null;
  status: LibraryBookStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
}

export interface LibraryCopy {
  id: string;
  schoolId?: string | null;
  bookId: string;
  accessionNo: string;
  shelfId?: string | null;
  acquisitionDate?: string | null;
  acquisitionCost?: number | null;
  condition: LibraryCondition;
  copyStatus: LibraryCopyStatus;
  remarks?: string | null;
  isActive: boolean;
}

export interface LibraryTransaction {
  id: string;
  schoolId?: string | null;
  transactionNo: string;
  borrowerType: LibraryBorrowerType;
  borrowerRefId?: string | null;
  borrowerName?: string | null;
  borrowerNo?: string | null;
  checkoutDate: string;
  dueDate: string;
  status: LibraryTransactionStatus;
  issuedBy?: string | null;
  remarks?: string | null;
  createdAt?: string;
}

export interface LibraryTransactionItem {
  id: string;
  transactionId: string;
  copyId: string;
  bookId?: string | null;
  dueDate?: string | null;
  returnDate?: string | null;
  returnedCondition?: LibraryCondition | null;
  itemStatus: LibraryItemStatus;
  overdueDays: number;
  remarks?: string | null;
}

export interface LibraryFine {
  id: string;
  schoolId?: string | null;
  transactionItemId?: string | null;
  transactionId?: string | null;
  borrowerType?: LibraryBorrowerType | null;
  borrowerRefId?: string | null;
  borrowerName?: string | null;
  fineType: LibraryFineType;
  amount: number;
  status: LibraryFineStatus;
  assessedDate: string;
  settledDate?: string | null;
  waivedReason?: string | null;
  paymentId?: string | null;
  orNumber?: string | null;
  settlementRemarks?: string | null;
}

/** A borrower option resolved from students/employees for autocomplete. */
export interface LibraryBorrowerOption {
  refId: string;
  type: LibraryBorrowerType;
  name: string;
  no: string;
  meta?: string;
}

export const LIBRARY_SUB_PAGES = [
  "dashboard",
  "catalog",
  "inventory",
  "borrowing",
  "returns",
  "overdue",
  "lost-damaged",
  "fines",
  "reports",
  "maintenance",
] as const;

export type LibrarySubPage = (typeof LIBRARY_SUB_PAGES)[number];
