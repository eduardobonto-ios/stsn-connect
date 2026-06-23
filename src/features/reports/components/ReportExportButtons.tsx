import React from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { reportExportService } from "../../../services/reportExportService";
import type { ReportColumn, ReportRow } from "../types";

type ReportExportButtonsProps = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  onPreview: () => void;
};

export default function ReportExportButtons({ title, columns, rows, onPreview }: ReportExportButtonsProps) {
  const payload = { title, columns, rows };
  const disabled = rows.length === 0;
  const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-stsn-beige bg-white px-3 py-2 text-xs font-bold text-stsn-brown shadow-sm transition hover:bg-stsn-cream disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onPreview} disabled={disabled} className={buttonClass}>
        <FileText className="w-4 h-4" />
        Preview
      </button>
      <button type="button" onClick={() => reportExportService.print(payload)} disabled={disabled} className={buttonClass}>
        <Printer className="w-4 h-4" />
        Print
      </button>
      <button type="button" onClick={() => reportExportService.exportCsv(payload)} disabled={disabled} className={buttonClass}>
        <Download className="w-4 h-4" />
        CSV
      </button>
      <button type="button" onClick={() => reportExportService.exportExcel(payload)} disabled={disabled} className={buttonClass}>
        <FileSpreadsheet className="w-4 h-4" />
        Excel
      </button>
      <button type="button" onClick={() => reportExportService.exportPdf(payload)} disabled={disabled} className={buttonClass}>
        <FileText className="w-4 h-4" />
        PDF
      </button>
    </div>
  );
}
