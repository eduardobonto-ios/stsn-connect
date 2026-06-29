import React, { useMemo } from "react";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { appTableColumnsFromLegacy, type AppTableLegacyColumn } from "../../../components/common/AppTable";
import type { ReportColumn, ReportRow } from "../types";

type ReportTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
};

const PAGE_SIZE = 10;
const STATUS_COLUMN_KEYS = new Set(["status", "submissionStatus", "verificationStatus", "hardcopy"]);

export default function ReportTable({ columns, rows }: ReportTableProps) {
  const alignClass = (align?: ReportColumn["align"]) => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  const appTableColumns = useMemo(
    () =>
      appTableColumnsFromLegacy<ReportRow>(
        columns.map((column): AppTableLegacyColumn<ReportRow> => ({
          title: column.label,
          data: column.key,
          orderable: false,
          searchable: false,
          className: alignClass(column.align),
          render: (value) => {
            if (STATUS_COLUMN_KEYS.has(column.key) && typeof value === "string" && value.trim()) {
              return <AppStatusBadge status={value}>{value}</AppStatusBadge>;
            }
            return String(value ?? "");
          },
        })),
      ),
    [columns],
  );

  return (
    <AppTable<ReportRow>
      data={rows}
      columns={appTableColumns}
      enableSearch={false}
      enableColumnVisibility={false}
      initialPageSize={PAGE_SIZE}
      pageSizeOptions={[PAGE_SIZE]}
      emptyMessage="No report rows match the selected filters."
      emptyDescription="Adjust the report filters to see matching records."
      density="compact"
      className="rounded-xl"
      tableClassName="text-xs"
    />
  );
}
