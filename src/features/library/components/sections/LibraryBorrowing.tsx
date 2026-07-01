/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { BookMarked, Search, X, CheckCircle, UserRound } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import EmptyState from "../../../../components/common/EmptyState";
import { SectionPanel, LibraryStatusBadge } from "../shared";
import type { LibrarySectionProps } from "./section-props";
import type { LibraryBorrowerOption } from "../../types";

const field = "w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown";
const label = "block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide";

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function LibraryBorrowing({ lib, canPage }: LibrarySectionProps) {
  const canCreate = canPage("LIBRARY_SYSTEM", "borrowing", "create");

  const [borrower, setBorrower] = useState<LibraryBorrowerOption | null>(null);
  const [borrowerQuery, setBorrowerQuery] = useState("");
  const [copyQuery, setCopyQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(addDays(new Date(), 7));
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const bookTitle = (id: string) => lib.books.find((b) => b.id === id)?.title ?? "Unknown";

  const borrowerMatches = useMemo(() => {
    const q = borrowerQuery.trim().toLowerCase();
    if (!q) return [];
    return lib.borrowerOptions
      .filter((b) => b.name.toLowerCase().includes(q) || b.no.toLowerCase().includes(q))
      .slice(0, 8);
  }, [borrowerQuery, lib.borrowerOptions]);

  const availableCopies = useMemo(() => {
    const q = copyQuery.trim().toLowerCase();
    return lib.copies
      .filter((c) => c.copyStatus === "AVAILABLE")
      .filter((c) => {
        if (!q) return true;
        return c.accessionNo.toLowerCase().includes(q) || bookTitle(c.bookId).toLowerCase().includes(q);
      })
      .slice(0, 40);
  }, [copyQuery, lib.copies, lib.books]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const reset = () => {
    setBorrower(null); setBorrowerQuery(""); setCopyQuery(""); setSelected([]);
    setDueDate(addDays(new Date(), 7)); setRemarks("");
  };

  const submit = () => {
    if (!canCreate || !borrower || selected.length === 0 || !dueDate) return;
    const txn = lib.checkout({ borrower, copyIds: selected, dueDate, remarks });
    setSuccess(`Checked out ${selected.length} book${selected.length !== 1 ? "s" : ""} to ${borrower.name} (${txn.transactionNo}).`);
    reset();
  };

  if (!canCreate) {
    return (
      <SectionPanel title="Borrowing / Checkout" icon={BookMarked}>
        <EmptyState icon={BookMarked} title="Checkout not permitted" description="Your access profile can view the library but cannot record checkouts." compact />
      </SectionPanel>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-emerald-800 flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <SectionPanel title="Select Books" icon={Search} meta={`${availableCopies.length} available`}>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5 pointer-events-none" />
            <input className={`${field} pl-8`} placeholder="Search available copies by title or accession…" value={copyQuery} onChange={(e) => setCopyQuery(e.target.value)} />
          </div>
          {availableCopies.length === 0 ? (
            <EmptyState icon={BookMarked} title="No available copies" description="All matching copies are currently out or none match your search." compact />
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {availableCopies.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <label key={c.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition ${on ? "border-stsn-gold bg-stsn-cream/60" : "border-stone-200 hover:bg-stone-50"}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(c.id)} className="accent-stsn-brown" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-800 truncate">{bookTitle(c.bookId)}</p>
                      <p className="text-[10px] font-mono text-stone-400">{c.accessionNo}</p>
                    </div>
                    <LibraryStatusBadge status={c.condition} />
                  </label>
                );
              })}
            </div>
          )}
        </SectionPanel>
      </div>

      {/* Checkout summary rail */}
      <div className="space-y-4">
        <SectionPanel title="Checkout" icon={BookMarked}>
          <div className="space-y-3">
            <div>
              <label className={label}>Borrower <span className="text-red-500">*</span></label>
              {borrower ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stsn-gold bg-stsn-cream/60">
                  <UserRound className="w-4 h-4 text-stsn-brown flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-800 truncate">{borrower.name}</p>
                    <p className="text-[10px] font-mono text-stone-400">{borrower.type} • {borrower.no || "—"}</p>
                  </div>
                  <button onClick={() => { setBorrower(null); setBorrowerQuery(""); }} className="text-stone-400 hover:text-stone-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="relative">
                  <input className={field} placeholder="Search student or employee…" value={borrowerQuery} onChange={(e) => setBorrowerQuery(e.target.value)} />
                  {borrowerMatches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {borrowerMatches.map((b) => (
                        <button key={`${b.type}-${b.refId}`} onClick={() => { setBorrower(b); setBorrowerQuery(""); }} className="w-full text-left px-3 py-2 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-0">
                          <p className="text-xs font-semibold text-stone-800">{b.name}</p>
                          <p className="text-[10px] font-mono text-stone-400">{b.type} • {b.no || "—"}{b.meta ? ` • ${b.meta}` : ""}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={label}>Due Date <span className="text-red-500">*</span></label>
              <input type="date" className={field} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div>
              <label className={label}>Remarks</label>
              <input className={field} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
            </div>

            <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2">
              <p className="text-[10px] uppercase font-mono text-stone-400">Selected books</p>
              <p className="text-lg font-display font-black text-stsn-brown">{selected.length}</p>
            </div>

            <AppButton fullWidth leftIcon={CheckCircle} disabled={!borrower || selected.length === 0 || !dueDate} onClick={submit}>
              Confirm Checkout
            </AppButton>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
