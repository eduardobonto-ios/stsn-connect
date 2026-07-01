/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSTSNStore } from "../../../services/store";
import {
  dbSelectAll,
  dbInsert,
  dbUpdate,
  dbDelete,
  newId,
} from "../../../services/supabaseCrud";
import type {
  LibraryBook,
  LibraryCategory,
  LibraryCopy,
  LibraryFine,
  LibraryFineRule,
  LibraryShelf,
  LibrarySubject,
  LibraryTransaction,
  LibraryTransactionItem,
  LibraryBorrowerOption,
  LibraryCondition,
  LibraryBorrowerType,
} from "../types";

const T = {
  categories: "library_book_categories",
  subjects: "library_book_subjects",
  shelves: "library_shelves",
  fineRules: "library_fine_rules",
  books: "library_books",
  copies: "library_book_copies",
  transactions: "library_borrow_transactions",
  items: "library_borrow_transaction_items",
  fines: "library_fines",
} as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

let txnCounter = 0;
function makeTransactionNo(): string {
  txnCounter += 1;
  const stamp = new Date();
  const ymd = stamp.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Date.now()).slice(-4) + String(txnCounter).padStart(2, "0");
  return `LB-${ymd}-${rand}`;
}

export interface CheckoutInput {
  borrower: LibraryBorrowerOption;
  copyIds: string[];
  dueDate: string;
  issuedBy?: string;
  remarks?: string;
}

export interface ReturnInput {
  returnDate: string;
  condition: LibraryCondition;
  markDamaged?: boolean;
}

