/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Library, BookOpen, AlertCircle, Eye, ToggleLeft, ToggleRight, X, Check, GraduationCap, Package, Coins,
} from "lucide-react";
import { useSTSNStore } from "../../../services/store";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";
import STSNDataTable, { type STSNColumn } from "../../../components/common/STSNDataTable";
import type { BookPackage, BookPackageItem } from "../../../types";
import type { AcademicUnit } from "../../../types/school.types";
import {
  BOOK_PACKAGE_GRADE_LEVELS,
  BOOK_PACKAGE_STATUS_BADGE,
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
  const { academicUnit, activeSchool, bookPackages: packages, updateBookPackage, setupData } = useSTSNStore();

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

  // ---- Detail / Edit modal ----
  const [selectedPackage, setSelectedPackage] = useState<BookPackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<BookPackage | null>(null);

  const isCollegeView = filterAcademicUnit === "college";

  const filteredPackages = useMemo(() => {
    if (isCollegeView) return [];
    return packages.filter((p) => {
      const matchYear = filterSchoolYear === "All" || p.schoolYear === filterSchoolYear;
      const matchSchool = filterSchool === "All" || p.schoolId === filterSchool;
      const matchUnit = filterAcademicUnit === "All" || p.academicUnit === filterAcademicUnit;
      const matchGrade = filterGradeLevel === "All" || p.gradeLevel === filterGradeLevel;
      const matchStatus = filterStatus === "All" || p.status === filterStatus;
      return matchYear && matchSchool && matchUnit && matchGrade && matchStatus;
    });
  }, [packages, filterSchoolYear, filterSchool, filterAcademicUnit, filterGradeLevel, filterStatus, isCollegeView]);

  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.status === "Active").length;
  const gradeLevelsCovered = new Set(packages.map((p) => p.gradeLevel)).size;
  const totalCatalogValue = packages.reduce((sum, p) => sum + p.totalAmount, 0);

  const openView = (pkg: BookPackage) => {
    setSelectedPackage(pkg);
    setIsEditing(false);
    setEditDraft(null);
  };

  const openEdit = (pkg: BookPackage) => {
    setSelectedPackage(pkg);
    setIsEditing(true);
    setEditDraft({ ...pkg, books: pkg.books.map((b) => ({ ...b })) });
  };

  const closeModal = () => {
    setSelectedPackage(null);
    setIsEditing(false);
    setEditDraft(null);
  };

  const updateDraftBook = (bookId: string, field: "quantity" | "unitPrice", value: number) => {
    if (!editDraft) return;
    const books = editDraft.books.map((b) => (b.id === bookId ? { ...b, [field]: value } : b));
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

  const saveEdit = () => {
    if (!editDraft) return;
    const today = new Date().toISOString().slice(0, 10);
    updateBookPackage(editDraft.id, { ...editDraft, lastUpdated: today });
    closeModal();
  };

  const quickToggleStatus = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;
    updateBookPackage(pkgId, { status: pkg.status === "Active" ? "Inactive" : "Active", lastUpdated: new Date().toISOString().slice(0, 10) });
  };

  const displayPackage = isEditing ? editDraft : selectedPackage;

  const packageColumns: STSNColumn<BookPackage>[] = [
    { title: "Grade Level", data: "gradeLevel", className: "font-bold text-stsn-brown" },
    { title: "Package Name", data: "packageName", className: "font-semibold text-stone-800" },
    {
      title: "Included Books",
      data: "books",
      className: "text-center text-stone-600",
      render: (value: BookPackageItem[]) => value.length,
    },
    {
      title: "Total Amount",
      data: "totalAmount",
      className: "text-right font-mono font-bold text-stone-800",
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      title: "Status",
      data: "status",
      className: "text-center",
      render: (value: BookPackage["status"]) => {
        const badge = BOOK_PACKAGE_STATUS_BADGE[value];
        return <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${badge.badgeClass}`}>{badge.label}</span>;
      },
    },
    { title: "Effective SY", data: "schoolYear", className: "text-stone-600" },
    { title: "Last Updated", data: "lastUpdated", className: "text-stone-500 text-[11px]" },
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

  return (
    <div className="animate-fade-in font-sans space-y-4">
      <PageHeader
        icon={Library}
        title="Books Setup"
        description="Configure required book packages by Basic Education grade level."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Packages" value={totalPackages} icon={Library} color="from-stsn-brown to-stsn-brown-dark" textColor="text-stsn-cream" />
        <StatCard label="Active Packages" value={activePackages} icon={ToggleRight} color="from-emerald-700 to-emerald-600" textColor="text-emerald-50" />
        <StatCard label="Grade Levels Covered" value={gradeLevelsCovered} icon={GraduationCap} color="from-amber-600 to-amber-500" textColor="text-amber-50" />
        <StatCard label="Total Catalog Value" value={`₱${totalCatalogValue.toLocaleString()}`} icon={Coins} color="from-teal-700 to-teal-600" textColor="text-teal-50" />
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
        <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden p-4">
          <STSNDataTable<BookPackage>
            columns={packageColumns}
            rows={filteredPackages}
            emptyMessage="No book packages match the selected filters."
          />
        </div>
      )}

      {/* Detail / Edit Modal */}
      {displayPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-stsn-brown to-stsn-brown-dark text-white p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5" />
                <h3 className="font-display font-bold text-sm">
                  {isEditing ? "Edit Book Package" : "Book Package Details"}
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
                  <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-800">{displayPackage.packageName}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Grade Level</label>
                  <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stsn-brown">{displayPackage.gradeLevel}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">School Year</label>
                  <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold text-stone-800">{displayPackage.schoolYear}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Total Price</label>
                  <p className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-stone-800">₱{displayPackage.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Required / Active toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Required / Included</label>
                  {isEditing ? (
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
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => toggleDraftFlag("status")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${displayPackage.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}
                    >
                      {displayPackage.status === "Active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {displayPackage.status}
                    </button>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold ${BOOK_PACKAGE_STATUS_BADGE[displayPackage.status].badgeClass}`}>
                      {displayPackage.status === "Active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {displayPackage.status}
                    </span>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {displayPackage.books.map((book: BookPackageItem) => (
                        <tr key={book.id}>
                          <td className="py-2 px-3 font-semibold text-stone-800">{book.title}</td>
                          <td className="py-2 px-3 text-stone-500 font-mono text-[10px]">{book.subjectCode || "—"}</td>
                          <td className="py-2 px-3 text-center">
                            {isEditing ? (
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
                            {isEditing ? (
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
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-stone-50 border-t border-stone-200">
                        <td colSpan={4} className="py-2 px-3 text-right font-bold text-stone-600 uppercase text-[10px]">Total Price</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-stsn-brown">₱{displayPackage.totalAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-600">Changes are applied to this prototype session only and are not sent to any backend.</p>
                </div>
              )}

              {isEditing ? (
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
                    onClick={saveEdit}
                    className="flex-1 bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition"
                  >
                    Save Changes
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
