/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Boxes, Plus, Pencil, Trash2 } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import AppModal from "../../../../components/common/AppModal";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryCopy, LibraryCondition, LibraryCopyStatus } from "../../types";

type FormState = {
  bookId: string;
  accessionNo: string;
  shelfId: string;
  acquisitionDate: string;
  acquisitionCost: string;
  condition: LibraryCondition;
  copyStatus: LibraryCopyStatus;
  remarks: string;
};

const EMPTY: FormState = {
  bookId: "", accessionNo: "", shelfId: "", acquisitionDate: "", acquisitionCost: "",
  condition: "Good", copyStatus: "AVAILABLE", remarks: "",
};

const field = "w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown";
const label = "block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide";

export default function LibraryInventory({ lib, canPage }: LibrarySectionProps) {
  const canCreate = canPage("LIBRARY_SYSTEM", "inventory", "create");
  const canEdit = canPage("LIBRARY_SYSTEM", "inventory", "edit");
  const canDelete = canPage("LIBRARY_SYSTEM", "inventory", "delete");

  const [modal, setModal] = useState<{ mode: "new" | "edit"; copy?: LibraryCopy } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<LibraryCopy | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const bookTitle = (id: string) => lib.books.find((b) => b.id === id)?.title ?? "—";
  const shelfName = (id?: string | null) => lib.shelves.find((s) => s.id === id)?.name ?? "—";

  const openNew = () => { setForm(EMPTY); setErr(null); setModal({ mode: "new" }); };
  const openEdit = (copy: LibraryCopy) => {
    setForm({
      bookId: copy.bookId,
      accessionNo: copy.accessionNo,
      shelfId: copy.shelfId ?? "",
      acquisitionDate: copy.acquisitionDate ?? "",
      acquisitionCost: copy.acquisitionCost != null ? String(copy.acquisitionCost) : "",
      condition: copy.condition,
      copyStatus: copy.copyStatus,
      remarks: copy.remarks ?? "",
    });
    setErr(null);
    setModal({ mode: "edit", copy });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookId) { setErr("Select the title this copy belongs to."); return; }
    const accession = form.accessionNo.trim();
    if (!accession) { setErr("Accession number is required."); return; }
    const clash = lib.copies.find((c) => c.accessionNo === accession && c.id !== modal?.copy?.id);
    if (clash) { setErr(`Accession "${accession}" is already used.`); return; }

    const payload = {
      bookId: form.bookId,
      accessionNo: accession,
      shelfId: form.shelfId || null,
      acquisitionDate: form.acquisitionDate || null,
      acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : null,
      condition: form.condition,
      copyStatus: form.copyStatus,
      remarks: form.remarks.trim() || null,
    };
    if (modal?.mode === "edit" && modal.copy) lib.updateCopy(modal.copy.id, payload);
    else lib.addCopy(payload);
    setModal(null);
  };

  const columns = useMemo<AppTableColumn<LibraryCopy>[]>(() => [
    { id: "accession", header: "Accession", accessorFn: (r) => r.accessionNo, cell: ({ getValue }) => <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span> },
    { id: "title", header: "Title", accessorFn: (r) => bookTitle(r.bookId), cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "shelf", header: "Shelf", accessorFn: (r) => shelfName(r.shelfId), cell: ({ getValue }) => <span className="text-stone-600">{String(getValue())}</span> },
    { id: "condition", header: "Condition", accessorFn: (r) => r.condition, cell: ({ row }) => <LibraryStatusBadge status={row.original.condition} /> },
    { id: "status", header: "Status", accessorFn: (r) => r.copyStatus, cell: ({ row }) => <LibraryStatusBadge status={row.original.copyStatus} /> },
    { id: "cost", header: "Cost", accessorFn: (r) => r.acquisitionCost ?? 0, cell: ({ row }) => <span className="block text-right font-mono text-stone-600">{row.original.acquisitionCost != null ? formatMoney(row.original.acquisitionCost) : "—"}</span> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          {canEdit && (
            <button onClick={() => openEdit(row.original)} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDelete(row.original)} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer transition">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>
      ),
    },
  ], [lib.books, lib.shelves, canEdit, canDelete]);

  return (
    <>
      <SectionPanel
        title="Book Inventory"
        icon={Boxes}
        meta={`${lib.copies.length} copies`}
        actions={canCreate && <AppButton size="sm" leftIcon={Plus} onClick={openNew}>Add Copy</AppButton>}
      >
        <AppTable<LibraryCopy>
          columns={columns}
          data={lib.copies}
          getRowId={(r) => r.id}
          emptyMessage="No copies in inventory yet."
          initialPageSize={10}
        />
      </SectionPanel>

      {modal && (
        <AppModal
          open
          onClose={() => setModal(null)}
          title={modal.mode === "edit" ? "Edit Copy" : "Add Copy"}
          eyebrow="Inventory"
          icon={Boxes}
          panelAs="form"
          onSubmit={submit}
          maxWidthClass="max-w-xl"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton type="submit" size="sm">{modal.mode === "edit" ? "Save Changes" : "Add Copy"}</AppButton>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={label}>Title <span className="text-red-500">*</span></label>
              <select className={field} value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
                <option value="">Select a title…</option>
                {lib.books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
            <div><label className={label}>Accession No. <span className="text-red-500">*</span></label><input className={`${field} font-mono`} value={form.accessionNo} onChange={(e) => setForm({ ...form, accessionNo: e.target.value })} /></div>
            <div>
              <label className={label}>Shelf</label>
              <select className={field} value={form.shelfId} onChange={(e) => setForm({ ...form, shelfId: e.target.value })}>
                <option value="">—</option>
                {lib.shelves.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className={label}>Acquisition Date</label><input type="date" className={field} value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} /></div>
            <div><label className={label}>Acquisition Cost</label><input type="number" step="0.01" className={field} value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} /></div>
            <div>
              <label className={label}>Condition</label>
              <select className={field} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as LibraryCondition })}>
                {["New", "Good", "Fair", "Poor"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Copy Status</label>
              <select className={field} value={form.copyStatus} onChange={(e) => setForm({ ...form, copyStatus: e.target.value as LibraryCopyStatus })}>
                {["AVAILABLE", "BORROWED", "RESERVED", "LOST", "DAMAGED", "ARCHIVED"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><label className={label}>Remarks</label><input className={field} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          {err && <p className="text-red-600 text-[11px] mt-3 font-semibold">{err}</p>}
        </AppModal>
      )}

      {confirmDelete && (
        <AppModal
          open
          onClose={() => setConfirmDelete(null)}
          title="Delete Copy"
          eyebrow="Confirm"
          icon={Trash2}
          maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton variant="destructive" size="sm" leftIcon={Trash2} onClick={() => { lib.deleteCopy(confirmDelete.id); setConfirmDelete(null); }}>Delete</AppButton>
            </div>
          }
        >
          <p className="text-xs text-stone-600">Delete copy <span className="font-bold font-mono">{confirmDelete.accessionNo}</span>? This cannot be undone.</p>
        </AppModal>
      )}
    </>
  );
}