export function useLibraryData() {
  const { students, employees, schools, activeSchool, currentUser } = useSTSNStore();

  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [subjects, setSubjects] = useState<LibrarySubject[]>([]);
  const [shelves, setShelves] = useState<LibraryShelf[]>([]);
  const [fineRules, setFineRules] = useState<LibraryFineRule[]>([]);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [copies, setCopies] = useState<LibraryCopy[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [items, setItems] = useState<LibraryTransactionItem[]>([]);
  const [fines, setFines] = useState<LibraryFine[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, sub, shf, rules, bk, cp, txn, itm, fn] = await Promise.all([
        dbSelectAll<LibraryCategory>(T.categories),
        dbSelectAll<LibrarySubject>(T.subjects),
        dbSelectAll<LibraryShelf>(T.shelves),
        dbSelectAll<LibraryFineRule>(T.fineRules),
        dbSelectAll<LibraryBook>(T.books),
        dbSelectAll<LibraryCopy>(T.copies),
        dbSelectAll<LibraryTransaction>(T.transactions),
        dbSelectAll<LibraryTransactionItem>(T.items),
        dbSelectAll<LibraryFine>(T.fines),
      ]);
      setCategories(cat);
      setSubjects(sub);
      setShelves(shf);
      setFineRules(rules);
      setBooks(bk);
      setCopies(cp);
      setTransactions(txn);
      setItems(itm);
      setFines(fn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── school scoping ─────────────────────────────────────────────────────────
  const activeSchoolUuid = useMemo(() => {
    if (activeSchool === "ALL") return null;
    const match = schools.find((s) => s.id === activeSchool || s.shortName === activeSchool);
    return match?.uuid ?? null;
  }, [schools, activeSchool]);

  const inScope = useCallback(
    (schoolId?: string | null) => {
      if (activeSchool === "ALL" || !activeSchoolUuid) return true;
      return !schoolId || schoolId === activeSchoolUuid;
    },
    [activeSchool, activeSchoolUuid],
  );

  const scoped = useMemo(
    () => ({
      categories: categories.filter((r) => inScope(r.schoolId)),
      subjects: subjects.filter((r) => inScope(r.schoolId)),
      shelves: shelves.filter((r) => inScope(r.schoolId)),
      fineRules: fineRules.filter((r) => inScope(r.schoolId)),
      books: books.filter((r) => inScope(r.schoolId)),
      copies: copies.filter((r) => inScope(r.schoolId)),
      transactions: transactions.filter((r) => inScope(r.schoolId)),
      fines: fines.filter((r) => inScope(r.schoolId)),
    }),
    [categories, subjects, shelves, fineRules, books, copies, transactions, fines, inScope],
  );

  const activeFineRule = useMemo(
    () => scoped.fineRules.find((r) => r.isActive) ?? fineRules.find((r) => r.isActive) ?? null,
    [scoped.fineRules, fineRules],
  );

  // ── borrower options (students + employees) ─────────────────────────────────
  const borrowerOptions = useMemo<LibraryBorrowerOption[]>(() => {
    const studentOpts = students
      .filter((s) => activeSchool === "ALL" || s.schoolId === activeSchool)
      .map<LibraryBorrowerOption>((s) => ({
        refId: s.id,
        type: "STUDENT",
        name: `${s.lastName}, ${s.firstName}`,
        no: s.studentNo,
        meta: `${s.yearLevel ?? ""}${s.section ? ` • ${s.section}` : ""}`.trim(),
      }));
    const employeeOpts = employees
      .filter((e) => activeSchool === "ALL" || e.schoolId === activeSchool)
      .map<LibraryBorrowerOption>((e) => ({
        refId: e.id,
        type: "EMPLOYEE",
        name: `${e.lastName}, ${e.firstName}`,
        no: e.employeeNo ?? "",
        meta: e.positionTitle ?? e.position ?? e.department,
      }));
    return [...studentOpts, ...employeeOpts];
  }, [students, employees, activeSchool]);

  const bookById = useCallback((id?: string | null) => books.find((b) => b.id === id), [books]);
  const copyById = useCallback((id?: string | null) => copies.find((c) => c.id === id), [copies]);
  const itemsByTransaction = useCallback(
    (transactionId: string) => items.filter((i) => i.transactionId === transactionId),
    [items],
  );

  const actor = currentUser?.name ?? null;

  // ── catalog CRUD ────────────────────────────────────────────────────────────
  const addBook = useCallback(
    (input: Omit<LibraryBook, "id" | "isActive" | "status"> & { status?: LibraryBook["status"]; isActive?: boolean }) => {
      const row: LibraryBook = {
        id: newId(),
        isActive: input.isActive ?? true,
        status: input.status ?? "Active",
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
        createdBy: actor,
      };
      setBooks((prev) => [row, ...prev]);
      void dbInsert(T.books, row);
      return row;
    },
    [activeSchoolUuid, actor],
  );

  const updateBook = useCallback((id: string, updates: Partial<LibraryBook>) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    void dbUpdate(T.books, id, updates);
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    dbDelete(T.books, id);
  }, []);

  // ── copies CRUD ─────────────────────────────────────────────────────────────
  const addCopy = useCallback(
    (input: Omit<LibraryCopy, "id" | "isActive" | "copyStatus"> & { copyStatus?: LibraryCopy["copyStatus"]; isActive?: boolean }) => {
      const row: LibraryCopy = {
        id: newId(),
        isActive: input.isActive ?? true,
        copyStatus: input.copyStatus ?? "AVAILABLE",
        ...input,
        schoolId: input.schoolId ?? activeSchoolUuid,
      };
      setCopies((prev) => [row, ...prev]);
      void dbInsert(T.copies, row);
      return row;
    },
    [activeSchoolUuid],
  );

  const updateCopy = useCallback((id: string, updates: Partial<LibraryCopy>) => {
    setCopies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    void dbUpdate(T.copies, id, updates);
  }, []);

  const deleteCopy = useCallback((id: string) => {
    setCopies((prev) => prev.filter((c) => c.id !== id));
    dbDelete(T.copies, id);
  }, []);

  // ── maintenance CRUD (generic) ──────────────────────────────────────────────
  function makeCrud<TRow extends { id: string; schoolId?: string | null; isActive: boolean }>(
    table: string,
    setter: React.Dispatch<React.SetStateAction<TRow[]>>,
  ) {
    const add = (input: Omit<TRow, "id" | "isActive"> & { isActive?: boolean }) => {
      const row = {
        id: newId(),
        isActive: (input as { isActive?: boolean }).isActive ?? true,
        ...input,
        schoolId: (input as { schoolId?: string | null }).schoolId ?? activeSchoolUuid,
      } as unknown as TRow;
      setter((prev) => [row, ...prev]);
      void dbInsert(table, row);
      return row;
    };
    const update = (id: string, updates: Partial<TRow>) => {
      setter((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      void dbUpdate(table, id, updates);
    };
    const remove = (id: string) => {
      setter((prev) => prev.filter((r) => r.id !== id));
      dbDelete(table, id);
    };
    return { add, update, remove };
  }

  const categoryCrud = useMemo(() => makeCrud<LibraryCategory>(T.categories, setCategories), [activeSchoolUuid]);
  const subjectCrud = useMemo(() => makeCrud<LibrarySubject>(T.subjects, setSubjects), [activeSchoolUuid]);
  const shelfCrud = useMemo(() => makeCrud<LibraryShelf>(T.shelves, setShelves), [activeSchoolUuid]);
  const fineRuleCrud = useMemo(() => makeCrud<LibraryFineRule>(T.fineRules, setFineRules), [activeSchoolUuid]);

  // ── borrow / checkout ───────────────────────────────────────────────────────
  const checkout = useCallback(
    (input: CheckoutInput) => {
      const txn: LibraryTransaction = {
        id: newId(),
        schoolId: activeSchoolUuid,
        transactionNo: makeTransactionNo(),
        borrowerType: input.borrower.type,
        borrowerRefId: input.borrower.refId,
        borrowerName: input.borrower.name,
        borrowerNo: input.borrower.no,
        checkoutDate: todayStr(),
        dueDate: input.dueDate,
        status: "BORROWED",
        issuedBy: input.issuedBy ?? actor,
        remarks: input.remarks ?? null,
      };
      const newItems: LibraryTransactionItem[] = input.copyIds.map((copyId) => ({
        id: newId(),
        transactionId: txn.id,
        copyId,
        bookId: copyById(copyId)?.bookId ?? null,
        dueDate: input.dueDate,
        returnDate: null,
        returnedCondition: null,
        itemStatus: "BORROWED",
        overdueDays: 0,
        remarks: null,
      }));

      setTransactions((prev) => [txn, ...prev]);
      setItems((prev) => [...newItems, ...prev]);
      setCopies((prev) =>
        prev.map((c) => (input.copyIds.includes(c.id) ? { ...c, copyStatus: "BORROWED" } : c)),
      );

      void dbInsert(T.transactions, txn);
      newItems.forEach((it) => void dbInsert(T.items, it));
      input.copyIds.forEach((copyId) => void dbUpdate(T.copies, copyId, { copyStatus: "BORROWED" }));
      return txn;
    },
    [activeSchoolUuid, actor, copyById],
  );

  // Marks a transaction RETURNED once none of its items remain open. `nextItems`
  // must already reflect the just-applied item change to avoid stale reads.
  const closeTransactionIfResolved = useCallback(
    (transactionId: string, nextItems: LibraryTransactionItem[]) => {
      const related = nextItems.filter((i) => i.transactionId === transactionId);
      const allResolved =
        related.length > 0 &&
        related.every((i) => i.itemStatus !== "BORROWED" && i.itemStatus !== "OVERDUE");
      if (allResolved) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === transactionId ? { ...t, status: "RETURNED" } : t)),
        );
        void dbUpdate(T.transactions, transactionId, { status: "RETURNED" });
      }
    },
    [],
  );

  // ── returns ─────────────────────────────────────────────────────────────────
  const processReturn = useCallback(
    (item: LibraryTransactionItem, input: ReturnInput) => {
      const grace = activeFineRule?.graceDays ?? 0;
      const due = item.dueDate ?? "";
      const overdueDays = due ? Math.max(0, daysBetween(due, input.returnDate) - grace) : 0;
      const damaged = !!input.markDamaged || input.condition === "Poor";

      const nextItemStatus: LibraryTransactionItem["itemStatus"] = damaged ? "DAMAGED" : "RETURNED";
      const itemPatch = {
        returnDate: input.returnDate,
        returnedCondition: input.condition,
        itemStatus: nextItemStatus,
        overdueDays,
      };
      const nextItems = items.map((i) => (i.id === item.id ? { ...i, ...itemPatch } : i));
      setItems(nextItems);
      void dbUpdate(T.items, item.id, itemPatch);

      // copy: back to shelf, or flagged damaged
      const copy = copyById(item.copyId);
      const nextCopyStatus = damaged ? "DAMAGED" : "AVAILABLE";
      setCopies((prev) =>
        prev.map((c) => (c.id === item.copyId ? { ...c, copyStatus: nextCopyStatus, condition: input.condition } : c)),
      );
      void dbUpdate(T.copies, item.copyId, { copyStatus: nextCopyStatus, condition: input.condition });

      // fines
      const txn = transactions.find((t) => t.id === item.transactionId);
      const newFines: LibraryFine[] = [];
      if (overdueDays > 0 && activeFineRule) {
        const raw = overdueDays * activeFineRule.finePerDay;
        const amount = activeFineRule.maxFine != null ? Math.min(raw, activeFineRule.maxFine) : raw;
        newFines.push(makeFine(item, txn, "OVERDUE", amount));
      }
      if (damaged) {
        newFines.push(makeFine(item, txn, "DAMAGED", damagedFeeFor(copy)));
      }
      if (newFines.length) {
        setFines((prev) => [...newFines, ...prev]);
        newFines.forEach((f) => void dbInsert(T.fines, f));
      }

      closeTransactionIfResolved(item.transactionId, nextItems);
      return { overdueDays, fines: newFines };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFineRule, copyById, transactions, items, closeTransactionIfResolved],
  );

  const markLostDamaged = useCallback(
    (copy: LibraryCopy, fineType: "LOST" | "DAMAGED", overrideAmount?: number) => {
      const nextCopyStatus = fineType === "LOST" ? "LOST" : "DAMAGED";
      setCopies((prev) => prev.map((c) => (c.id === copy.id ? { ...c, copyStatus: nextCopyStatus } : c)));
      void dbUpdate(T.copies, copy.id, { copyStatus: nextCopyStatus });

      const openItem = items.find(
        (i) => i.copyId === copy.id && (i.itemStatus === "BORROWED" || i.itemStatus === "OVERDUE"),
      );
      const txn = openItem ? transactions.find((t) => t.id === openItem.transactionId) : undefined;
      const amount = overrideAmount ?? (fineType === "LOST" ? lostFeeFor(copy) : damagedFeeFor(copy));
      const fine = makeFine(openItem, txn, fineType, amount, copy);
      setFines((prev) => [fine, ...prev]);
      void dbInsert(T.fines, fine);

      if (openItem) {
        const nextItems = items.map((i) => (i.id === openItem.id ? { ...i, itemStatus: fineType } : i));
        setItems(nextItems);
        void dbUpdate(T.items, openItem.id, { itemStatus: fineType });
        closeTransactionIfResolved(openItem.transactionId, nextItems);
      }
      return fine;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, transactions, closeTransactionIfResolved],
  );

  // ── fine settlement ─────────────────────────────────────────────────────────
  const settleFine = useCallback((id: string, patch: { orNumber?: string; remarks?: string; paymentId?: string }) => {
    const updates: Partial<LibraryFine> = {
      status: "PAID",
      settledDate: todayStr(),
      orNumber: patch.orNumber ?? null,
      settlementRemarks: patch.remarks ?? null,
      paymentId: patch.paymentId ?? null,
    };
    setFines((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    void dbUpdate(T.fines, id, updates);
  }, []);

  const waiveFine = useCallback((id: string, reason: string) => {
    const updates: Partial<LibraryFine> = { status: "WAIVED", waivedReason: reason, settledDate: todayStr() };
    setFines((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    void dbUpdate(T.fines, id, updates);
  }, []);

  const cancelFine = useCallback((id: string) => {
    setFines((prev) => prev.map((f) => (f.id === id ? { ...f, status: "CANCELLED" } : f)));
    void dbUpdate(T.fines, id, { status: "CANCELLED" });
  }, []);

  // ── internal helpers (closures over state setters) ──────────────────────────
  function makeFine(
    item: LibraryTransactionItem | undefined,
    txn: LibraryTransaction | undefined,
    fineType: LibraryFine["fineType"],
    amount: number,
    copy?: LibraryCopy,
  ): LibraryFine {
    return {
      id: newId(),
      schoolId: txn?.schoolId ?? copy?.schoolId ?? activeSchoolUuid,
      transactionItemId: item?.id ?? null,
      transactionId: txn?.id ?? item?.transactionId ?? null,
      borrowerType: txn?.borrowerType ?? null,
      borrowerRefId: txn?.borrowerRefId ?? null,
      borrowerName: txn?.borrowerName ?? null,
      fineType,
      amount: Number(amount.toFixed(2)),
      status: "PENDING",
      assessedDate: todayStr(),
      createdBy: actor,
    } as LibraryFine;
  }

  function lostFeeFor(copy?: LibraryCopy): number {
    const rule = activeFineRule;
    const cost = copy?.acquisitionCost ?? 0;
    if (!rule) return cost;
    if (rule.lostFeeMode === "fixed") return rule.lostFeeValue ?? cost;
    if (rule.lostFeeMode === "multiplier") return cost * (rule.lostFeeValue ?? 1);
    return cost; // replacement_cost
  }

  function damagedFeeFor(copy?: LibraryCopy): number {
    // Damaged is assessed at half replacement by default, or the rule's flat value.
    const rule = activeFineRule;
    if (rule?.lostFeeMode === "fixed" && rule.lostFeeValue != null) return rule.lostFeeValue;
    return Number(((copy?.acquisitionCost ?? 0) / 2).toFixed(2));
  }

  return {
    loading,
    error,
    reload: load,
    activeSchoolUuid,
    activeFineRule,
    borrowerOptions,
    // raw + scoped data
    categories: scoped.categories,
    subjects: scoped.subjects,
    shelves: scoped.shelves,
    fineRules: scoped.fineRules,
    books: scoped.books,
    copies: scoped.copies,
    transactions: scoped.transactions,
    items,
    fines: scoped.fines,
    // lookups
    bookById,
    copyById,
    itemsByTransaction,
    // catalog + inventory
    addBook,
    updateBook,
    deleteBook,
    addCopy,
    updateCopy,
    deleteCopy,
    // maintenance
    categoryCrud,
    subjectCrud,
    shelfCrud,
    fineRuleCrud,
    // workflows
    checkout,
    processReturn,
    markLostDamaged,
    settleFine,
    waiveFine,
    cancelFine,
  };
}

export type LibraryData = ReturnType<typeof useLibraryData>;
