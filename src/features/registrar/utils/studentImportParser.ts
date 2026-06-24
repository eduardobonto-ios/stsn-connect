import type { RegistrarImportPreviewRow, RegistrarImportSummary } from "../types/studentImport.types";

const TEMPLATE_HEADERS = {
  lrn: "Learner's Reference Number (LRN)",
  lastName: "Student's Last Name",
  firstName: "Student's Given Name",
  middleName: "Student's Middle Name",
  studentStatus: "Student Status",
  birthday: "Birth Date",
  gender: "Gender",
  yearLevel: "Grade / Level",
  strand: "Strand",
} as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '""';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.trim()) rows.push(parseCsvLine(current));
      current = "";
      if (char === "\r" && next === "\n") i += 1;
    } else {
      current += char;
    }
  }

  if (current.trim()) rows.push(parseCsvLine(current));
  return rows;
}

function academicStageFor(yearLevel: string): string | undefined {
  const grade = Number(yearLevel.match(/^Grade\s+(\d+)$/i)?.[1] ?? 0);
  if (grade >= 11) return "Senior High School";
  if (grade >= 7) return "Junior High School";
  if (grade >= 1) return "Elementary";
  if (/kinder|nursery/i.test(yearLevel)) return "Preschool";
  return undefined;
}

function normalizeYearLevel(value: string): { yearLevel: string; inferredTrack?: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(Grade\s+(?:11|12))\s*-\s*(.+)$/i);
  if (!match) return { yearLevel: trimmed };
  return { yearLevel: match[1].replace(/\s+/, " "), inferredTrack: match[2].trim() };
}

function normalizeGender(value: string): "Male" | "Female" | "" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "m") return "Male";
  if (normalized === "female" || normalized === "f") return "Female";
  return "";
}

function summarize(rows: RegistrarImportPreviewRow[]): RegistrarImportSummary {
  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.importStatus === "valid").length,
    warningRows: rows.filter((row) => row.importStatus === "warning").length,
    errorRows: rows.filter((row) => row.importStatus === "error").length,
    duplicateRows: rows.filter((row) => row.importStatus === "duplicate").length,
  };
}

export function parseRegistrarStudentCsvTemplate(text: string): { rows: RegistrarImportPreviewRow[]; summary: RegistrarImportSummary } {
  const csvRows = parseCsv(text);
  if (csvRows.length < 2) return { rows: [], summary: summarize([]) };

  const headers = csvRows[0];
  const indexFor = (header: string) => headers.findIndex((value) => value.trim().toLowerCase() === header.toLowerCase());
  const indexes = Object.fromEntries(Object.entries(TEMPLATE_HEADERS).map(([key, header]) => [key, indexFor(header)]));

  const lrnCounts = new Map<string, number>();
  const rows = csvRows.slice(1).map((values, idx) => {
    const rawGrade = values[indexes.yearLevel] ?? "";
    const normalizedGrade = normalizeYearLevel(rawGrade);
    const yearLevel = normalizedGrade.yearLevel;
    const trackOrCourse = (values[indexes.strand] || normalizedGrade.inferredTrack || "").trim();
    const lrn = (values[indexes.lrn] || "").trim();
    if (lrn) lrnCounts.set(lrn, (lrnCounts.get(lrn) ?? 0) + 1);

    const lastName = (values[indexes.lastName] || "").trim();
    const firstName = (values[indexes.firstName] || "").trim();
    const middleName = (values[indexes.middleName] || "").trim();
    const rawGender = (values[indexes.gender] || "").trim();
    const gender = normalizeGender(rawGender);
    const birthday = (values[indexes.birthday] || "").trim();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!lastName) errors.push("Missing last name");
    if (!firstName) errors.push("Missing given name");
    if (!gender) errors.push(rawGender ? "Invalid gender" : "Missing gender");
    if (!birthday) errors.push("Missing birth date");
    if (!yearLevel) errors.push("Missing grade/year level");
    if (!lrn) warnings.push("Missing LRN; Registrar confirmation required");
    if ((yearLevel === "Grade 11" || yearLevel === "Grade 12") && !trackOrCourse) {
      errors.push("Senior High School row requires Strand / Track");
    }

    return {
      sheetRowNumber: idx + 2,
      lrn,
      lastName,
      firstName,
      middleName,
      fullName: [lastName, firstName, middleName].filter(Boolean).join(", "),
      gender,
      birthday,
      yearLevel,
      trackOrCourse,
      academicStage: academicStageFor(yearLevel),
      studentStatus: (values[indexes.studentStatus] || "").trim(),
      importStatus: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid",
      errors,
      warnings,
    } satisfies RegistrarImportPreviewRow;
  });

  const checkedRows = rows.map((row) => {
    if (row.lrn && (lrnCounts.get(row.lrn) ?? 0) > 1) {
      return { ...row, importStatus: "duplicate" as const, errors: [...row.errors, "Duplicate LRN in file"] };
    }
    return row;
  });

  return { rows: checkedRows, summary: summarize(checkedRows) };
}
