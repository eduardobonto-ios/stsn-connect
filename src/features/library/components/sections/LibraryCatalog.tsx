/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import AppTable, { type AppTableColumn } from "../../../../components/common/AppTable";
import AppButton from "../../../../components/common/AppButton";
import AppModal from "../../../../components/common/AppModal";
import { SectionPanel, LibraryStatusBadge } from "../shared";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryBook, LibraryBookStatus } from "../../types";

type FormState = {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publicationYear: string;
  categoryId: string;
  subjectId: string;
  edition: string;
  language: string;
  gradeLevels: string;
  status: LibraryBookStatus;
  description: string;
};

const EMPTY: FormState = {
  title: "", author: "", isbn: "", publisher: "", publicationYear: "",
  categoryId: "", subjectId: "", edition: "", language: "", gradeLevels: "",
  status: "Active", description: "",
};

const field = "w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown";
const label = "block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide";

export default function LibraryCatalog({ lib, canPage }: LibrarySectionProps) {
  const canCreate = canPage("LIBRARY_SYSTEM", "catalog", "create");
  const canEdit = canPage("LIBRARY_SYSTEM", "catalog", "edit");
  const canDelete = canPage("LIBRARY_SYSTEM", "catalog", "delete");

  const [modal, setModal] = useState<{ mode: "new" | "edit"; book?: LibraryBook } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<LibraryBook | null>(null);

  const categoryName = (id?: string | null) => lib.categories.find((c) => c.id === id)?.name ?? "—";
  const subjectName = (id?: string | null) => lib.subjects.find((s) => s.id === id)?.name ?? "—";
  const copyCount = (bookId: string) => lib.copies.filter((c) => c.bookId === bookId).length;

  const openNew = () => { setForm(EMPTY); setModal({ mode: "new" }); };
  const openEdit = (book: LibraryBook) => {
    setForm({
      title: book.title,
      author: book.author ?? "",
      isbn: book.isbn ?? "",
      publisher: book.publisher ?? "",
      publicationYear: book.publicationYear ? String(book.publicationYear) : "",
      categoryId: book.categoryId ?? "",
      subjectId: book.subjectId ?? "",
      edition: book.edition ?? "",
      language: book.language ?? "",
      gradeLevels: (book.gradeLevelApplicability ?? []).join(", "),
      status: book.status,
      description: book.description ?? "",
    });
    setModal({ mode: "edit", book });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      author: form.author.trim() || null,
      isbn: form.isbn.trim() || null,
      publisher: form.publisher.trim() || null,
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      categoryId: form.categoryId || null,
      subjectId: form.subjectId || null,
      edition: form.edition.trim() || null,
      language: form.language.trim() || null,
      gradeLevelApplicability: form.gradeLevels
        ? form.gradeLevels.split(",").map((g) => g.trim()).filter(Boolean)
        : null,
      status: form.status,
      description: form.description.trim() || null,
    };
    if (modal?.mode === "edit" && modal.book) {
      lib.updateBook(modal.book.id, payload);
    } else {
      lib.addBook(payload);
    }
    setModal(null);
  };

  const columns = useMemo<AppTableColumn<LibraryBook>[]>(() => [
    {
      id: "title",
      header: "Title",
      accessorFn: (r) => `${r.title} ${r.author ?? ""} ${r.isbn ?? ""}`,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-semibold text-stone-800 truncate">{row.original.title}</p>
          <p className="text-[10px] text-stone-400 truncate">{row.original.author || "—"}{row.original.isbn ? ` • ${row.original.isbn}` : ""}</p>
        </div>
      ),
    },
    { id: "category", header: "Category", accessorFn: (r) => categoryName(r.categoryId), cell: ({ getValue }) => <span className="text-stone-600">{String(getValue())}</span> },
    { id: "subject", header: "Subject", accessorFn: (r) => subjectName(r.subjectId), cell: ({ getValue }) => <span className="text-stone-600">{String(getValue())}</span> },
    { id: "copies", header: "Copies", accessorFn: (r) => copyCount(r.id), cell: ({ getValue }) => <span className="block text-center font-mono font-bold text-stone-700">{String(getValue())}</span> },
    { id: "status", header: "Status", accessorFn: (r) => r.status, cell: ({ row }) => <LibraryStatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
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
  ], [lib.categories, lib.subjects, lib.copies, canEdit, canDelete]);

  return (
    <>
      <SectionPanel
        title="Book Catalog"
        icon={BookOpen}
        meta={`${lib.books.length} titles`}
        actions={canCreate && <AppButton size="sm" leftIcon={Plus} onClick={openNew}>Add Title</AppButton>}
      >
        <AppTable<LibraryBook>
          columns={columns}
          data={lib.books}
          getRowId={(r) => r.id}
          emptyMessage="No books in the catalog yet."
          initialPageSize={10}
        />
      </SectionPanel>

      {modal && (
        <AppModal
          open
          onClose={() => setModal(null)}
          title={modal.mode === "edit" ? "Edit Title" : "Add Title"}
          eyebrow="Book Catalog"
          icon={BookOpen}
          panelAs="form"
          onSubmit={submit}
          maxWidthClass="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton type="submit" size="sm">{modal.mode === "edit" ? "Save Changes" : "Add Title"}</AppButton>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={label}>Title <span className="text-red-500">*</span></label>
              <input className={field} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div><label className={label}>Author</label><input className={field} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
            <div><label className={label}>ISBN</label><input className={field} value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
            <div><label className={label}>Publisher</label><input className={field} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} /></div>
            <div><label className={label}>Publication Year</label><input type="number" className={field} value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} /></div>
            <div>
              <label className={label}>Category</label>
              <select className={field} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">—</option>
                {lib.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Subject</label>
              <select className={field} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">—</option>
                {lib.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className={label}>Edition</label><input className={field} value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} /></div>
            <div><label className={label}>Language</label><input className={field} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
            <div>
              <label className={label}>Status</label>
              <select className={field} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LibraryBookStatus })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div className="sm:col-span-2"><label className={label}>Grade Levels (comma-separated)</label><input className={field} placeholder="e.g. Grade 7, Grade 8" value={form.gradeLevels} onChange={(e) => setForm({ ...form, gradeLevels: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={label}>Description</label><textarea rows={2} className={`${field} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
        </AppModal>
      )}

      {confirmDelete && (
        <AppModal
          open
          onClose={() => setConfirmDelete(null)}
          title="Delete Title"
          eyebrow="Confirm"
          icon={Trash2}
          maxWidthClass="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="text-xs font-bold px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition">Cancel</button>
              <AppButton variant="destructive" size="sm" leftIcon={Trash2} onClick={() => { lib.deleteBook(confirmDelete.id); setConfirmDelete(null); }}>Delete</AppButton>
            </div>
          }
        >
          <p className="text-xs text-stone-600">
            Delete <span className="font-bold">{confirmDelete.title}</span>? This also removes its {copyCount(confirmDelete.id)} linked copies. This cannot be undone.
          </p>
        </AppModal>
      )}
    </>
  );
}
