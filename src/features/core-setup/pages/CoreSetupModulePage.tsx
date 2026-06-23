/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useSTSNStore } from "../../../services/store";
import { useAppDialog } from "../../../components/common/useAppDialog";
import { SetupItem } from "../../../types";
import {
  Settings, BookOpen, GraduationCap, Building2, Clock, Users, Coins,
  Flag, FileText, Shield, CreditCard, Workflow, Search, Plus, Edit2,
  Trash2, ChevronDown, ChevronRight, X, Check, ToggleLeft, ToggleRight,
  Calendar, MapPin, Layers, Award, Percent, BarChart3, Key, QrCode,
  AlertCircle, Globe, Heart, BookMarked, Scale, Archive, RefreshCw
} from "lucide-react";

// ============================================================
// SETUP CATEGORY CONFIGURATION
// ============================================================
interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "textarea" | "toggle";
  options?: string[];
  dataSourceKey?: string;
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2;
}

interface SetupCategoryConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  extraFields?: FieldConfig[];
}

interface SetupGroupConfig {
  groupKey: string;
  groupLabel: string;
  icon: React.ElementType;
  groupColor: string;
  categories: SetupCategoryConfig[];
}

const SETUP_GROUPS: SetupGroupConfig[] = [
  {
    groupKey: "academic",
    groupLabel: "Academic Setup",
    icon: BookOpen,
    groupColor: "text-amber-600",
    categories: [
      { key: "academic_categories", label: "Academic Categories", description: "Program categories (Preschool, Elementary, HS, College)", icon: Layers, color: "amber", extraFields: [] },
      { key: "academic_levels", label: "Academic Levels", description: "Levels of academic education", icon: GraduationCap, color: "amber", extraFields: [{ key: "category", label: "Category", type: "text", placeholder: "e.g. Senior High School" }] },
      { key: "year_levels", label: "Year Levels", description: "Specific year/grade levels per academic level", icon: Layers, color: "amber", extraFields: [{ key: "level", label: "Sort Level (num)", type: "number" }, { key: "academicLevel", label: "Academic Level", type: "text" }] },
      { key: "school_years", label: "School Years", description: "Manage academic year periods", icon: Calendar, color: "amber", extraFields: [{ key: "startDate", label: "Start Date", type: "date" }, { key: "endDate", label: "End Date", type: "date" }, { key: "isCurrent", label: "Current Year?", type: "toggle" }] },
      { key: "semesters", label: "Semesters / Terms", description: "Semester and term definitions", icon: Calendar, color: "amber", extraFields: [{ key: "semesterNumber", label: "Semester Number", type: "number" }] },
      { key: "departments", label: "Departments", description: "Academic and administrative departments", icon: Building2, color: "amber", extraFields: [] },
      { key: "holidays", label: "Holiday Maintenance", description: "Declare official holidays", icon: Calendar, color: "amber", extraFields: [{ key: "date", label: "Holiday Date", type: "date", required: true }, { key: "holidayType", label: "Holiday Type", type: "select", options: ["Regular", "Special Non-Working", "Special Working"] }] },
    ]
  },
  {
    groupKey: "admission",
    groupLabel: "Admission & Enrollment",
    icon: Users,
    groupColor: "text-blue-600",
    categories: [
      { key: "admission_types", label: "Admission Types", description: "New Student, Transferee, Returnee, etc.", icon: Users, color: "blue", extraFields: [] },
      { key: "enrollment_requirements", label: "Enrollment Requirements", description: "Documents required for enrollment", icon: FileText, color: "blue", extraFields: [{ key: "isRequired", label: "Required?", type: "toggle" }] },
      { key: "student_statuses", label: "Student Status", description: "Enrollment status options", icon: Users, color: "blue", extraFields: [] },
      { key: "student_types", label: "Student Types", description: "Regular, Irregular, Cross-enrollee, Special", icon: Users, color: "blue", extraFields: [] },
    ]
  },
  {
    groupKey: "campus",
    groupLabel: "Campus & Facilities",
    icon: Building2,
    groupColor: "text-green-600",
    categories: [
      { key: "campuses", label: "Campuses", description: "Manage school campus locations", icon: MapPin, color: "green", extraFields: [{ key: "address", label: "Address", type: "text", placeholder: "Full address", colSpan: 2 }, { key: "contactNo", label: "Contact No.", type: "text" }] },
      { key: "buildings", label: "Buildings", description: "Buildings within campuses", icon: Building2, color: "green", extraFields: [{ key: "campusId", label: "Campus", type: "text", placeholder: "Campus code or ID" }, { key: "numberOfFloors", label: "Number of Floors", type: "number" }] },
      { key: "room_types", label: "Room Types", description: "Classroom, Lab, Hall, etc.", icon: Layers, color: "green", extraFields: [{ key: "maxCapacity", label: "Max Capacity", type: "number" }] },
      { key: "rooms", label: "Rooms / Classrooms", description: "Individual room management", icon: Building2, color: "green", extraFields: [{ key: "buildingId", label: "Building", type: "text" }, { key: "capacity", label: "Capacity", type: "number" }] },
    ]
  },
  {
    groupKey: "scheduling",
    groupLabel: "Scheduling & Sectioning",
    icon: Clock,
    groupColor: "text-purple-600",
    categories: [
      { key: "time_slots", label: "Time Slots", description: "Defined class periods and durations", icon: Clock, color: "purple", extraFields: [{ key: "startTime", label: "Start Time (HH:MM)", type: "text", placeholder: "08:00" }, { key: "endTime", label: "End Time (HH:MM)", type: "text", placeholder: "10:00" }] },
    ]
  },
  {
    groupKey: "faculty",
    groupLabel: "Faculty Management",
    icon: Users,
    groupColor: "text-indigo-600",
    categories: [
      { key: "faculty_ranks", label: "Faculty Ranks", description: "Instructor I, Professor, etc.", icon: Award, color: "indigo", extraFields: [{ key: "level", label: "Rank Level (num)", type: "number" }] },
      { key: "employment_types", label: "Employment Types", description: "Full-Time, Part-Time, Contractual", icon: Users, color: "indigo", extraFields: [{ key: "isFullTime", label: "Is Full-Time?", type: "toggle" }] },
    ]
  },
  {
    groupKey: "accounting",
    groupLabel: "Accounting Setup",
    icon: Coins,
    groupColor: "text-emerald-600",
    categories: [
      { key: "fee_categories", label: "Fee Categories", description: "Tuition, Miscellaneous, Lab, etc.", icon: Coins, color: "emerald", extraFields: [] },
      { key: "fee_items", label: "Fee Items", description: "Specific fee line items with amounts", icon: Coins, color: "emerald", extraFields: [{ key: "categoryId", label: "Category", type: "select", dataSourceKey: "fee_categories" }, { key: "amount", label: "Amount (PHP)", type: "number" }, { key: "yearLevel", label: "Year Level", type: "select", dataSourceKey: "year_levels" }] },
      { key: "payment_terms", label: "Payment Terms", description: "Cash, Installment options", icon: CreditCard, color: "emerald", extraFields: [{ key: "numberOfInstallments", label: "No. of Installments", type: "number" }, { key: "downpaymentPercent", label: "Down Payment %", type: "number" }] },
      { key: "payment_methods", label: "Payment Methods", description: "Cash, GCash, Bank Transfer, etc.", icon: CreditCard, color: "emerald", extraFields: [{ key: "type", label: "Method Type", type: "select", options: ["Cash", "Digital", "Bank", "Card"] }] },
      { key: "chart_of_accounts", label: "Chart of Accounts", description: "Account codes for financial reporting", icon: BarChart3, color: "emerald", extraFields: [{ key: "accountNo", label: "Account No.", type: "text", required: true }, { key: "accountType", label: "Account Type", type: "select", options: ["Asset", "Liability", "Equity", "Revenue", "Expense"] }] },
      { key: "accounting_periods", label: "Accounting Periods", description: "Fiscal and academic period definitions", icon: Calendar, color: "emerald", extraFields: [{ key: "startDate", label: "Period Start", type: "date" }, { key: "endDate", label: "Period End", type: "date" }, { key: "isClosed", label: "Closed?", type: "toggle" }] },
      { key: "or_series", label: "Official Receipt Series", description: "OR numbering configuration", icon: FileText, color: "emerald", extraFields: [{ key: "prefix", label: "OR Prefix", type: "text" }, { key: "currentSerial", label: "Current Serial", type: "number" }, { key: "year", label: "Year", type: "number" }] },
      { key: "collection_types", label: "Collection Types", description: "Tuition, Misc, Penalty, Refund", icon: Coins, color: "emerald", extraFields: [] },
      { key: "refund_reasons", label: "Refund Reasons", description: "Valid reasons for student refunds", icon: RefreshCw, color: "emerald", extraFields: [] },
      { key: "void_reasons", label: "Void Reasons", description: "Reasons for voiding receipts", icon: X, color: "emerald", extraFields: [] },
    ]
  },
  {
    groupKey: "student_refs",
    groupLabel: "Student Profile References",
    icon: Flag,
    groupColor: "text-red-500",
    categories: [
      { key: "nationalities", label: "Nationalities", description: "Filipino, Chinese, Korean, etc.", icon: Globe, color: "rose", extraFields: [] },
      { key: "civil_statuses", label: "Civil Statuses", description: "Single, Married, Widowed, etc.", icon: Heart, color: "rose", extraFields: [] },
      { key: "religions", label: "Religions", description: "Catholic, Protestant, Islam, etc.", icon: BookMarked, color: "rose", extraFields: [] },
    ]
  },
  {
    groupKey: "grading",
    groupLabel: "Grading & Academic Rules",
    icon: Scale,
    groupColor: "text-teal-600",
    categories: [
      { key: "grade_scales", label: "Grade Scale", description: "Numeric grade equivalent and remarks", icon: Scale, color: "teal", extraFields: [{ key: "minGrade", label: "Min Grade", type: "number" }, { key: "maxGrade", label: "Max Grade", type: "number" }, { key: "equivalent", label: "Grade Equivalent", type: "text" }, { key: "remarks", label: "Remarks", type: "text" }] },
    ]
  },
  {
    groupKey: "documents",
    groupLabel: "Document Management",
    icon: Archive,
    groupColor: "text-orange-600",
    categories: [
      { key: "document_types", label: "Document Types", description: "TOR, Diploma, Certificate, etc.", icon: FileText, color: "orange", extraFields: [{ key: "isRequired", label: "Required?", type: "toggle" }] },
    ]
  },
  {
    groupKey: "access_control",
    groupLabel: "Access Control & Security",
    icon: Shield,
    groupColor: "text-slate-600",
    categories: [
      { key: "roles_setup", label: "Roles", description: "System roles and access levels", icon: Shield, color: "slate", extraFields: [{ key: "level", label: "Access Level (1-10)", type: "number" }] },
      { key: "permissions_setup", label: "Permissions", description: "Module-level permission definitions", icon: Key, color: "slate", extraFields: [{ key: "module", label: "Module", type: "text" }] },
    ]
  },
  {
    groupKey: "id_cards",
    groupLabel: "ID Card Management",
    icon: CreditCard,
    groupColor: "text-pink-600",
    categories: [
      { key: "id_card_templates", label: "ID Card Templates", description: "ID card design templates", icon: CreditCard, color: "pink", extraFields: [{ key: "campus", label: "Campus", type: "text" }, { key: "cardColor", label: "Card Color (hex)", type: "text" }] },
    ]
  },
  {
    groupKey: "workflows",
    groupLabel: "Workflow Configuration",
    icon: Workflow,
    groupColor: "text-cyan-600",
    categories: [
      { key: "enrollment_workflows", label: "Enrollment Approval Workflow", description: "Step configuration for enrollment approvals", icon: Workflow, color: "cyan", extraFields: [] },
      { key: "clearance_workflows", label: "Clearance Workflow", description: "Department clearance step configuration", icon: Workflow, color: "cyan", extraFields: [] },
    ]
  },
];

