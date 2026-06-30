export type RegistrarImportStatus = "parsed" | "valid" | "warning" | "error" | "duplicate" | "skipped" | "committed";

export interface RegistrarImportPreviewRow {
  id?: string;
  sheetRowNumber: number;
  lrn?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  fullName: string;
  gender?: string;
  birthday?: string;
  yearLevel?: string;
  trackOrCourse?: string;
  academicStage?: string;
  studentStatus?: string;
  importStatus: RegistrarImportStatus;
  errors: string[];
  warnings: string[];
}

export interface RegistrarImportSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
}
