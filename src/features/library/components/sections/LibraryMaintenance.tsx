/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import AppModal from "../../../../components/common/AppModal";
import { SectionPanel, LibraryStatusBadge, formatMoney } from "../shared";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryCategory, LibrarySubject, LibraryShelf, LibraryFineRule, LibraryLostFeeMode } from "../../types";

type Tab = "categories" | "subjects" | "shelves" | "fine-rules";
const TABS: { id: Tab; label: string }[] = [
  { id: "categories", label: "Categories" },
  { id: "subjects", label: "Subjects" },
  { id: "shelves", label: "Shelves" },
  { id: "fine-rules", label: "Fine Rules" },
];

const field = "w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown";
const label = "block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide";

interface Form {
  code: string; name: string; description: string; location: string;
  finePerDay: string; graceDays: string; maxFine: string;
  lostFeeMode: LibraryLostFeeMode; lostFeeValue: string; effectiveFrom: string;
}
const EMPTY: Form = { code: "", name: "", description: "", location: "", finePerDay: "5", graceDays: "0", maxFine: "", lostFeeMode: "replacement_cost", lostFeeValue: "", effectiveFrom: "" };

export default function LibraryMaintenance({ lib, canPage }: LibrarySectionProps) {
  const canCreate = canPage("LIBRARY_SYSTEM", "maintenance", "create");
  const canEdit = canPage("LIBRARY_SYSTEM", "maintenance", "edit");
  const canDelete = canPage("LIBRARY_SYSTEM", "maintenance", "delete");

  const [tab, setTab] = useState<Tab>("categories");
  const [modal, setModal] = useState<{ mode: "new" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const crud = tab === "categories" ? lib.categoryCrud : tab === "subjects" ? lib.subjectCrud : tab === "shelves" ? lib.shelfCrud : lib.fineRuleCrud;

  const openNew = () => { setForm(EMPTY); setModal({ mode: "new" }); };
  const openEditCategory = (r: LibraryCategory) => { setForm({ ...EMPTY, code: r.code, name: r.name, description: r.description ?? "" }); setModal({ mode: "edit", id: r.id }); };
  const openEditSubject = (r: LibrarySubject) => { setForm({ ...EMPTY, name: r.name, description: r.description ?? "" }); setModal({ mode: "edit", id: r.id }); };
  const openEditShelf = (r: LibraryShelf) => { setForm({ ...EMPTY, code: r.code, name: r.name, location: r.location ?? "" }); setModal({ mode: "edit", id: r.id }); };
  const openEditRule = (r: LibraryFineRule) => {
    setForm({ ...EMPTY, name: r.name, finePerDay: String(r.finePerDay), graceDays: String(r.graceDays), maxFine: r.maxFine != null ? String(r.maxFine) : "", lostFeeMode: r.lostFeeMode, lostFeeValue: r.lostFeeValue != null ? String(r.lostFeeValue) : "", effectiveFrom: r.effectiveFrom ?? "" });
    setModal({ mode: "edit", id: r.id });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "categories") {
      if (!form.code.trim() || !form.name.trim()) return;
      const payload = { code: form.code.trim(), name: form.name.trim(), description: form.description.trim() || null };
      if (modal?.mode === "edit" && modal.id) lib.categoryCrud.update(modal.id, payload);
      else lib.categoryCrud.add(payload as never);
    } else if (tab === "subjects") {
      if (!form.name.trim()) return;
      const payload = { name: form.name.trim(), description: form.description.trim() || null };
      if (modal?.mode === "edit" && modal.id) lib.subjectCrud.update(modal.id, payload);
      else lib.subjectCrud.add(payload as never);
    } else if (tab === "shelves") {
      if (!form.code.trim() || !form.name.trim()) return;
      const payload = { code: form.code.trim(), name: form.name.trim(), location: form.location.trim() || null };
      if (modal?.mode === "edit" && modal.id) lib.shelfCrud.update(modal.id, payload);
      else lib.shelfCrud.add(payload as never);
    } else {
      if (!form.name.trim()) return;
      const payload = {
        name: form.name.trim(),
        finePerDay: Number(form.finePerDay || 0),
        graceDays: Number(form.graceDays || 0),
        maxFine: form.maxFine ? Number(form.maxFine) : null,
        lostFeeMode: form.lostFeeMode,
        lostFeeValue: form.lostFeeValue ? Number(form.lostFeeValue) : null,
        effectiveFrom: form.effectiveFrom || null,
      };
      if (modal?.mode === "edit" && modal.id) lib.fineRuleCrud.update(modal.id, payload);
      else lib.fineRuleCrud.add(payload as never);
    }
    setModal(null);
  };

  const editButton = (onClick: () => void) => canEdit && (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-stsn-cream text-stsn-brown border border-stsn-beige hover:bg-stsn-beige cursor-pointer transition"><Pencil className="w-3 h-3" /> Edit</button>
  );
  const deleteButton = (id: string, name: string) => canDelete && (
    <button onClick={() => setConfirmDelete({ id, name })} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer transition"><Trash2 className="w-3 h-3" /> Delete</button>
  );

  const categoryCols = useMemo<AppTableColumn<LibraryCategory>[]>(() => [
    { id: "code", header: "Code", accessorFn: (r) => r.code, cell: ({ getValue }) => <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span> },
    { id: "name", header: "Name", accessorFn: (r) => r.name, cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "desc", header: "Description", accessorFn: (r) => r.description ?? "", cell: ({ getValue }) => <span className="text-stone-500">{String(getValue()) || "—"}</span> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-1.5">{editButton(() => openEditCategory(row.original))}{deleteButton(row.original.id, row.original.name)}</div> },
  ], [canEdit, canDelete]);

  const subjectCols = useMemo<AppTableColumn<LibrarySubject>[]>(() => [
    { id: "name", header: "Name", accessorFn: (r) => r.name, cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "desc", header: "Description", accessorFn: (r) => r.description ?? "", cell: ({ getValue }) => <span className="text-stone-500">{String(getValue()) || "—"}</span> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-1.5">{editButton(() => openEditSubject(row.original))}{deleteButton(row.original.id, row.original.name)}</div> },
  ], [canEdit, canDelete]);

  const shelfCols = useMemo<AppTableColumn<LibraryShelf>[]>(() => [
    { id: "code", header: "Code", accessorFn: (r) => r.code, cell: ({ getValue }) => <span className="font-mono font-bold text-stsn-brown">{String(getValue())}</span> },
    { id: "name", header: "Name", accessorFn: (r) => r.name, cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "location", header: "Location", accessorFn: (r) => r.location ?? "", cell: ({ getValue }) => <span className="text-stone-500">{String(getValue()) || "—"}</span> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-1.5">{editButton(() => openEditShelf(row.original))}{deleteButton(row.original.id, row.original.name)}</div> },
  ], [canEdit, canDelete]);

  const ruleCols = useMemo<AppTableColumn<LibraryFineRule>[]>(() => [
    { id: "name", header: "Rule", accessorFn: (r) => r.name, cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span> },
    { id: "perDay", header: "Per Day", accessorFn: (r) => r.finePerDay, cell: ({ row }) => <span className="font-mono text-stone-600">{formatMoney(row.original.finePerDay)}</span> },
    { id: "grace", header: "Grace", accessorFn: (r) => r.graceDays, cell: ({ getValue }) => <span className="font-mono text-stone-600">{String(getValue())}d</span> },
    { id: "max", header: "Max Fine", accessorFn: (r) => r.maxFine ?? 0, cell: ({ row }) => <span className="font-mono text-stone-600">{row.original.maxFine != null ? formatMoney(row.original.maxFine) : "—"}</span> },
    { id: "lost", header: "Lost Fee", accessorFn: (r) => r.lostFeeMode, cell: ({ row }) => <span className="text-stone-500 text-[11px]">{row.original.lostFeeMode.replace("_", " ")}{row.original.lostFeeValue != null ? ` (${row.original.lostFeeValue})` : ""}</span> },
    { id: "active", header: "Active", accessorFn: (r) => (r.isActive ? "y" : "n"), cell: ({ row }) => <LibraryStatusBadge status={row.original.isActive ? "Active" : "Inactive"} /> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-1.5">{editButton(() => openEditRule(row.original))}{deleteButton(row.original.id, row.original.name)}</div> },
  ], [canEdit, canDelete]);

  const activeTitle = TABS.find((t) => t.id === tab)!.label;

  return (
    <>
      {/* sub-tabs */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden mb-4">
        <div className="flex items-stretch overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`py-2.5 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${tab === t.id ? "tab-active-gradient" : "text-stone-500 hover:bg-stone-50"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <SectionPanel
        title={activeTitle}
        icon={Settings}
        actions={canCreate && <AppButton size="sm" leftIcon={Plus} onClick={openNew}>Add {activeTitle.replace(/s$/, "")}</AppButton>}
      >
        {tab === "categories" && <AppTable<LibraryCategory> columns={categoryCols} data={lib.categories} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No categories." />}
        {tab === "subjects" && <AppTable<LibrarySubject> columns={subjectCols} data={lib.subjects} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No subjects." />}
        {tab === "shelves" && <AppTable<LibraryShelf> columns={shelfCols} data={lib.shelves} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No shelves." />}
        {tab === "fine-rules" && <AppTable<LibraryFineRule> columns={ruleCols} data={lib.fineRules} getRowId={(r) => r.id} initialPageSize={10} emptyMessage="No fine rules." />}
      </SectionPanel>

      {modal && (
        <AppModal
          open onClose={() => setModal(null)}
          title={`${modal.mode === "edit" ? "Edit" : "Add"} ${activeTitle.replace(/s$/, "")}`}
          eyebrow="Maintenance" icon={Settings} panelAs="form" onSubmit={submit} maxWidthClass="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton type="submit" size="sm">{modal.mode === "edit" ? "Save" : "Add"}</AppButton>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(tab === "categories" || tab === "shelves") && (
              <div><label className={label}>Code <span className="text-red-500">*</span></label><input className={`${field} font-mono`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            )}
            <div className={tab === "subjects" || tab === "fine-rules" ? "sm:col-span-2" : ""}>
              <label className={label}>Name <span className="text-red-500">*</span></label>
              <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {(tab === "categories" || tab === "subjects") && (
              <div className="sm:col-span-2"><label className={label}>Description</label><input className={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            )}
            {tab === "shelves" && (
              <div><label className={label}>Location</label><input className={field} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            )}
            {tab === "fine-rules" && (
              <>
                <div><label className={label}>Fine / Day</label><input type="number" step="0.01" className={field} value={form.finePerDay} onChange={(e) => setForm({ ...form, finePerDay: e.target.value })} /></div>
                <div><label className={label}>Grace Days</label><input type="number" className={field} value={form.graceDays} onChange={(e) => setForm({ ...form, graceDays: e.target.value })} /></div>
                <div><label className={label}>Max Fine</label><input type="number" step="0.01" className={field} value={form.maxFine} onChange={(e) => setForm({ ...form, maxFine: e.target.value })} /></div>
                <div>
                  <label className={label}>Lost Fee Mode</label>
                  <select className={field} value={form.lostFeeMode} onChange={(e) => setForm({ ...form, lostFeeMode: e.target.value as LibraryLostFeeMode })}>
                    <option value="replacement_cost">Replacement cost</option>
                    <option value="fixed">Fixed</option>
                    <option value="multiplier">Multiplier</option>
                  </select>
                </div>
                <div><label className={label}>Lost Fee Value</label><input type="number" step="0.01" className={field} value={form.lostFeeValue} onChange={(e) => setForm({ ...form, lostFeeValue: e.target.value })} /></div>
                <div><label className={label}>Effective From</label><input type="date" className={field} value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></div>
              </>
            )}
          </div>
        </AppModal>
      )}

      {confirmDelete && (
        <AppModal
          open onClose={() => setConfirmDelete(null)} title="Delete" eyebrow="Confirm" icon={Trash2} maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton variant="destructive" size="sm" leftIcon={Trash2} onClick={() => { crud.remove(confirmDelete.id); setConfirmDelete(null); }}>Delete</AppButton>
            </div>
          }
        >
          <p className="text-xs text-stone-600">Delete <span className="font-bold">{confirmDelete.name}</span>? This cannot be undone.</p>
        </AppModal>
      )}
    </>
  );
}
