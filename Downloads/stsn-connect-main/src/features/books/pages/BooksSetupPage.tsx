/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Coins,
  Eye,
  GraduationCap,
  Library,
  Package,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppModal from "../../../components/common/AppModal";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { useAppDialog } from "../../../components/common/useAppDialog";
import {
  BOOK_PACKAGE_GRADE_LEVELS,
  BOOKS_NOT_APPLICABLE_NOTICE,
  BOOKS_PACKAGE_ASSIGNMENT_NOTICE,
  computeBookPackageTotal,
} from "../../../config/books.config";
import { useSTSNStore } from "../../../services/store";
import type { BookPackage, BookPackageItem } from "../../../types";
import type { AcademicUnit } from "../../../types/school.types";

const ACADEMIC_UNIT_OPTIONS: { value: AcademicUnit | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "basic-ed", label: "Basic Education" },
  { value: "college", label: "College" },
];

export default function BooksSetupPage() {
  const {
    academicUnit,
    activeSchool,
    bookPackages: packages,
    subjects,
    addBookPackage,
    updateBookPackage,
    setupData,
  } = useSTSNStore();
  const { toast } = useAppDialog();

  const schoolYearOptions = useMemo(
    () => setupData.school_years?.map((schoolYear) => schoolYear.name) || [],
    [setupData],
  );
  const currentSchoolYear = useMemo(
    () =>
      setupData.school_years?.find((schoolYear: any) => schoolYear.isCurrent)?.name ||
      schoolYearOptions[0] ||
      "2026-2027",
    [setupData, schoolYearOptions],
  );

  const [filterSchoolYear, setFilterSchoolYear] = useState(currentSchoolYear);
  const [filterSchool, setFilterSchool] = useState<"All" | "STSN" | "CDSTA">(
    activeSchool === "STSN" || activeSchool === "CDSTA" ? activeSchool : "All",
  );
  const [filterAcademicUnit, setFilterAcademicUnit] = useState<AcademicUnit | "All">(
    academicUnit || "All",
  );
  const [filterGradeLevel, setFilterGradeLevel] = useState("All");
  const [filterStatus, setFilterStatus] = useState<"All" | BookPackage["status"]>("All");
  const [filterSearch, setFilterSearch] = useState("");

  const [selectedPackage, setSelectedPackage] = useState<BookPackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editDraft, setEditDraft] = useState<BookPackage | null>(null);

  const isCollegeView = filterAcademicUnit === "college";
  const basicEdSubjects = subjects.filter((subject) => subject.department === "Basic Education");

  const filteredPackages = useMemo(() => {
    if (isCollegeView) return [];
    const query = filterSearch.toLowerCase();
    return packages.filter((pkg) => {
      const matchYear = filterSchoolYear === "All" || pkg.schoolYear === filterSchoolYear;
      const matchSchool = filterSchool === "All" || pkg.schoolId === filterSchool;
      const matchUnit = filterAcademicUnit === "All" || pkg.academicUnit === filterAcademicUnit;
      const matchGrade = filterGradeLevel === "All" || pkg.gradeLevel === filterGradeLevel;
      const matchStatus = filterStatus === "All" || pkg.status === filterStatus;
      const matchSearch =
        !query ||
        pkg.packageName.toLowerCase().includes(query) ||
        pkg.gradeLevel.toLowerCase().includes(query) ||
        pkg.schoolYear.includes(query);
      return matchYear && matchSchool && matchUnit && matchGrade && matchStatus && matchSearch;
    });
  }, [
    packages,
    filterSchoolYear,
    filterSchool,
    filterAcademicUnit,
    filterGradeLevel,
    filterStatus,
    isCollegeView,
    filterSearch,
  ]);

  const totalPackages = packages.length;
  const activePackages = packages.filter((pkg) => pkg.status === "Active").length;
  const gradeLevelsCovered = new Set(packages.map((pkg) => pkg.gradeLevel)).size;
  const totalCatalogValue = packages.reduce((sum, pkg) => sum + pkg.totalAmount, 0);

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
    setEditDraft({ ...pkg, books: pkg.books.map((book) => ({ ...book })) });
  };

  const openCreate = () => {
    const schoolId =
      activeSchool === "STSN" || activeSchool === "CDSTA"
        ? activeSchool
        : filterSchool === "STSN" || filterSchool === "CDSTA"
          ? filterSchool
          : "STSN";
    setSelectedPackage(null);
    setIsEditing(false);
    setIsCreating(true);
    setEditDraft({
      id: "",
      packageName: "",
      gradeLevel: BOOK_PACKAGE_GRADE_LEVELS[0],
      schoolId,
      academicUnit: "basic-ed",
      schoolYear: filterSchoolYear === "All" ? currentSchoolYear : filterSchoolYear,
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

  const updateDraftBook = (
    bookId: string,
    field: keyof Pick<BookPackageItem, "title" | "subjectCode" | "quantity" | "unitPrice">,
    value: string | number,
  ) => {
    if (!editDraft) return;
    const books = editDraft.books.map((book) => (book.id === bookId ? { ...book, [field]: value } : book));
    setEditDraft({ ...editDraft, books, totalAmount: computeBookPackageTotal(books) });
  };

  const addDraftBook = () => {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      books: [
        ...editDraft.books,
        { id: crypto.randomUUID(), title: "", subjectCode: "", quantity: 1, unitPrice: 0 },
      ],
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
      setEditDraft({
        ...editDraft,
        status: editDraft.status === "Active" ? "Inactive" : "Active",
      });
    }
  };

  const saveDraft = () => {
    if (!editDraft) return;
    if (!editDraft.packageName.trim() || editDraft.books.some((book) => !book.title.trim())) {
      toast("Package name and all book titles are required.", { variant: "warning" });
      return;
    }
    if (
      isCreating &&
      packages.some(
        (pkg) =>
          pkg.schoolId === editDraft.schoolId &&
          pkg.schoolYear === editDraft.schoolYear &&
          pkg.gradeLevel === editDraft.gradeLevel,
      )
    ) {
      toast(`A book package already exists for ${editDraft.gradeLevel} in ${editDraft.schoolYear}.`, {
        variant: "warning",
      });
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
    const pkg = packages.find((entry) => entry.id === pkgId);
    if (!pkg) return;
    updateBookPackage(pkgId, {
      status: pkg.status === "Active" ? "Inactive" : "Active",
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
  };

  const displayPackage = isEditing || isCreating ? editDraft : selectedPackage;

  const packageColumns: AppTableColumn<BookPackage>[] = [
    {
      accessorKey: "gradeLevel",
      header: "Grade Level",
      cell: ({ getValue }) => (
        <span className="font-bold text-[var(--erp-brand)]">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "packageName",
      header: "Package Name",
      cell: ({ getValue }) => (
        <span className="font-semibold text-[var(--erp-text)]">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "books",
      header: "Included Books",
      cell: ({ getValue }) => (
        <span className="block text-center text-[var(--erp-text-muted)]">
          {getValue<BookPackageItem[]>().length}
        </span>
      ),
    },
    {
      accessorFn: (row) => `PHP ${row.totalAmount.toLocaleString()}`,
      id: "totalAmount",
      header: "Total Amount",
      cell: ({ getValue }) => (
        <span className="block text-right font-mono font-bold text-[var(--erp-text)]">
          {String(getValue())}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <AppStatusBadge status={String(getValue())} className="mx-auto flex w-fit text-[9px]" />
      ),
    },
    {
      accessorKey: "schoolYear",
      header: "Effective SY",
      cell: ({ getValue }) => <span className="text-[var(--erp-text-muted)]">{String(getValue())}</span>,
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ getValue }) => (
        <span className="text-[11px] text-[var(--erp-text-muted)]">{String(getValue())}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <AppButton type="button" size="xs" variant="outline" onClick={() => openView(pkg)} leftIcon={Eye}>
              View
            </AppButton>
            <AppButton type="button" size="xs" variant="outline" onClick={() => openEdit(pkg)} leftIcon={Package}>
              Edit
            </AppButton>
            <AppButton
              type="button"
              size="xs"
              variant={pkg.status === "Active" ? "danger-outline" : "secondary"}
              onClick={() => quickToggleStatus(pkg.id)}
              leftIcon={pkg.status === "Active" ? ToggleRight : ToggleLeft}
            >
              {pkg.status === "Active" ? "Deactivate" : "Activate"}
            </AppButton>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <ModulePageHeader
        badge="Books Setup"
        badgeIcon={Library}
        title="Books and Package Setup"
        subtitle="Configure required Basic Education book packages by school, school year, and grade level while preserving the existing package assignment workflow."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">Active Packages</p>
              <p className="mt-1 text-lg font-semibold text-white">{activePackages}</p>
            </div>
            <AppButton
              type="button"
              onClick={openCreate}
              disabled={isCollegeView}
              leftIcon={Plus}
            >
              Add Book Package
            </AppButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Packages", value: totalPackages, icon: Library },
          { label: "Grade Levels Covered", value: gradeLevelsCovered, icon: GraduationCap },
          { label: "Catalog Value", value: `PHP ${totalCatalogValue.toLocaleString()}`, icon: Coins },
          { label: "Current School Year", value: currentSchoolYear, icon: BookOpen },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <AppCard key={stat.label} tone="brand" className="border border-[var(--erp-border)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--erp-text)]">{stat.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--erp-border)] bg-white shadow-sm">
                  <Icon className="h-4.5 w-4.5 text-[var(--erp-brand)]" />
                </div>
              </div>
            </AppCard>
          );
        })}
      </div>

      <AppCard className="border border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <div>
            <p className="text-xs font-semibold text-blue-900">Assignment Notice</p>
            <p className="mt-1 text-xs leading-relaxed text-blue-800">
              {BOOKS_PACKAGE_ASSIGNMENT_NOTICE}
            </p>
          </div>
        </div>
      </AppCard>

      <AppCard className="border border-[var(--erp-border)]">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Package Filters
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--erp-text)]">
              Narrow the Books Catalog
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Search
              </span>
              <AppSearchInput
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                onClear={() => setFilterSearch("")}
                placeholder="Package name or grade level..."
                aria-label="Search book packages"
                uiSize="sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                School Year
              </span>
              <AppSelect value={filterSchoolYear} onChange={(event) => setFilterSchoolYear(event.target.value)} uiSize="sm">
                <option value="All">All</option>
                {schoolYearOptions.map((schoolYear) => (
                  <option key={schoolYear} value={schoolYear}>
                    {schoolYear}
                  </option>
                ))}
              </AppSelect>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                School
              </span>
              <AppSelect
                value={filterSchool}
                onChange={(event) => setFilterSchool(event.target.value as "All" | "STSN" | "CDSTA")}
                uiSize="sm"
              >
                <option value="All">All</option>
                <option value="STSN">St. Theresa's School of Novaliches</option>
                <option value="CDSTA">Colegio de Sta. Teresa de Avila</option>
              </AppSelect>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Academic Unit
              </span>
              <AppSelect
                value={filterAcademicUnit}
                onChange={(event) => {
                  const value = event.target.value as AcademicUnit | "All";
                  setFilterAcademicUnit(value);
                  if (value !== "basic-ed") setFilterGradeLevel("All");
                }}
                uiSize="sm"
              >
                {ACADEMIC_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AppSelect>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Grade Level
              </span>
              <AppSelect
                value={filterGradeLevel}
                onChange={(event) => setFilterGradeLevel(event.target.value)}
                disabled={isCollegeView}
                uiSize="sm"
              >
                <option value="All">All</option>
                {BOOK_PACKAGE_GRADE_LEVELS.map((gradeLevel) => (
                  <option key={gradeLevel} value={gradeLevel}>
                    {gradeLevel}
                  </option>
                ))}
              </AppSelect>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Status
              </span>
              <AppSelect
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as "All" | BookPackage["status"])}
                disabled={isCollegeView}
                uiSize="sm"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </AppSelect>
            </label>
          </div>
        </div>
      </AppCard>

      {isCollegeView ? (
        <AppEmptyState
          icon={BookOpen}
          title="Books Setup does not apply to College"
          description={BOOKS_NOT_APPLICABLE_NOTICE}
        />
      ) : (
        <AppTable<BookPackage>
          data={filteredPackages}
          columns={packageColumns}
          title="Book Packages"
          description="Configured grade-level packages remain read and edited through the existing books setup workflow."
          enableSearch={false}
          enableColumnVisibility={false}
          initialPageSize={10}
          pageSizeOptions={[10]}
          loading={false}
          emptyMessage="No book packages match the selected filters."
          emptyDescription="Adjust the search or filters to find book packages."
          getRowId={(row) => row.id}
          toolbar={
            <span className="whitespace-nowrap text-[10px] font-mono text-[var(--erp-text-muted)]">
              {filteredPackages.length} package{filteredPackages.length !== 1 ? "s" : ""}
            </span>
          }
        />
      )}

      {displayPackage && (
        <AppModal
          open
          title={
            isCreating ? "Add Book Package" : isEditing ? "Edit Book Package" : "Book Package Details"
          }
          eyebrow="Books Setup"
          icon={Library}
          onClose={closeModal}
          maxWidthClass="max-w-5xl"
          bodyClassName="max-h-[80vh] space-y-4 overflow-auto bg-[var(--erp-surface)] p-5"
          footer={
            isEditing || isCreating ? (
              <div className="flex justify-end gap-2">
                <AppButton type="button" variant="secondary" size="sm" onClick={closeModal}>
                  Cancel
                </AppButton>
                <AppButton type="button" size="sm" onClick={saveDraft}>
                  {isCreating ? "Create Book Package" : "Save Changes"}
                </AppButton>
              </div>
            ) : (
              <div className="flex justify-end">
                <AppButton
                  type="button"
                  size="sm"
                  leftIcon={Package}
                  onClick={() => openEdit(selectedPackage as BookPackage)}
                >
                  Edit Package
                </AppButton>
              </div>
            )
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Package Name
              </span>
              {isCreating ? (
                <input
                  required
                  value={displayPackage.packageName}
                  onChange={(event) =>
                    setEditDraft({ ...displayPackage, packageName: event.target.value })
                  }
                  placeholder="e.g. Grade 5 Book Package"
                  className="w-full rounded-2xl border border-[var(--erp-border)] bg-white px-3 py-2.5 text-xs font-semibold text-[var(--erp-text)] outline-none transition focus:border-[var(--erp-brand)] focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                />
              ) : (
                <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-3 py-2.5 text-xs font-semibold text-[var(--erp-text)]">
                  {displayPackage.packageName}
                </div>
              )}
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Grade Level
              </span>
              {isCreating ? (
                <AppSelect
                  value={displayPackage.gradeLevel}
                  onChange={(event) => setEditDraft({ ...displayPackage, gradeLevel: event.target.value })}
                  uiSize="sm"
                >
                  {BOOK_PACKAGE_GRADE_LEVELS.map((gradeLevel) => (
                    <option key={gradeLevel}>{gradeLevel}</option>
                  ))}
                </AppSelect>
              ) : (
                <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-3 py-2.5 text-xs font-semibold text-[var(--erp-brand)]">
                  {displayPackage.gradeLevel}
                </div>
              )}
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                School Year
              </span>
              {isCreating ? (
                <AppSelect
                  value={displayPackage.schoolYear}
                  onChange={(event) => setEditDraft({ ...displayPackage, schoolYear: event.target.value })}
                  uiSize="sm"
                >
                  {schoolYearOptions.map((schoolYear) => (
                    <option key={schoolYear}>{schoolYear}</option>
                  ))}
                </AppSelect>
              ) : (
                <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-3 py-2.5 text-xs text-[var(--erp-text)]">
                  {displayPackage.schoolYear}
                </div>
              )}
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Total Price
              </span>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-3 py-2.5 text-xs font-mono font-bold text-[var(--erp-text)]">
                PHP {displayPackage.totalAmount.toLocaleString()}
              </div>
            </label>
          </div>

          {isCreating && (
            <label className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                School
              </span>
              <AppSelect
                value={displayPackage.schoolId}
                onChange={(event) =>
                  setEditDraft({ ...displayPackage, schoolId: event.target.value as BookPackage["schoolId"] })
                }
                uiSize="sm"
              >
                <option value="STSN">St. Theresa's School of Novaliches</option>
                <option value="CDSTA">Colegio de Sta. Teresa de Avila</option>
              </AppSelect>
            </label>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AppCard className="border border-[var(--erp-border)]">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Required / Included
              </p>
              <div className="mt-3">
                {isEditing || isCreating ? (
                  <AppButton
                    type="button"
                    variant={displayPackage.isRequired ? "secondary" : "outline"}
                    size="sm"
                    leftIcon={displayPackage.isRequired ? Check : X}
                    onClick={() => toggleDraftFlag("isRequired")}
                  >
                    {displayPackage.isRequired ? "Required / Included" : "Optional"}
                  </AppButton>
                ) : (
                  <AppStatusBadge status={displayPackage.isRequired ? "Active" : "Inactive"}>
                    {displayPackage.isRequired ? "Required / Included" : "Optional"}
                  </AppStatusBadge>
                )}
              </div>
            </AppCard>
            <AppCard className="border border-[var(--erp-border)]">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                Package Status
              </p>
              <div className="mt-3">
                {isEditing || isCreating ? (
                  <AppButton
                    type="button"
                    variant={displayPackage.status === "Active" ? "secondary" : "outline"}
                    size="sm"
                    leftIcon={displayPackage.status === "Active" ? ToggleRight : ToggleLeft}
                    onClick={() => toggleDraftFlag("status")}
                  >
                    {displayPackage.status}
                  </AppButton>
                ) : (
                  <AppStatusBadge status={displayPackage.status}>{displayPackage.status}</AppStatusBadge>
                )}
              </div>
            </AppCard>
          </div>

          <AppCard className="border border-[var(--erp-border)]" padded={false}>
            <div className="border-b border-[var(--erp-border)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                    Book List
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-[var(--erp-text)]">
                    Included Books and Pricing
                  </h4>
                </div>
                {(isEditing || isCreating) && (
                  <AppButton type="button" size="xs" variant="outline" leftIcon={Plus} onClick={addDraftBook}>
                    Add Book
                  </AppButton>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-surface-muted)]">
                    <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                      Line Total
                    </th>
                    {(isEditing || isCreating) && <th className="w-14" aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--erp-border)]">
                  {displayPackage.books.map((book: BookPackageItem) => (
                    <tr key={book.id}>
                      <td className="px-4 py-3 font-semibold text-[var(--erp-text)]">
                        {isEditing || isCreating ? (
                          <input
                            required
                            value={book.title}
                            onChange={(event) => updateDraftBook(book.id, "title", event.target.value)}
                            placeholder="Book title"
                            className="w-full min-w-40 rounded-xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-3 py-2 text-xs outline-none transition focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                          />
                        ) : (
                          book.title
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-[var(--erp-text-muted)]">
                        {isEditing || isCreating ? (
                          <AppSelect
                            value={book.subjectCode || ""}
                            onChange={(event) => updateDraftBook(book.id, "subjectCode", event.target.value)}
                            uiSize="sm"
                            className="min-w-[140px]"
                          >
                            <option value="">— General —</option>
                            {basicEdSubjects.map((subject) => (
                              <option key={subject.id} value={subject.code}>
                                {subject.code}
                              </option>
                            ))}
                          </AppSelect>
                        ) : (
                          book.subjectCode || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing || isCreating ? (
                          <input
                            type="number"
                            min={0}
                            value={book.quantity}
                            onChange={(event) =>
                              updateDraftBook(book.id, "quantity", Math.max(0, Number(event.target.value)))
                            }
                            className="w-16 rounded-xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-2 py-2 text-center text-xs outline-none transition focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                          />
                        ) : (
                          book.quantity
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--erp-text)]">
                        {isEditing || isCreating ? (
                          <input
                            type="number"
                            min={0}
                            value={book.unitPrice}
                            onChange={(event) =>
                              updateDraftBook(book.id, "unitPrice", Math.max(0, Number(event.target.value)))
                            }
                            className="w-24 rounded-xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-2 py-2 text-right text-xs outline-none transition focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                          />
                        ) : (
                          `PHP ${book.unitPrice.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[var(--erp-text)]">
                        PHP {(book.quantity * book.unitPrice).toLocaleString()}
                      </td>
                      {(isEditing || isCreating) && (
                        <td className="px-4 py-3 text-center">
                          <AppButton
                            type="button"
                            size="xs"
                            variant="danger-outline"
                            onClick={() => removeDraftBook(book.id)}
                            disabled={displayPackage.books.length === 1}
                            leftIcon={Trash2}
                          >
                            Remove
                          </AppButton>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--erp-border)] bg-[var(--erp-surface-muted)]">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]"
                    >
                      Total Price
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--erp-brand)]">
                      PHP {displayPackage.totalAmount.toLocaleString()}
                    </td>
                    {(isEditing || isCreating) && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </AppCard>

          {(isEditing || isCreating) && (
            <AppCard className="border border-blue-200 bg-blue-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <p className="text-xs leading-relaxed text-blue-800">
                  The package and its book list will continue to save through the existing Book Setup flow.
                </p>
              </div>
            </AppCard>
          )}
        </AppModal>
      )}
    </div>
  );
}
