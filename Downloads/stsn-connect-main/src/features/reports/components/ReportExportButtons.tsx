import React from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import AppButton from "../../../components/common/AppButton";
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AppButton type="button" variant="outline" size="sm" onClick={onPreview} disabled={disabled} leftIcon={FileText}>
        Preview
      </AppButton>
      <AppButton type="button" variant="outline" size="sm" onClick={() => reportExportService.print(payload)} disabled={disabled} leftIcon={Printer}>
        Print
      </AppButton>
      <AppButton type="button" variant="outline" size="sm" onClick={() => reportExportService.exportCsv(payload)} disabled={disabled} leftIcon={Download}>
        CSV
      </AppButton>
      <AppButton type="button" variant="outline" size="sm" onClick={() => reportExportService.exportExcel(payload)} disabled={disabled} leftIcon={FileSpreadsheet}>
        Excel
      </AppButton>
      <AppButton type="button" variant="outline" size="sm" onClick={() => reportExportService.exportPdf(payload)} disabled={disabled} leftIcon={FileText}>
        PDF
      </AppButton>
    </div>
  );
}
