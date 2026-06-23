import React from "react";
import { X } from "lucide-react";
import type { ReportColumn, ReportRow } from "../types";

type ReportPreviewModalProps = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  onClose: () => void;
};

export default function ReportPreviewModal({ title, columns, rows, onClose }: ReportPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-xl border border-stsn-beige bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stsn-beige px-5 py-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Print Preview</p>
            <h2 className="text-lg font-black text-stsn-brown">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-auto p-5">
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
        </div>
      </div>
    </div>
  );
}
