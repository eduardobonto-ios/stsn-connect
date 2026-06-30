/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Award,
  BarChart3,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Flag,
  Globe,
  GraduationCap,
  Heart,
  Key,
  Layers,
  Library,
  MapPin,
  Percent,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  Workflow,
  X,
} from "lucide-react";
import AppButton from "../../../components/common/AppButton";
import AppCard from "../../../components/common/AppCard";
import AppEmptyState from "../../../components/common/AppEmptyState";
import AppFormField from "../../../components/common/AppFormField";
import AppInput from "../../../components/common/AppInput";
import AppModal from "../../../components/common/AppModal";
import AppSearchInput from "../../../components/common/AppSearchInput";
import AppSelect from "../../../components/common/AppSelect";
import AppStatusBadge from "../../../components/common/AppStatusBadge";
import AppTable, { type AppTableColumn } from "../../../components/common/AppTable";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import { useAppDialog } from "../../../components/common/useAppDialog";
import BooksSetupPage from "../../books/pages/BooksSetupPage";
import { useSTSNStore } from "../../../services/store";
import { SetupItem } from "../../../types";

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
  customPage?: "books_setup";
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
    groupKey: "access_control",
    groupLabel: "Access Control & Security",
    icon: Shield,
    groupColor: "text-slate-600",
    categories: [
      {
        key: "permissions_setup",
        label: "Permissions",
        description: "Module-level permission definitions",
        icon: Key,
        color: "slate",
        extraFields: [{ key: "module", label: "Module", type: "text" }],
      },
      {
        key: "roles_setup",
        label: "Roles",
        description: "System roles and access levels",
        icon: Shield,
        color: "slate",
        extraFields: [{ key: "level", label: "Access Level (1-10)", type: "number" }],
      },
    ],
  },
  {
    groupKey: "academic",
    groupLabel: "Academic Setup",
    icon: BookOpen,
    groupColor: "text-amber-600",
    categories: [
      {
        key: "academic_categories",
        label: "Academic Categories",
        description: "Program categories (Preschool, Elementary, HS, College)",
        icon: Layers,
        color: "amber",
        extraFields: [],
      },
      {
        key: "academic_levels",
        label: "Academic Levels",
        description: "Levels of academic education",
        icon: GraduationCap,
        color: "amber",
        extraFields: [{ key: "category", label: "Category", type: "text", placeholder: "e.g. Senior High School" }],
      },
      {
        key: "departments",
        label: "Departments",
        description: "Academic and administrative departments",
        icon: Building2,
        color: "amber",
        extraFields: [],
      },
      {
        key: "holidays",
        label: "Holiday Maintenance",
        description: "Declare official holidays",
        icon: Calendar,
        color: "amber",
        extraFields: [
          { key: "date", label: "Holiday Date", type: "date", required: true },
          {
            key: "holidayType",
            label: "Holiday Type",
            type: "select",
            options: ["Regular", "Special Non-Working", "Special Working"],
          },
        ],
      },
      {
        key: "school_years",
        label: "School Years",
        description: "Manage academic year periods",
        icon: Calendar,
        color: "amber",
        extraFields: [
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "isCurrent", label: "Current Year?", type: "toggle" },
        ],
      },
      {
        key: "semesters",
        label: "Semesters / Terms",
        description: "Semester and term definitions",
        icon: Calendar,
        color: "amber",
        extraFields: [{ key: "semesterNumber", label: "Semester Number", type: "number" }],
      },
      {
        key: "year_levels",
        label: "Year Levels",
        description: "Specific year/grade levels per academic level",
        icon: Layers,
        color: "amber",
        extraFields: [
          { key: "level", label: "Sort Level (num)", type: "number" },
          { key: "academicLevel", label: "Academic Level", type: "text" },
        ],
      },
    ],
  },
  {
    groupKey: "accounting",
    groupLabel: "Accounting Setup",
    icon: Coins,
    groupColor: "text-emerald-600",
    categories: [
      {
        key: "accounting_periods",
        label: "Accounting Periods",
        description: "Fiscal and academic period definitions",
        icon: Calendar,
        color: "emerald",
        extraFields: [
          { key: "startDate", label: "Period Start", type: "date" },
          { key: "endDate", label: "Period End", type: "date" },
          { key: "isClosed", label: "Closed?", type: "toggle" },
        ],
      },
      {
        key: "chart_of_accounts",
        label: "Chart of Accounts",
        description: "Account codes for financial reporting",
        icon: BarChart3,
        color: "emerald",
        extraFields: [
          { key: "accountNo", label: "Account No.", type: "text", required: true },
          {
            key: "accountType",
            label: "Account Type",
            type: "select",
            options: ["Asset", "Liability", "Equity", "Revenue", "Expense"],
          },
        ],
      },
      {
        key: "collection_types",
        label: "Collection Types",
        description: "Tuition, Misc, Penalty, Refund",
        icon: Coins,
        color: "emerald",
        extraFields: [],
      },
      {
        key: "fee_categories",
        label: "Fee Categories",
        description: "Tuition, Miscellaneous, Lab, etc.",
        icon: Coins,
        color: "emerald",
        extraFields: [],
      },
      {
        key: "fee_items",
        label: "Fee Items",
        description: "Specific fee line items with amounts",
        icon: Coins,
        color: "emerald",
        extraFields: [
          { key: "categoryId", label: "Category", type: "select", dataSourceKey: "fee_categories" },
          { key: "amount", label: "Amount (PHP)", type: "number" },
          { key: "yearLevel", label: "Year Level", type: "select", dataSourceKey: "year_levels" },
        ],
      },
      {
        key: "or_series",
        label: "Official Receipt Series",
        description: "OR numbering configuration",
        icon: FileText,
        color: "emerald",
        extraFields: [
          { key: "prefix", label: "OR Prefix", type: "text" },
          { key: "currentSerial", label: "Current Serial", type: "number" },
          { key: "year", label: "Year", type: "number" },
        ],
      },
      {
        key: "payment_methods",
        label: "Payment Methods",
        description: "Cash, GCash, Bank Transfer, etc.",
        icon: CreditCard,
        color: "emerald",
        extraFields: [{ key: "type", label: "Method Type", type: "select", options: ["Cash", "Digital", "Bank", "Card"] }],
      },
      {
        key: "payment_remittance_terms",
        label: "Payment Remittance Terms",
        description: "Cashier collection term or purpose labels",
        icon: CreditCard,
        color: "emerald",
        extraFields: [],
      },
      {
        key: "payment_terms",
        label: "Payment Terms",
        description: "Cash, Installment options",
        icon: CreditCard,
        color: "emerald",
        extraFields: [
          { key: "numberOfInstallments", label: "No. of Installments", type: "number" },
          { key: "downpaymentPercent", label: "Down Payment %", type: "number" },
        ],
      },
      {
        key: "refund_reasons",
        label: "Refund Reasons",
        description: "Valid reasons for student refunds",
        icon: RefreshCw,
        color: "emerald",
        extraFields: [],
      },
      {
        key: "void_reasons",
        label: "Void Reasons",
        description: "Reasons for voiding receipts",
        icon: X,
        color: "emerald",
        extraFields: [],
      },
    ],
  },
  {
    groupKey: "admission",
    groupLabel: "Admission & Enrollment",
    icon: Users,
    groupColor: "text-blue-600",
    categories: [
      { key: "admission_types", label: "Admission Types", description: "New Student, Transferee, Returnee, etc.", icon: Users, color: "blue", extraFields: [] },
      {
        key: "enrollment_requirements",
        label: "Enrollment Requirements",
        description: "Documents required for enrollment",
        icon: FileText,
        color: "blue",
        extraFields: [{ key: "isRequired", label: "Required?", type: "toggle" }],
      },
      { key: "student_statuses", label: "Student Status", description: "Enrollment status options", icon: Users, color: "blue", extraFields: [] },
      { key: "student_types", label: "Student Types", description: "Regular, Irregular, Cross-enrollee, Special", icon: Users, color: "blue", extraFields: [] },
    ],
  },
  {
    groupKey: "campus",
    groupLabel: "Campus & Facilities",
    icon: Building2,
    groupColor: "text-green-600",
    categories: [
      {
        key: "buildings",
        label: "Buildings",
        description: "Buildings within campuses",
        icon: Building2,
        color: "green",
        extraFields: [
          { key: "campusId", label: "Campus", type: "text", placeholder: "Campus code or ID" },
          { key: "numberOfFloors", label: "Number of Floors", type: "number" },
        ],
      },
      {
        key: "campuses",
        label: "Campuses",
        description: "Manage school campus locations",
        icon: MapPin,
        color: "green",
        extraFields: [
          { key: "address", label: "Address", type: "text", placeholder: "Full address", colSpan: 2 },
          { key: "contactNo", label: "Contact No.", type: "text" },
        ],
      },
      {
        key: "room_types",
        label: "Room Types",
        description: "Classroom, Lab, Hall, etc.",
        icon: Layers,
        color: "green",
        extraFields: [{ key: "maxCapacity", label: "Max Capacity", type: "number" }],
      },
      {
        key: "rooms",
        label: "Rooms / Classrooms",
        description: "Individual room management",
        icon: Building2,
        color: "green",
        extraFields: [
          { key: "buildingId", label: "Building", type: "text" },
          { key: "capacity", label: "Capacity", type: "number" },
        ],
      },
    ],
  },
  {
    groupKey: "documents",
    groupLabel: "Document Management",
    icon: Archive,
    groupColor: "text-orange-600",
    categories: [
      {
        key: "document_types",
        label: "Document Types",
        description: "TOR, Diploma, Certificate, etc.",
        icon: FileText,
        color: "orange",
        extraFields: [{ key: "isRequired", label: "Required?", type: "toggle" }],
      },
    ],
  },
  {
    groupKey: "faculty",
    groupLabel: "Faculty Management",
    icon: Users,
    groupColor: "text-indigo-600",
    categories: [
      {
        key: "employment_types",
        label: "Employment Types",
        description: "Full-Time, Part-Time, Contractual",
        icon: Users,
        color: "indigo",
        extraFields: [{ key: "isFullTime", label: "Is Full-Time?", type: "toggle" }],
      },
      {
        key: "faculty_ranks",
        label: "Faculty Ranks",
        description: "Instructor I, Professor, etc.",
        icon: Award,
        color: "indigo",
        extraFields: [{ key: "level", label: "Rank Level (num)", type: "number" }],
      },
    ],
  },
  {
    groupKey: "id_cards",
    groupLabel: "ID Card Management",
    icon: CreditCard,
    groupColor: "text-pink-600",
    categories: [
      {
        key: "id_card_templates",
        label: "ID Card Templates",
        description: "ID card design templates",
        icon: CreditCard,
        color: "pink",
        extraFields: [
          { key: "campus", label: "Campus", type: "text" },
          { key: "cardColor", label: "Card Color (hex)", type: "text" },
        ],
      },
    ],
  },
  {
    groupKey: "library",
    groupLabel: "Library",
    icon: Library,
    groupColor: "text-violet-600",
    categories: [
      {
        key: "books_setup",
        label: "Book Setup",
        description: "Configure book packages by grade level",
        icon: Library,
        color: "violet",
        customPage: "books_setup",
        extraFields: [],
      },
    ],
  },
  {
    groupKey: "scheduling",
    groupLabel: "Scheduling & Sectioning",
    icon: Clock,
    groupColor: "text-purple-600",
    categories: [
      {
        key: "time_slots",
        label: "Time Slots",
        description: "Defined class periods and durations",
        icon: Clock,
        color: "purple",
        extraFields: [
          { key: "startTime", label: "Start Time (HH:MM)", type: "text", placeholder: "08:00" },
          { key: "endTime", label: "End Time (HH:MM)", type: "text", placeholder: "10:00" },
        ],
      },
    ],
  },
  {
    groupKey: "student_refs",
    groupLabel: "Student Profile References",
    icon: Flag,
    groupColor: "text-red-500",
    categories: [
      { key: "civil_statuses", label: "Civil Statuses", description: "Single, Married, Widowed, etc.", icon: Heart, color: "rose", extraFields: [] },
      { key: "nationalities", label: "Nationalities", description: "Filipino, Chinese, Korean, etc.", icon: Globe, color: "rose", extraFields: [] },
      { key: "religions", label: "Religions", description: "Catholic, Protestant, Islam, etc.", icon: BookMarked, color: "rose", extraFields: [] },
    ],
  },
  {
    groupKey: "workflows",
    groupLabel: "Workflow Configuration",
    icon: Workflow,
    groupColor: "text-cyan-600",
    categories: [
      { key: "clearance_workflows", label: "Clearance Workflow", description: "Department clearance step configuration", icon: Workflow, color: "cyan", extraFields: [] },
      { key: "enrollment_workflows", label: "Enrollment Approval Workflow", description: "Step configuration for enrollment approvals", icon: Workflow, color: "cyan", extraFields: [] },
    ],
  },
];

