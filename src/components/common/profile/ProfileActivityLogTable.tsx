import React from "react";
import AppTable, { type AppTableColumn } from "../AppTable";

interface ProfileActivityLogTableProps<TData> {
  data: TData[];
  columns: AppTableColumn<TData>[];
  getRowId?: (row: TData, index: number) => string;
  emptyMessage: string;
  emptyDescription: string;
}

export default function ProfileActivityLogTable<TData>({
  data,
  columns,
  getRowId,
  emptyMessage,
  emptyDescription,
}: ProfileActivityLogTableProps<TData>) {
  return (
    <AppTable
      data={data}
      columns={columns}
      getRowId={getRowId}
      enableSearch={false}
      enableColumnVisibility={false}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      compact
    />
  );
}
