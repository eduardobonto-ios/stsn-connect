/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Library, BookOpen, AlertCircle, Eye, ToggleLeft, ToggleRight, X, Check, GraduationCap, Package, Coins, Plus, Trash2, Search,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import { useAppDialog } from "../../../components/common/useAppDialog";
import type { BookPackage, BookPackageItem } from "../../../types";
import type { AcademicUnit } from "../../../types/school.types";
import {
  BOOK_PACKAGE_GRADE_LEVELS,
  BOOKS_PACKAGE_ASSIGNMENT_NOTICE,
  BOOKS_NOT_APPLICABLE_NOTICE,
  computeBookPackageTotal,
} from "../../../config/books.config";

const ACADEMIC_UNIT_OPTIONS: { value: AcademicUnit | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "basic-ed", label: "Basic Education" },
  { value: "college", label: "College" },
];

export default function BooksSetupPage() {
  const { academicUnit, activeSchool, bookPackages: packages, subjects, addBookPackage, updateBookPackage, setupData } = useSTSNStore();
  const { toast } = useAppDialog();

  const SCHOOL_YEAR_OPTIONS = useMemo(() => setupData.school_years?.map((sy) => sy.name) || [], [setupData]);
  const CURRENT_SCHOOL_YEAR = useMemo(
    () => setupData.school_years?.find((sy: any) => sy.isCurrent)?.name || SCHOOL_YEAR_OPTIONS[0] || "2026-2027",
    [setupData, SCHOOL_YEAR_OPTIONS]
  );

  // ---- Filters ----
  const [filterSchoolYear, setFilterSchoolYear] = useState(CURRENT_SCHOOL_YEAR);
  const [filterSchool, setFilterSchool] = useState<"All" | "STSN" | "CDSTA">(
    activeSchool === "STSN" || activeSchool === "CDSTA" ? activeSchool : "All"
  );
  const [filterAcademicUnit, setFilterAcademicUnit] = useState<AcademicUnit | "All">(
    academicUnit || "All"
  );
  const [filterGradeLevel, setFilterGradeLevel] = useState("All");
  const [filterStatus, setFilterStatus] = useState<"All" | BookPackage["status"]>("All");
  const [filterSearch, setFilterSearch] = useState("");

  // ---- Detail / Edit modal ----
  const [selectedPackage, setSelectedPackage] = useState<BookPackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editDraft, setEditDraft] = useState<BookPackage | null>(null);

  const isCollegeView = filterAcademicUnit === "college";
  const basicEdSubjects = subjects.filter((subject) => subject.department === "Basic Education");

  const filteredPackages = useMemo(() => {
    if (isCollegeView) return [];
    const q = filterSearch.toLowerCase();
    return packages.filter((p) => {
      const matchYear = filterSchoolYear === "All" || p.schoolYear === filterSchoolYear;
      const matchSchool = filterSchool === "All" || p.schoolId === filterSchool;
      const matchUnit = filterAcademicUnit === "All" || p.academicUnit === filterAcademicUnit;
      const matchGrade = filterGradeLevel === "All" || p.gradeLevel === filterGradeLevel;
      const matchStatus = filterStatus === "All" || p.status === filterStatus;
      const matchSearch = !q || p.packageName.toLowerCase().includes(q) || p.gradeLevel.toLowerCase().includes(q) || p.schoolYear.includes(q);
      return matchYear && matchSchool && matchUnit && matchGrade && matchStatus && matchSearch;
    });
  }, [packages, filterSchoolYear, filterSchool, filterAcademicUnit, filterGradeLevel, filterStatus, isCollegeView, filterSearch]);

  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.status === "Active").length;
  const gradeLevelsCovered = new Set(packages.map((p) => p.gradeLevel)).size;
  const totalCatalogValue = packages.reduce((sum, p) => sum + p.totalAmount, 0);

  const openView = (pkg: BookPackage) => {
    setSelectedPackage(pkg);
    setIsEditing(false);
    setIsCreating(false);
    setEditDraft(null);
  };

  const openEdit = (pkg: BookPackage) => {
    setSelectedPackage(pkg);
    setIsEditing(true);
    setIsCreating(false);
    setEditDraft({ ...pkg, books: pkg.books.map((b) => ({ ...b })) });
  };

  const openCreate = () => {
    const schoolId = activeSchool === "STSN" || activeSchool === "CDSTA"
      ? activeSchool
      : filterSchool === "STSN" || filterSchool === "CDSTA" ? filterSchool : "STSN";
    setSelectedPackage(null);
    setIsEditing(false);
    setIsCreating(true);
    setEditDraft({
      id: "",
      packageName: "",
      gradeLevel: BOOK_PACKAGE_GRADE_LEVELS[0],
      schoolId,
      academicUnit: "basic-ed",
      schoolYear: filterSchoolYear === "All" ? CURRENT_SCHOOL_YEAR : filterSchoolYear,
      books: [{ id: crypto.randomUUID(), title: "", subjectCode: "", quantity: 1, unitPrice: 0 }],
      totalAmount: 0,
      isRequired: true,
      status: "Active",
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
  };

  const closeModal = () => {
    setSelectedPackage(null);
    setIsEditing(false);
    setIsCreating(false);
    setEditDraft(null);
  };

  const updateDraftBook = (bookId: string, field: keyof Pick<BookPackageItem, "title" | "subjectCode" | "quantity" | "unitPrice">, value: string | number) => {
    if (!editDraft) return;
    const books = editDraft.books.map((b) => (b.id === bookId ? { ...b, [field]: value } : b));
    setEditDraft({ ...editDraft, books, totalAmount: computeBookPackageTotal(books) });
  };

  const addDraftBook = () => {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      books: [...editDraft.books, { id: crypto.randomUUID(), title: "", subjectCode: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const removeDraftBook = (bookId: string) => {
    if (!editDraft || editDraft.books.length === 1) return;
    const books = editDraft.books.filter((book) => book.id !== bookId);
    setEditDraft({ ...editDraft, books, totalAmount: computeBookPackageTotal(books) });
  };

  const toggleDraftFlag = (field: "isRequired" | "status") => {
    if (!editDraft) return;
    if (field === "isRequired") {
      setEditDraft({ ...editDraft, isRequired: !editDraft.isRequired });
    } else {
      setEditDraft({ ...editDraft, status: editDraft.status === "Active" ? "Inactive" : "Active" });
    }
  };

  const saveDraft = () => {
    if (!editDraft) return;
    if (!editDraft.packageName.trim() || editDraft.books.some((book) => !book.title.trim())) {
      toast("Package name and all book titles are required.", { variant: "warning" });
      return;
    }
    if (isCreating && packages.some((pkg) =>
      pkg.schoolId === editDraft.schoolId && pkg.schoolYear === editDraft.schoolYear && pkg.gradeLevel === editDraft.gradeLevel
    )) {
      toast(`A book package already exists for ${editDraft.gradeLevel} in ${editDraft.schoolYear}.`, { variant: "warning" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const packageToSave = { ...editDraft, packageName: editDraft.packageName.trim(), lastUpdated: today };
    if (isCreating) {
      const { id: _id, ...newPackage } = packageToSave;
      addBookPackage(newPackage);
    } else {
      updateBookPackage(editDraft.id, packageToSave);
    }
    closeModal();
  };

  const quickToggleStatus = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;
    updateBookPackage(pkgId, { status: pkg.status === "Active" ? "Inactive" : "Active", lastUpdated: new Date().toISOString().slice(0, 10) });
  };

  const displayPackage = isEditing || isCreating ? editDraft : selectedPackage;

  const legacyPackageColumns: any[] = [
    {
      accessorKey: "gradeLevel",
      header: "Grade Level",
      cell: ({ getValue }) => <span className="font-bold text-stsn-brown">{String(getValue())}</span>,
    },
    {
      accessorKey: "packageName",
      header: "Package Name",
      cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span>,
    },
    {
      accessorKey: "books",
      header: "Included Books",
      cell: ({ getValue }) => (
        <span className="block text-center text-stone-600">{(getValue() as BookPackageItem[]).length}</span>
      ),
    },
    {
      accessorFn: (row) => `₱${row.totalAmount.toLocaleString()}`,
      id: "totalAmount",
      header: "Total Amount",
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <AppStatusBadge status={String(getValue())} className="mx-auto flex w-fit text-[9px]" />,
    },
    {
      accessorKey: "schoolYear",
      header: "Effective SY",
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue())}</span>,
    } as AppTableColumn<BookPackage>,
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ getValue }) => <span className="text-stone-500 text-[11px]">{String(getValue())}</span>,
    } as AppTableColumn<BookPackage>,
    {
      title: "Actions",
      className: "text-center",
      orderable: false,
      searchable: false,
      render: (_value, pkg) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openView(pkg)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer transition" title="View details">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openEdit(pkg)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer transition" title="Edit package">
            <Package className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => quickToggleStatus(pkg.id)}
            title={pkg.status === "Active" ? "Set Inactive" : "Set Active"}
            className="p-1.5 hover:bg-emerald-50 rounded text-stone-400 hover:text-emerald-600 cursor-pointer transition"
          >
            {pkg.status === "Active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  void legacyPackageColumns;

  const packageColumns: AppTableColumn<BookPackage>[] = [
    {
      accessorKey: "gradeLevel",
      header: "Grade Level",
      cell: ({ getValue }) => <span className="font-bold text-stsn-brown">{String(getValue())}</span>,
    },
    {
      accessorKey: "packageName",
      header: "Package Name",
      cell: ({ getValue }) => <span className="font-semibold text-stone-800">{String(getValue())}</span>,
    },
    {
      accessorKey: "books",
      header: "Included Books",
      cell: ({ getValue }) => (
        <span className="block text-center text-stone-600">{getValue<BookPackageItem[]>().length}</span>
      ),
    },
    {
      accessorFn: (row) => `₱${row.totalAmount.toLocaleString()}`,
      id: "totalAmount",
      header: "Total Amount",
      cell: ({ getValue }) => (
        <span className="block text-right font-mono font-bold text-stone-800">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <AppStatusBadge status={String(getValue())} className="mx-auto flex w-fit text-[9px]" />,
    },
    {
      accessorKey: "schoolYear",
      header: "Effective SY",
      cell: ({ getValue }) => <span className="text-stone-600">{String(getValue())}</span>,
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ getValue }) => <span className="text-stone-500 text-[11px]">{String(getValue())}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <div className="flex items-center justify-center gap-1">
            <button type="button" onClick={() => openView(pkg)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer transition" title="View details">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => openEdit(pkg)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer transition" title="Edit package">
              <Package className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => quickToggleStatus(pkg.id)}
              title={pkg.status === "Active" ? "Set Inactive" : "Set Active"}
              className="p-1.5 hover:bg-emerald-50 rounded text-stone-400 hover:text-emerald-600 cursor-pointer transition"
            >
              {pkg.status === "Active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in font-sans space-y-4">
      <PageHeader
        icon={Library}
        title="Books Setup"
        description="Configure required book packages by Basic Education grade level."
      >
        <button
          type="button"
          onClick={openCreate}
          disabled={isCollegeView}
          className="flex items-center gap-2 bg-stsn-brown hover:bg-stsn-brown-dark disabled:opacity-50 disabled:cursor-not-allowed text-stsn-cream font-bold text-xs px-4 py-2.5 rounded-lg shadow cursor-pointer transition"
        >
          <Plus className="w-4 h-4" /> Add Book Package
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Packages" value={totalPackages} icon={Library} tone="brand" />
        <StatCard label="Active Packages" value={activePackages} icon={ToggleRight} tone="success" />
        <StatCard label="Grade Levels Covered" value={gradeLevelsCovered} icon={GraduationCap} tone="warning" />
        <StatCard label="Total Catalog Value" value={`₱${totalCatalogValue.toLocaleString()}`} icon={Coins} tone="info" />
      </div>

      {/* UI Rule Notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 font-semibold">{BOOKS_PACKAGE_ASSIGNMENT_NOTICE}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">School Year</label>
            <select
              value={filterSchoolYear}
              onChange={(e) => setFilterSchoolYear(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              <option value="All">All</option>
              {SCHOOL_YEAR_OPTIONS.map((sy) => <option key={sy} value={sy}>{sy}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">School</label>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value as "All" | "STSN" | "CDSTA")}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              <option value="All">All</option>
              <option value="STSN">St. Theresa's School of Novaliches</option>
              <option value="CDSTA">Colegio de Sta. Teresa de Avila</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Academic Unit</label>
            <select
              value={filterAcademicUnit}
              onChange={(e) => {
                const value = e.target.value as AcademicUnit | "All";
                setFilterAcademicUnit(value);
                if (value !== "basic-ed") setFilterGradeLevel("All");
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
            >
              {ACADEMIC_UNIT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Grade Level</label>
            <select
              value={filterGradeLevel}
              onChange={(e) => setFilterGradeLevel(e.target.value)}
              disabled={isCollegeView}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown disabled:opacity-50"
            >
              <option value="All">All</option>
              {BOOK_PACKAGE_GRADE_LEVELS.map((gl) => <option key={gl} value={gl}>{gl}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "All" | BookPackage["status"])}
              disabled={isCollegeView}
              className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown disabled:opacity-50"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table or College empty state */}
      {isCollegeView ? (
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-16 text-center">
          <BookOpen className="w-12 h-12 text-stone-200 mx-auto mb-3" />
          <p className="text-sm text-stone-500 font-semibold">{BOOKS_NOT_APPLICABLE_NOTICE}</p>
        </div>
      ) : (
        <AppTable<BookPackage>
          data={filteredPackages}
          columns={packageColumns}
          title="Book Packages"
          enableSearch={false}
          enableColumnVisibility={false}
          initialPageSize={10}
          pageSizeOptions={[10]}
          loading={false}
          emptyMessage="No book packages match the selected filters."
          emptyDescription="Adjust the search or filters to find book packages."
          getRowId={(row) => row.id}
          toolbar={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="search"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search package name or grade level…"
                className="h-9 w-64 rounded-lg border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] pl-9 pr-8 text-xs text-[var(--erp-text)] outline-none transition placeholder:text-stone-400 focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                aria-label="Search book packages"
              />
              {filterSearch && (
                <button
                  type="button"
                  onClick={() => setFilterSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
                  aria-label="Clear book package search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          }
          searchPlaceholder="Search package name or grade level…"
        />
      )}

      {/* Detail / Edit Modal */}
      {displayPackage && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark text-white p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5" />
                <h3 className="font-display font-bold text-sm">
                  {isCreating ? "Add Book Package" : isEditing ? "Edit Book Package" : "Book Package Details"}
                </h3>
              </div>
              <button onClick={closeModal} className="cursor-pointer hover:bg-white/20 rounded p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-stsn-cream space-y-4 overflow-y-auto flex-1">
              {/* Header fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Package Name</label>
                  {isCreating ? (
                    <input
                      required
                      value={displayPackage.packageName}
                      onChange={(e) => setEditDraft({ ...displayPackage, packageName: e.target.value })}
                      placeholder="e.g. Grade 5 Book Package"
                      className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    />
                  ) : (
                    <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-800">{displayPackage.packageName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Grade Level</label>
                  {isCreating ? (
                    <select
                      value={displayPackage.gradeLevel}
                      onChange={(e) => setEditDraft({ ...displayPackage, gradeLevel: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stsn-brown focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    >
                      {BOOK_PACKAGE_GRADE_LEVELS.map((gradeLevel) => <option key={gradeLevel}>{gradeLevel}</option>)}
                    </select>
                  ) : (
                    <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stsn-brown">{displayPackage.gradeLevel}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">School Year</label>
                  {isCreating ? (
                    <select
                      value={displayPackage.schoolYear}
                      onChange={(e) => setEditDraft({ ...displayPackage, schoolYear: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    >
                      {SCHOOL_YEAR_OPTIONS.map((schoolYear) => <option key={schoolYear}>{schoolYear}</option>)}
                    </select>
                  ) : (
                    <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-800">{displayPackage.schoolYear}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Total Price</label>
                  <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-stone-800">₱{displayPackage.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              {isCreating && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">School</label>
                  <select
                    value={displayPackage.schoolId}
                    onChange={(e) => setEditDraft({ ...displayPackage, schoolId: e.target.value as BookPackage["schoolId"] })}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                  >
                    <option value="STSN">St. Theresa's School of Novaliches</option>
                    <option value="CDSTA">Colegio de Sta. Teresa de Avila</option>
                  </select>
                </div>
              )}

              {/* Required / Active toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Required / Included</label>
                  {isEditing || isCreating ? (
                    <button
                      type="button"
                      onClick={() => toggleDraftFlag("isRequired")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${displayPackage.isRequired ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}
                    >
                      {displayPackage.isRequired ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {displayPackage.isRequired ? "Required / Included" : "Optional"}
                    </button>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold ${displayPackage.isRequired ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}>
                      {displayPackage.isRequired ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {displayPackage.isRequired ? "Required / Included" : "Optional"}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Active / Inactive</label>
                  {isEditing || isCreating ? (
                    <button
                      type="button"
                      onClick={() => toggleDraftFlag("status")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${displayPackage.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}
                    >
                      {displayPackage.status === "Active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {displayPackage.status}
                    </button>
                  ) : (
                    <AppStatusBadge status={displayPackage.status} className="gap-1.5 px-3 py-2 text-xs">
                      {displayPackage.status === "Active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {displayPackage.status}
                    </AppStatusBadge>
                  )}
                </div>
              </div>

              {/* Book list */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Book List</label>
                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[9px]">Title</th>
                        <th className="text-left py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[9px]">Subject</th>
                        <th className="text-center py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[9px] w-20">Qty</th>
                        <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[9px] w-28">Unit Price</th>
                        <th className="text-right py-2 px-3 font-bold text-stone-500 uppercase tracking-wider text-[9px] w-28">Line Total</th>
                        {(isEditing || isCreating) && <th className="w-10" aria-label="Actions" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {displayPackage.books.map((book: BookPackageItem) => (
                        <tr key={book.id}>
                          <td className="py-2 px-3 font-semibold text-stone-800">
                            {isEditing || isCreating ? (
                              <input
                                required
                                value={book.title}
                                onChange={(e) => updateDraftBook(book.id, "title", e.target.value)}
                                placeholder="Book title"
                                className="w-full min-w-36 bg-stone-50 border border-stone-200 rounded py-1 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                              />
                            ) : book.title}
                          </td>
                          <td className="py-2 px-3 text-stone-500 font-mono text-[10px]">
                            {isEditing || isCreating ? (
                              <select
                                value={book.subjectCode || ""}
                                onChange={(e) => updateDraftBook(book.id, "subjectCode", e.target.value)}
                                className="w-full min-w-28 bg-stone-50 border border-stone-200 rounded py-1 px-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                              >
                                <option value="">— General —</option>
                                {basicEdSubjects.map((subject) => <option key={subject.id} value={subject.code}>{subject.code}</option>)}
                              </select>
                            ) : book.subjectCode || "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isEditing || isCreating ? (
                              <input
                                type="number"
                                min={0}
                                value={book.quantity}
                                onChange={(e) => updateDraftBook(book.id, "quantity", Math.max(0, Number(e.target.value)))}
                                className="w-16 bg-stone-50 border border-stone-200 rounded py-1 px-1.5 text-xs text-center font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                              />
                            ) : book.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {isEditing || isCreating ? (
                              <input
                                type="number"
                                min={0}
                                value={book.unitPrice}
                                onChange={(e) => updateDraftBook(book.id, "unitPrice", Math.max(0, Number(e.target.value)))}
                                className="w-24 bg-stone-50 border border-stone-200 rounded py-1 px-1.5 text-xs text-right font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                              />
                            ) : `₱${book.unitPrice.toLocaleString()}`}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-800">
                            ₱{(book.quantity * book.unitPrice).toLocaleString()}
                          </td>
                          {(isEditing || isCreating) && (
                            <td className="py-2 pr-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeDraftBook(book.id)}
                                disabled={displayPackage.books.length === 1}
                                className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Remove book"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-stone-50 border-t border-stone-200">
                        <td colSpan={4} className="py-2 px-3 text-right font-bold text-stone-600 uppercase text-[10px]">Total Price</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-stsn-brown">₱{displayPackage.totalAmount.toLocaleString()}</td>
                        {(isEditing || isCreating) && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {(isEditing || isCreating) && (
                  <button
                    type="button"
                    onClick={addDraftBook}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-stsn-brown hover:text-stsn-brown-dark cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Book
                  </button>
                )}
              </div>

              {(isEditing || isCreating) && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-600">The package and its book list will be saved to Book Setup.</p>
                </div>
              )}

              {isEditing || isCreating ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-white border border-stone-200 text-stone-600 font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition"
                  >
                    {isCreating ? "Create Book Package" : "Save Changes"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openEdit(selectedPackage as BookPackage)}
                  className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition"
                >
                  Edit Package
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