const ALL_CATEGORIES = SETUP_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({
    ...category,
    groupKey: group.groupKey,
    groupLabel: group.groupLabel,
  })),
);

const categoryToneClass: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  green: "bg-green-50 text-green-700 border-green-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  pink: "bg-pink-50 text-pink-700 border-pink-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

const buildBaseFormState = (config: SetupCategoryConfig) => ({
  code: "",
  name: "",
  description: "",
  ...(config.extraFields?.reduce(
    (acc, field) => ({
      ...acc,
      [field.key]: field.type === "toggle" ? false : field.type === "number" ? 0 : "",
    }),
    {},
  ) ?? {}),
});

function ToggleField({
  active,
  onToggle,
  activeLabel = "Yes",
  inactiveLabel = "No",
}: {
  active: boolean;
  onToggle: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[var(--erp-border)] bg-[var(--erp-surface-muted)] text-[var(--erp-text-muted)]"
      }`}
    >
      <span>{active ? activeLabel : inactiveLabel}</span>
      <AppStatusBadge status={active ? "Active" : "Inactive"}>
        {active ? activeLabel : inactiveLabel}
      </AppStatusBadge>
    </button>
  );
}

interface GenericSetupTableProps {
  categoryKey: string;
  config: SetupCategoryConfig & { groupKey?: string; groupLabel?: string };
}

function GenericSetupTable({ categoryKey, config }: GenericSetupTableProps) {
  const { setupData, addSetupItem, updateSetupItem, deleteSetupItem, toggleSetupItemActive } = useSTSNStore();
  const { confirm } = useAppDialog();
  const items = setupData[categoryKey] || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetupItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(buildBaseFormState(config));

  useEffect(() => {
    setSearchQuery("");
    setIsFormOpen(false);
    setEditingItem(null);
    setFormData(buildBaseFormState(config));
  }, [categoryKey, config]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          (item.description || "").toLowerCase().includes(query)
        );
      }),
    [items, searchQuery],
  );

  const openCreate = () => {
    setEditingItem(null);
    setFormData(buildBaseFormState(config));
    setIsFormOpen(true);
  };

  const openEdit = (item: SetupItem) => {
    setEditingItem(item);
    const nextData: Record<string, any> = {
      code: item.code,
      name: item.name,
      description: item.description || "",
    };
    config.extraFields?.forEach((field) => {
      nextData[field.key] =
        item[field.key] ?? (field.type === "toggle" ? false : field.type === "number" ? 0 : "");
    });
    setFormData(nextData);
    setIsFormOpen(true);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: Omit<SetupItem, "id" | "createdAt"> = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      isActive: editingItem ? editingItem.isActive : true,
      ...(config.extraFields?.reduce(
        (acc, field) => ({ ...acc, [field.key]: formData[field.key] }),
        {},
      ) ?? {}),
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

  const visibleExtraFields = config.extraFields?.slice(0, 2) ?? [];
  const activeCount = items.filter((item) => item.isActive).length;
  const Icon = config.icon;

  const resolveFieldDisplayValue = (item: SetupItem, field: FieldConfig) => {
    const value = item[field.key];
    if (field.type === "toggle") return value ? "Yes" : "No";
    if (field.type === "number") return Number(value || 0).toLocaleString();
    if (field.dataSourceKey) {
      return (
        (setupData[field.dataSourceKey] ?? []).find((candidate) => candidate.code === String(value || ""))?.name ??
        String(value || "—")
      );
    }
    return String(value || "—");
  };

  const columns = useMemo<AppTableColumn<SetupItem>[]>(() => {
    const extraFieldColumns: AppTableColumn<SetupItem>[] = visibleExtraFields.map((field) => ({
      id: field.key,
      header: field.label,
      cell: ({ row }) => {
        const content = resolveFieldDisplayValue(row.original, field);
        if (field.type === "toggle") {
          return (
            <AppStatusBadge status={row.original[field.key] ? "Active" : "Inactive"}>
              {content}
            </AppStatusBadge>
          );
        }
        return <span className="text-[var(--erp-text-muted)]">{content}</span>;
      },
    }));

    return [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ getValue }) => (
          <span className="font-mono text-[11px] font-bold text-[var(--erp-brand)]">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (
          <span className="font-semibold text-[var(--erp-text)]">{String(getValue())}</span>
        ),
      },
      ...extraFieldColumns,
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => (
          <span className="text-[11px] text-[var(--erp-text-muted)]">
            {getValue<string | undefined>() || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => toggleSetupItemActive(categoryKey, row.original.id)}
            title="Toggle Active/Inactive"
            className="cursor-pointer"
          >
            <AppStatusBadge status={row.original.isActive ? "Active" : "Inactive"} />
          </button>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <AppButton type="button" size="xs" variant="outline" onClick={() => openEdit(row.original)}>
              Edit
            </AppButton>
            <AppButton
              type="button"
              size="xs"
              variant="danger-outline"
              onClick={() => handleDelete(row.original.id, row.original.name)}
              leftIcon={Trash2}
            >
              Delete
            </AppButton>
          </div>
        ),
      },
    ];
  }, [categoryKey, handleDelete, setupData, toggleSetupItemActive, visibleExtraFields]);

  return (
    <div className="space-y-4">
      <AppCard tone="brand" className="border border-[var(--erp-border)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  categoryToneClass[config.color] ?? "border-[var(--erp-border)] bg-[var(--erp-surface-muted)] text-[var(--erp-brand)]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  {config.groupLabel}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--erp-text)]">
                  {config.label}
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--erp-text-muted)]">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Active Records
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Total Records
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--erp-text)]">{items.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
                  Audit Note
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--erp-text)]">Changes remain logged</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppSearchInput
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onClear={() => setSearchQuery("")}
              placeholder={`Search ${config.label.toLowerCase()}...`}
              aria-label={`Search ${config.label}`}
              uiSize="sm"
              wrapperClassName="min-w-[240px]"
            />
            <AppButton type="button" size="sm" leftIcon={Plus} onClick={openCreate}>
              Add {config.label.replace(/s$/, "")}
            </AppButton>
          </div>
        </div>
      </AppCard>

      <AppTable<SetupItem>
        data={filteredItems}
        columns={columns}
        title={config.label}
        description={config.description}
        enableSearch={false}
        enableColumnVisibility={false}
        initialPageSize={10}
        pageSizeOptions={[10]}
        loading={false}
        emptyMessage={searchQuery ? `No results for "${searchQuery}"` : `No ${config.label.toLowerCase()} configured yet.`}
        emptyDescription={
          searchQuery
            ? "Adjust the search query to find matching setup records."
            : `Create the first ${config.label.replace(/s$/, "").toLowerCase()} record to begin configuration.`
        }
        getRowId={(row) => row.id}
        toolbar={
          <span className="whitespace-nowrap text-[10px] font-mono text-[var(--erp-text-muted)]">
            {filteredItems.length} record{filteredItems.length !== 1 ? "s" : ""}
          </span>
        }
      />

      <p className="text-[10px] font-mono text-[var(--erp-text-muted)]">
        Last updated by: {items[0]?.createdBy || "System"} • {items.length} record
        {items.length !== 1 ? "s" : ""} total
      </p>

      <AppModal
        open={isFormOpen}
        title={editingItem ? `Edit ${config.label}` : `New ${config.label}`}
        eyebrow={config.groupLabel}
        icon={Icon}
        onClose={() => setIsFormOpen(false)}
        panelAs="form"
        onSubmit={handleSave}
        maxWidthClass="max-w-3xl"
        bodyClassName="space-y-4 bg-[var(--erp-surface)] p-5"
        footer={
          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="secondary" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" size="sm">
              {editingItem ? "Save Changes" : `Create ${config.label}`}
            </AppButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppFormField label="Code *">
            <AppInput
              required
              value={formData.code}
              onChange={(event) => setFormData({ ...formData, code: event.target.value })}
              placeholder="Unique code"
              uiSize="sm"
              className="font-mono"
            />
          </AppFormField>
          <AppFormField label="Name *">
            <AppInput
              required
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="Display name"
              uiSize="sm"
            />
          </AppFormField>
        </div>

        {config.extraFields && config.extraFields.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {config.extraFields.map((field) => (
              <div key={field.key} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                <AppFormField label={`${field.label}${field.required ? " *" : ""}`}>
                  {field.type === "select" ? (
                    <AppSelect
                      required={field.required}
                      value={String(formData[field.key] || "")}
                      onChange={(event) => setFormData({ ...formData, [field.key]: event.target.value })}
                      uiSize="sm"
                    >
                      <option value="">— Select —</option>
                      {field.dataSourceKey
                        ? (setupData[field.dataSourceKey] ?? [])
                            .filter((item) => item.isActive)
                            .map((item) => (
                              <option key={item.code} value={item.code}>
                                {item.name}
                              </option>
                            ))
                        : field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                    </AppSelect>
                  ) : field.type === "toggle" ? (
                    <ToggleField
                      active={Boolean(formData[field.key])}
                      onToggle={() =>
                        setFormData({ ...formData, [field.key]: !formData[field.key] })
                      }
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      value={String(formData[field.key] || "")}
                      onChange={(event) => setFormData({ ...formData, [field.key]: event.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-3 py-2.5 text-xs text-[var(--erp-text)] outline-none transition placeholder:text-[var(--erp-text-muted)] focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <AppInput
                      required={field.required}
                      type={field.type}
                      value={String(formData[field.key] ?? "")}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          [field.key]:
                            field.type === "number" ? Number(event.target.value) : event.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      uiSize="sm"
                    />
                  )}
                </AppFormField>
              </div>
            ))}
          </div>
        )}

        <AppFormField label="Description">
          <textarea
            value={formData.description || ""}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            rows={2}
            className="w-full rounded-2xl border border-[var(--erp-border)] bg-[var(--erp-surface-muted)] px-3 py-2.5 text-xs text-[var(--erp-text)] outline-none transition placeholder:text-[var(--erp-text-muted)] focus:border-[var(--erp-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--erp-brand)]/15"
            placeholder="Optional description or notes"
          />
        </AppFormField>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <p className="text-xs leading-relaxed text-blue-800">
            This record will continue to use the existing setup CRUD flow and remain visible to audit
            review.
          </p>
        </div>
      </AppModal>
    </div>
  );
}

interface CoreSetupModuleProps {
  initialCategoryKey?: string;
}

export default function CoreSetupModule({ initialCategoryKey }: CoreSetupModuleProps) {
  const { setupData, bookPackages } = useSTSNStore();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>(
    initialCategoryKey || "academic_categories",
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    SETUP_GROUPS.reduce((acc, group) => ({ ...acc, [group.groupKey]: group.groupKey === "academic" }), {}),
  );
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    if (!initialCategoryKey) return;
    const category = ALL_CATEGORIES.find((entry) => entry.key === initialCategoryKey);
    if (!category) return;
    setSelectedCategoryKey(initialCategoryKey);
    setExpandedGroups((prev) => ({ ...prev, [category.groupKey]: true }));
  }, [initialCategoryKey]);

  const toggleGroup = (key: string) => setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  const selectedConfig = ALL_CATEGORIES.find((category) => category.key === selectedCategoryKey);

  const filteredGroups = useMemo(() => {
    if (!globalSearch) return SETUP_GROUPS;
    const query = globalSearch.toLowerCase();
    return SETUP_GROUPS.map((group) => ({
      ...group,
      categories: group.categories.filter(
        (category) =>
          category.label.toLowerCase().includes(query) ||
          category.description.toLowerCase().includes(query),
      ),
    })).filter((group) => group.categories.length > 0);
  }, [globalSearch]);

  const totalSetupItems = useMemo(
    () => Object.values(setupData).reduce((sum, items) => sum + items.length, 0),
    [setupData],
  );

  return (
    <div className="space-y-4">
      <ModulePageHeader
        badge="Core Setup"
        badgeIcon={Settings}
        title="Core System Setup"
        subtitle="Centralized maintenance for permissions, references, accounting setup, campus data, scheduling references, and shared ERP configuration."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
                Total Records
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{totalSetupItems}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
                Setup Groups
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{SETUP_GROUPS.length}</p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <AppCard
          tone="brand"
          className="w-full border border-[var(--erp-border)] xl:sticky xl:top-0 xl:max-h-[calc(100vh-240px)] xl:w-80 xl:flex-shrink-0 xl:overflow-hidden"
          padded={false}
        >
          <div className="border-b border-[var(--erp-border)] p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--erp-text-muted)]">
              Setup Navigation
            </p>
            <AppSearchInput
              type="search"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              onClear={() => setGlobalSearch("")}
              placeholder="Search setup pages..."
              aria-label="Search setup pages"
              uiSize="sm"
              wrapperClassName="mt-3"
            />
          </div>
          <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-2">
            {filteredGroups.length === 0 ? (
              <AppEmptyState
                icon={Search}
                title="No setup categories found"
                description="Try a broader search term to find the setup area you need."
                compact
                tone="neutral"
              />
            ) : (
              filteredGroups.map((group) => {
                const GroupIcon = group.icon;
                const isExpanded = expandedGroups[group.groupKey];
                return (
                  <div key={group.groupKey} className="mb-1.5 rounded-2xl border border-transparent">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupKey)}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition hover:bg-[var(--erp-surface-muted)]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <GroupIcon className={`h-4 w-4 ${group.groupColor}`} />
                        <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--erp-text)]">
                          {group.groupLabel}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[var(--erp-text-muted)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[var(--erp-text-muted)]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 pb-2 pl-2">
                        {group.categories.map((category) => {
                          const CategoryIcon = category.icon;
                          const count =
                            category.customPage === "books_setup"
                              ? bookPackages.length
                              : (setupData[category.key] || []).length;
                          const isSelected = selectedCategoryKey === category.key;
                          return (
                            <button
                              key={category.key}
                              type="button"
                              onClick={() => setSelectedCategoryKey(category.key)}
                              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition ${
                                isSelected
                                  ? "bg-[var(--erp-brand)] text-white shadow-sm"
                                  : "hover:bg-[var(--erp-surface-muted)] text-[var(--erp-text-muted)]"
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <CategoryIcon
                                  className={`h-4 w-4 flex-shrink-0 ${
                                    isSelected ? "text-[var(--erp-accent)]" : "text-[var(--erp-text-muted)]"
                                  }`}
                                />
                                <span className="truncate text-xs font-medium">{category.label}</span>
                              </div>
                              <span className={`text-[10px] font-mono ${isSelected ? "text-white/75" : "text-[var(--erp-text-muted)]"}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </AppCard>

        <div className="min-w-0 flex-1">
          {selectedConfig?.customPage === "books_setup" ? (
            <BooksSetupPage />
          ) : selectedConfig ? (
            <GenericSetupTable categoryKey={selectedCategoryKey} config={selectedConfig} />
          ) : (
            <AppEmptyState
              icon={Settings}
              title="Select a setup category"
              description="Choose a category from the navigation panel to review and maintain configuration records."
            />
          )}
        </div>
      </div>
    </div>
  );
}
