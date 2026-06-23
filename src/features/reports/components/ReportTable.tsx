import React from "react";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import type { ReportColumn, ReportRow } from "../types";

type ReportTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

export default function ReportTable({ columns, rows }: ReportTableProps) {
  const dataTableColumns: STSNColumn<ReportRow>[] = columns.map((column) => ({
    title: column.label,
    data: column.key,
    className: column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : undefined,
  }));

  return (
    <section className="bg-white border border-stsn-beige rounded-xl p-4 shadow-sm">
      <STSNDataTable
        columns={dataTableColumns}
        rows={rows}
        pageLength={10}
        searchable={false}
        emptyMessage="No report rows match the selected filters."
      />
    </section>
  );
}
