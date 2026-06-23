import type { Enrollment, Requirement, SchoolId, SchoolSection, Student } from "../../types";

export type ReportFilterValues = {
  search: string;
  schoolYear: string;
  status: string;
  yearLevel: string;
  section: string;
  enrollmentType: string;
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export type ReportRow = Record<string, string | number | boolean | null | undefined>;

export type ReportDataContext = {
  students: Student[];
  enrollments: Enrollment[];
  requirements: Requirement[];
  sections: SchoolSection[];
};

export type ReportDefinition = {
  id: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  buildRows: (context: ReportDataContext, filters: ReportFilterValues) => ReportRow[];
};

export const DEFAULT_REPORT_FILTERS: ReportFilterValues = {
  search: "",
  schoolYear: "All",
  status: "All",
  yearLevel: "All",
  section: "All",
  enrollmentType: "All",
};

export function formatSchool(schoolId?: SchoolId): string {
  if (schoolId === "STSN") return "STSN";
  if (schoolId === "CDSTA") return "CDSTA";
  return "All Schools";
}
