import React from "react";
import AppModal from "../../../components/common/AppModal";
import type { ReportColumn, ReportRow } from "../types";

type ReportPreviewModalProps = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  onClose: () => void;
};

export default function ReportPreviewModal({ title, columns, rows, onClose }: ReportPreviewModalProps) {
  return (
    <AppModal
      open
      title={title}
      eyebrow="Print Preview"
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      headerClassName="bg-white text-stsn-brown border-b border-stsn-beige"
      bodyClassName="max-h-[72vh] overflow-auto p-5"
    >
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="border border-stsn-beige bg-stsn-cream px-3 py-2 text-left font-black text-stsn-brown">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={String(row.id ?? rowIndex)}>
              {columns.map((column) => (
                <td key={column.key} className="border border-stsn-beige px-3 py-2 text-stone-700">
                  {String(row[column.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </AppModal>
  );
}
