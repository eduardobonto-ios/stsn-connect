import type { ReportColumn, ReportRow } from "../features/reports/types";

type ExportPayload = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

function safeFileName(title: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${date}`;
}

function cellValue(row: ReportRow, key: string) {
  const value = row[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

function downloadFile(fileName: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtmlTable({ title, columns, rows }: ExportPayload) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = rows
    .map((row) => (
      `<tr>${columns.map((column) => `<td>${escapeHtml(cellValue(row, column.key))}</td>`).join("")}</tr>`
    ))
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #292524; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p { font-size: 11px; color: #78716c; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; background: #f5f0e8; color: #5b3517; }
    th, td { border: 1px solid #d6c7ae; padding: 7px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>Generated ${new Date().toLocaleString()}</p>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;
}

function logGeneratedReport(action: string, title: string, rowCount: number) {
  const key = "stsn.generatedReports";
  const entry = {
    id: crypto.randomUUID(),
    action,
    title,
    rowCount,
    generatedAt: new Date().toISOString(),
  };
  const current = JSON.parse(localStorage.getItem(key) ?? "[]");
  localStorage.setItem(key, JSON.stringify([entry, ...current].slice(0, 100)));
}

export const reportExportService = {
  print(payload: ExportPayload) {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;
    printWindow.document.write(buildHtmlTable(payload));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    logGeneratedReport("Print", payload.title, payload.rows.length);
  },

  exportCsv(payload: ExportPayload) {
    const header = payload.columns.map((column) => escapeCsv(column.label)).join(",");
    const rows = payload.rows.map((row) =>
      payload.columns.map((column) => escapeCsv(cellValue(row, column.key))).join(","),
    );
    downloadFile(`${safeFileName(payload.title)}.csv`, "text/csv;charset=utf-8", [header, ...rows].join("\n"));
    logGeneratedReport("CSV", payload.title, payload.rows.length);
  },

  exportExcel(payload: ExportPayload) {
    downloadFile(
      `${safeFileName(payload.title)}.xls`,
      "application/vnd.ms-excel;charset=utf-8",
      buildHtmlTable(payload),
    );
    logGeneratedReport("Excel", payload.title, payload.rows.length);
  },

  exportPdf(payload: ExportPayload) {
    const pdfWindow = window.open("", "_blank", "width=1100,height=800");
    if (!pdfWindow) return;
    pdfWindow.document.write(buildHtmlTable(payload));
    pdfWindow.document.close();
    pdfWindow.focus();
    pdfWindow.print();
    logGeneratedReport("PDF", payload.title, payload.rows.length);
  },
};
