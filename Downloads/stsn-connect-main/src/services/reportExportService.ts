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
  const logoSrc = `${window.location.origin}/stsn-crest.png`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #292524; padding: 24px; }
    .school-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; border-bottom: 2px solid #d6c7ae; padding-bottom: 12px; }
    .school-header img { width: 64px; height: 64px; object-fit: contain; }
    .school-info h1 { font-size: 18px; font-weight: 900; margin: 0 0 2px; color: #5b3517; }
    .school-info p { font-size: 11px; color: #78716c; margin: 0; }
    .report-title { font-size: 14px; font-weight: 700; margin: 12px 0 4px; color: #292524; }
    .report-meta { font-size: 11px; color: #78716c; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; background: #f5f0e8; color: #5b3517; }
    th, td { border: 1px solid #d6c7ae; padding: 7px; }
  </style>
</head>
<body>
  <div class="school-header">
    <img src="${logoSrc}" alt="STSN Crest" onerror="this.style.display='none'" />
    <div class="school-info">
      <h1>St. Theresa&#x27;s School of Novaliches</h1>
      <p>#7 Kingfisher Street, Zabarte Subdivision Novaliches Quezon City 1124, Philippines</p>
    </div>
  </div>
  <p class="report-title">${escapeHtml(title)}</p>
  <p class="report-meta">Generated ${new Date().toLocaleString()}</p>
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