// Flatten all categories for easy lookup
const ALL_CATEGORIES = SETUP_GROUPS.flatMap((g) => g.categories.map((c) => ({ ...c, groupKey: g.groupKey, groupLabel: g.groupLabel })));

// ============================================================
// GENERIC CRUD TABLE COMPONENT
// ============================================================
interface GenericSetupTableProps {
  categoryKey: string;
  config: SetupCategoryConfig & { groupKey?: string; groupLabel?: string };
}

function GenericSetupTable({ categoryKey, config }: GenericSetupTableProps) {
  const { setupData, addSetupItem, updateSetupItem, deleteSetupItem, toggleSetupItemActive, currentUser } = useSTSNStore();
  const { confirm } = useAppDialog();
  const items = setupData[categoryKey] || [];

  const [searchQ, setSearchQ] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetupItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset state when switching categories
  useEffect(() => {
    setSearchQ("");
    setCurrentPage(1);
    setIsFormOpen(false);
    setEditingItem(null);
  }, [categoryKey]);

  const baseFormState = { code: "", name: "", description: "", ...(config.extraFields?.reduce((acc, f) => ({ ...acc, [f.key]: f.type === "toggle" ? false : f.type === "number" ? 0 : "" }), {}) || {}) };
  const [formData, setFormData] = useState<Record<string, any>>(baseFormState);

  const filteredItems = useMemo(() =>
    items.filter((item) => {
      const q = searchQ.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
    }),
    [items, searchQ]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditingItem(null);
    setFormData(baseFormState);
    setIsFormOpen(true);
  };

  const openEdit = (item: SetupItem) => {
    setEditingItem(item);
    const data: Record<string, any> = { code: item.code, name: item.name, description: item.description || "" };
    config.extraFields?.forEach((f) => { data[f.key] = item[f.key] ?? (f.type === "toggle" ? false : f.type === "number" ? 0 : ""); });
    setFormData(data);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<SetupItem, "id" | "createdAt"> = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      isActive: editingItem ? editingItem.isActive : true,
      ...config.extraFields?.reduce((acc, f) => ({ ...acc, [f.key]: formData[f.key] }), {})
    };
    if (editingItem) {
      updateSetupItem(categoryKey, editingItem.id, payload);
    } else {
      addSetupItem(categoryKey, payload);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (await confirm(`Delete "${name}"? This action cannot be undone.`, { variant: "danger" })) {
      deleteSetupItem(categoryKey, id);
    }
  };

  const colorMap: Record<string, string> = {
    amber: "from-amber-600 to-amber-500", blue: "from-blue-600 to-blue-500", green: "from-green-600 to-green-500",
    purple: "from-purple-600 to-purple-500", indigo: "from-indigo-600 to-indigo-500", emerald: "from-emerald-700 to-emerald-600",
    rose: "from-rose-600 to-rose-500", teal: "from-teal-600 to-teal-500", orange: "from-orange-600 to-orange-500",
    slate: "from-slate-600 to-slate-500", pink: "from-pink-600 to-pink-500", cyan: "from-cyan-600 to-cyan-500",
  };

  const Icon = config.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorMap[config.color] || "from-stsn-brown to-stsn-brown-dark"} text-white p-4 rounded-xl shadow-md flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base">{config.label}</h3>
            <p className="text-[11px] opacity-80">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono opacity-80">
          <span className="bg-white/20 px-2 py-1 rounded">{items.filter((i) => i.isActive).length} active</span>
          <span className="bg-white/10 px-2 py-1 rounded">{items.length} total</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-col sm:flex-row justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder={`Search ${config.label.toLowerCase()}...`}
            value={searchQ}
            onChange={(e) => { setSearchQ(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream text-xs font-bold px-4 py-2 rounded-lg shadow cursor-pointer transition"
        >
          <Plus className="w-4 h-4" /> Add {config.label.replace(/s$/, "")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left py-2.5 px-4 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-24">Code</th>
                <th className="text-left py-2.5 px-4 font-bold text-stone-500 uppercase tracking-wider text-[10px]">Name</th>
                {config.extraFields && config.extraFields.slice(0, 2).map((f) => (
                  <th key={f.key} className="text-left py-2.5 px-4 font-bold text-stone-500 uppercase tracking-wider text-[10px] hidden md:table-cell">{f.label}</th>
                ))}
                <th className="text-left py-2.5 px-4 font-bold text-stone-500 uppercase tracking-wider text-[10px] hidden lg:table-cell">Description</th>
                <th className="text-center py-2.5 px-4 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-24">Status</th>
                <th className="text-center py-2.5 px-4 font-bold text-stone-500 uppercase tracking-wider text-[10px] w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pagedItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-stsn-brown text-[11px]">{item.code}</td>
                  <td className="py-3 px-4 font-semibold text-stone-800">{item.name}</td>
                  {config.extraFields && config.extraFields.slice(0, 2).map((f) => (
                    <td key={f.key} className="py-3 px-4 text-stone-600 hidden md:table-cell">
                      {f.type === "toggle"
                        ? <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item[f.key] ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-stone-500 bg-stone-50 border-stone-200"}`}>{item[f.key] ? "Yes" : "No"}</span>
                        : f.type === "number" ? (item[f.key] || 0).toLocaleString()
                        : f.dataSourceKey
                          ? (setupData[f.dataSourceKey] ?? []).find((c) => c.code === String(item[f.key] || ""))?.name ?? String(item[f.key] || "—")
                          : String(item[f.key] || "—")}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-stone-500 text-[11px] hidden lg:table-cell max-w-xs truncate">{item.description || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleSetupItemActive(categoryKey, item.id)}
                      title="Toggle Active/Inactive"
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition ${item.isActive ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" : "text-stone-500 bg-stone-50 border-stone-200 hover:bg-stone-100"}`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 rounded text-stone-400 hover:text-blue-600 cursor-pointer transition" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 cursor-pointer transition" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedItems.length === 0 && (
                <tr>
                  <td colSpan={6 + Math.min(2, config.extraFields?.length || 0)} className="py-12 text-center text-xs text-stone-400">
                    <Settings className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                    {searchQ ? `No results for "${searchQ}"` : `No ${config.label.toLowerCase()} configured yet. Click "Add" to create the first entry.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2.5 py-1 rounded border border-stone-200 text-stone-600 disabled:opacity-40 cursor-pointer hover:bg-stone-50">‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - currentPage) <= 2).map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 py-1 rounded border text-xs font-bold cursor-pointer ${p === currentPage ? "bg-stsn-brown text-white border-stsn-brown" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2.5 py-1 rounded border border-stone-200 text-stone-600 disabled:opacity-40 cursor-pointer hover:bg-stone-50">Next ›</button>
            </div>
          </div>
        )}
      </div>

      {/* Audit info footer */}
      <p className="text-[10px] text-stone-400 font-mono">Last updated by: {items[0]?.createdBy || "System"} • {items.length} record{items.length !== 1 ? "s" : ""} total</p>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${colorMap[config.color] || "from-stsn-brown to-stsn-brown-dark"} text-white p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <h3 className="font-display font-bold text-sm">{editingItem ? `Edit ${config.label}` : `New ${config.label}`}</h3>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="cursor-pointer hover:bg-white/20 rounded p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-stsn-cream space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Base fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Code *</label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    placeholder="Unique code"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                    placeholder="Display name"
                  />
                </div>
              </div>

              {/* Extra fields from config */}
              {config.extraFields && config.extraFields.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {config.extraFields.map((field) => (
                    <div key={field.key} className={field.colSpan === 2 ? "col-span-2" : ""}>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        {field.label}{field.required && " *"}
                      </label>
                      {field.type === "select" && (
                        <select
                          required={field.required}
                          value={String(formData[field.key] || "")}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                        >
                          <option value="">— Select —</option>
                          {field.dataSourceKey
                            ? (setupData[field.dataSourceKey] ?? []).filter((i) => i.isActive).map((i) => <option key={i.code} value={i.code}>{i.name}</option>)
                            : field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {field.type === "toggle" && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, [field.key]: !formData[field.key] })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${formData[field.key] ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-stone-50 border-stone-200 text-stone-500"}`}
                        >
                          {formData[field.key] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          {formData[field.key] ? "Yes" : "No"}
                        </button>
                      )}
                      {field.type === "textarea" && (
                        <textarea
                          required={field.required}
                          value={String(formData[field.key] || "")}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          rows={3}
                          className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-brown resize-none"
                          placeholder={field.placeholder}
                        />
                      )}
                      {(field.type === "text" || field.type === "date" || field.type === "number") && (
                        <input
                          required={field.required}
                          type={field.type}
                          value={String(formData[field.key] ?? "")}
                          onChange={(e) => setFormData({ ...formData, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stsn-brown"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Description <span className="normal-case text-stone-400">(optional)</span></label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-stsn-brown resize-none"
                  placeholder="Optional description or notes"
                />
              </div>

              {/* Validation notice */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-600">This record will be logged in the system audit trail with your credentials as the author.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-stsn-brown hover:bg-stsn-brown-dark text-stsn-cream font-bold text-xs py-2.5 rounded-lg shadow cursor-pointer transition"
              >
                {editingItem ? "Save Changes" : `Create ${config.label}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN CORE SETUP MODULE
// ============================================================
export default function CoreSetupModule() {
  const { setupData } = useSTSNStore();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("academic_categories");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    SETUP_GROUPS.reduce((acc, g) => ({ ...acc, [g.groupKey]: g.groupKey === "academic" }), {})
  );
  const [globalSearch, setGlobalSearch] = useState("");

  const toggleGroup = (key: string) => setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectedConfig = ALL_CATEGORIES.find((c) => c.key === selectedCategoryKey);

  const filteredGroups = useMemo(() => {
    if (!globalSearch) return SETUP_GROUPS;
    const q = globalSearch.toLowerCase();
    return SETUP_GROUPS.map((g) => ({
      ...g,
      categories: g.categories.filter((c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    })).filter((g) => g.categories.length > 0);
  }, [globalSearch, SETUP_GROUPS]);

  const totalSetupItems = useMemo(() => Object.values(setupData).reduce((s, arr) => s + arr.length, 0), [setupData]);

  return (
    <div className="animate-fade-in font-sans space-y-4">
      {/* Module Header */}
      <div className="p-5 bg-white border border-stsn-beige rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-stsn-brown" />
              Core System Setup
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Centralized maintenance for all system configuration. Every change is audit-logged.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-stsn-cream border border-stsn-beige rounded-lg px-3 py-2">
              <span className="font-mono font-bold text-stsn-brown">{totalSetupItems}</span>
              <span className="text-stone-500 ml-1">total records</span>
            </div>
            <div className="bg-stsn-cream border border-stsn-beige rounded-lg px-3 py-2">
              <span className="font-mono font-bold text-stsn-brown">{SETUP_GROUPS.length}</span>
              <span className="text-stone-500 ml-1">categories</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 flex-shrink-0 bg-white rounded-xl border border-stsn-beige shadow-sm overflow-hidden sticky top-0 max-h-[calc(100vh-240px)] flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search setup pages..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg py-1.5 pl-7 pr-3 text-xs focus:ring-1 focus:ring-stsn-brown focus:outline-none"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups[group.groupKey];
              return (
                <div key={group.groupKey}>
                  <button
                    onClick={() => toggleGroup(group.groupKey)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <GroupIcon className={`w-4 h-4 ${group.groupColor}`} />
                      <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">{group.groupLabel}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" /> : <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                  </button>

                  {isExpanded && (
                    <div className="pb-1">
                      {group.categories.map((cat) => {
                        const CatIcon = cat.icon;
                        const count = (setupData[cat.key] || []).length;
                        const isSelected = selectedCategoryKey === cat.key;
                        return (
                          <button
                            key={cat.key}
                            onClick={() => setSelectedCategoryKey(cat.key)}
                            className={`w-full text-left px-4 py-2 flex items-center justify-between cursor-pointer transition group ${
                              isSelected ? "sidebar-item-active text-stsn-cream" : "hover:bg-stone-50 text-stone-600"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CatIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-stsn-gold" : "text-stone-400 group-hover:text-stone-600"}`} />
                              <span className="text-[11px] font-medium truncate">{cat.label}</span>
                            </div>
                            <span className={`text-[9px] font-mono font-bold ml-1 flex-shrink-0 ${isSelected ? "text-stsn-gold-light" : "text-stone-400"}`}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {selectedConfig ? (
            <GenericSetupTable
              categoryKey={selectedCategoryKey}
              config={selectedConfig}
            />
          ) : (
            <div className="bg-white rounded-xl border border-stsn-beige shadow-sm p-16 text-center">
              <Settings className="w-12 h-12 text-stone-200 mx-auto mb-3" />
              <p className="text-sm text-stone-400">Select a setup category from the sidebar to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
