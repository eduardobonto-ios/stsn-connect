import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileClock, LockKeyhole, Save } from "lucide-react";
import AppButton from "../../../../components/common/AppButton";
import AppTabs from "../../../../components/common/AppTabs";
import ModulePageHeader from "../../../../components/common/ModulePageHeader";
import { supabase } from "../../../../lib/supabase";
import {
  formatStudentFeeAmount,
  isPublishedStudentFeeScheduleHistory,
  isStudentFeeScheduleEditable,
  normalizeStudentFeeAmountInput,
  parseStudentFeeAmount,
} from "../../../../services/studentFeeService";
import { useSTSNStore } from "../../../../services/store";
import type { StudentFeeSchedule } from "../../../../types";

type FeeScheduleView = "published" | "drafts";
type AcademicUnitFilter = "all" | StudentFeeSchedule["academicUnit"];

const publicationDateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatAcademicUnit = (unit: StudentFeeSchedule["academicUnit"]) => (
  unit === "basic-ed" ? "Basic Education" : "College"
);

const formatPublicationDate = (value?: string) => {
  if (!value) return "Publication date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Publication date unavailable" : publicationDateFormatter.format(date);
};

export default function TuitionFeesSetupPage() {
  const {
    activeSchool, schools, academicYears, academicYearLevels,
    studentFeeCategories, studentFeeItems, studentFeeSchedules, studentFeeScheduleRates,
    currentUser, reloadFinanceData,
  } = useSTSNStore();
  const schoolUuid = schools.find((school) => school.id === activeSchool)?.uuid;
  const [view, setView] = useState<FeeScheduleView>("published");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [academicUnitFilter, setAcademicUnitFilter] = useState<AcademicUnitFilter>("all");
  const [scheduleId, setScheduleId] = useState("");
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string }>();

  const yearById = useMemo(
    () => new Map(academicYears.map((year) => [year.id, year])),
    [academicYears],
  );
  const availableSchedules = useMemo(
    () => studentFeeSchedules.filter((schedule) => !schoolUuid || schedule.schoolId === schoolUuid),
    [schoolUuid, studentFeeSchedules],
  );
  const publishedHistorySchedules = useMemo(
    () => availableSchedules.filter(isPublishedStudentFeeScheduleHistory),
    [availableSchedules],
  );
  const draftSchedules = useMemo(
    () => availableSchedules.filter((schedule) => schedule.status === "Draft"),
    [availableSchedules],
  );
  const publishedAcademicYears = useMemo(() => {
    const usedYearIds = new Set(publishedHistorySchedules.map((schedule) => schedule.academicYearId));
    return academicYears
      .filter((year) => usedYearIds.has(year.id))
      .sort((left, right) => right.startDate.localeCompare(left.startDate));
  }, [academicYears, publishedHistorySchedules]);

  const sortSchedules = (left: StudentFeeSchedule, right: StudentFeeSchedule) => {
    const leftYear = yearById.get(left.academicYearId);
    const rightYear = yearById.get(right.academicYearId);
    const yearOrder = (rightYear?.startDate ?? rightYear?.name ?? "")
      .localeCompare(leftYear?.startDate ?? leftYear?.name ?? "");
    if (yearOrder) return yearOrder;
    const unitOrder = left.academicUnit.localeCompare(right.academicUnit);
    if (unitOrder) return unitOrder;
    if (left.status !== right.status) return left.status === "Published" ? -1 : 1;
    return right.version - left.version;
  };

  const visibleSchedules = useMemo(() => {
    const schedules = view === "drafts"
      ? draftSchedules
      : publishedHistorySchedules.filter((schedule) => (
        (academicYearFilter === "all" || schedule.academicYearId === academicYearFilter)
        && (academicUnitFilter === "all" || schedule.academicUnit === academicUnitFilter)
      ));
    return [...schedules].sort(sortSchedules);
  // sortSchedules reads only yearById and is intentionally scoped to this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicUnitFilter, academicYearFilter, draftSchedules, publishedHistorySchedules, view, yearById]);

  const scheduleGroups = useMemo(() => {
    const groups = new Map<string, StudentFeeSchedule[]>();
    for (const candidate of visibleSchedules) {
      const key = `${candidate.academicYearId}:${candidate.academicUnit}`;
      groups.set(key, [...(groups.get(key) ?? []), candidate]);
    }
    return [...groups.entries()].map(([key, schedules]) => ({
      key,
      academicYearId: schedules[0].academicYearId,
      academicUnit: schedules[0].academicUnit,
      schedules,
    }));
  }, [visibleSchedules]);

  useEffect(() => {
    if (!visibleSchedules.some((candidate) => candidate.id === scheduleId)) {
      setScheduleId(visibleSchedules[0]?.id ?? "");
      setDraftAmounts({});
    }
  }, [scheduleId, visibleSchedules]);

  const schedule = visibleSchedules.find((candidate) => candidate.id === scheduleId);
  const year = academicYears.find((candidate) => candidate.id === schedule?.academicYearId);
  const scheduleRates = studentFeeScheduleRates.filter((rate) => rate.scheduleId === scheduleId);
  const referencedItemIds = new Set(scheduleRates.map((rate) => rate.feeItemId));
  const referencedLevelIds = new Set(scheduleRates.map((rate) => rate.yearLevelId));
  const isDraft = schedule ? isStudentFeeScheduleEditable(schedule) : false;
  const levels = academicYearLevels
    .filter((level) => level.academicUnit === schedule?.academicUnit && (
      isDraft ? level.isActive : level.isActive || referencedLevelIds.has(level.id)
    ))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const items = studentFeeItems
    .filter((item) => item.schoolId === schedule?.schoolId && (
      isDraft ? item.isActive : referencedItemIds.has(item.id)
    ))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const categoryById = new Map(studentFeeCategories.map((category) => [category.id, category]));
  const rateByCell = new Map(
    scheduleRates
      .filter((rate) => !rate.courseId)
      .map((rate) => [`${rate.feeItemId}:${rate.yearLevelId}`, rate]),
  );

  const persistDraftChanges = async () => {
    if (!schedule || schedule.status !== "Draft") return;
    for (const [cell, rawAmount] of Object.entries(draftAmounts)) {
      const [feeItemId, yearLevelId] = cell.split(":");
      const existingRate = rateByCell.get(cell);
      if (!rawAmount.trim()) {
        if (existingRate) {
          const { error } = await (supabase as any).rpc("delete_student_fee_schedule_rate", {
            p_rate_id: existingRate.id,
            p_actor: currentUser?.name ?? null,
          });
          if (error) throw error;
        }
        continue;
      }
      const amount = parseStudentFeeAmount(rawAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Rates must be positive; leave a cell blank when it does not apply.");
      }
      const { error } = await (supabase as any).rpc("upsert_student_fee_schedule_rate", {
        p_schedule_id: schedule.id,
        p_fee_item_id: feeItemId,
        p_year_level_id: yearLevelId,
        p_amount: amount,
        p_course_id: null,
        p_actor: currentUser?.name ?? null,
      });
      if (error) throw error;
    }
  };

  const saveDraft = async () => {
    if (!schedule || schedule.status !== "Draft") return;
    setBusy(true);
    setMessage(undefined);
    try {
      await persistDraftChanges();
      await reloadFinanceData();
      setDraftAmounts({});
      setMessage({ tone: "ok", text: "Draft rates saved to the fee schedule." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Draft rates could not be saved." });
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!schedule || schedule.status !== "Draft") return;
    setBusy(true);
    setMessage(undefined);
    try {
      if (Object.keys(draftAmounts).length) await persistDraftChanges();
      const { error } = await (supabase as any).rpc("publish_student_fee_schedule", {
        p_schedule_id: schedule.id,
        p_actor: currentUser?.name ?? null,
      });
      if (error) throw error;
      await reloadFinanceData();
      setDraftAmounts({});
      setView("published");
      setAcademicYearFilter(schedule.academicYearId);
      setAcademicUnitFilter(schedule.academicUnit);
      setScheduleId(schedule.id);
      setMessage({ tone: "ok", text: "Schedule published. New assessments now resolve from this version." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Schedule could not be published." });
    } finally {
      setBusy(false);
    }
  };

  const createDraft = async () => {
    if (!schedule || schedule.status !== "Published") return;
    setBusy(true);
    setMessage(undefined);
    try {
      const { data, error } = await (supabase as any).rpc("create_student_fee_schedule_draft", {
        p_school_id: schedule.schoolId,
        p_academic_year_id: schedule.academicYearId,
        p_academic_unit: schedule.academicUnit,
        p_actor: currentUser?.name ?? null,
      });
      if (error) throw error;
      await reloadFinanceData();
      setView("drafts");
      setScheduleId(data?.id ?? "");
      setDraftAmounts({});
      setMessage({ tone: "ok", text: "Draft version created from the Published schedule." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Draft could not be created." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <ModulePageHeader
        badge="Shared Finance Setup"
        badgeIcon={Save}
        title="Tuition Fees"
        subtitle="Review immutable Published fee history and maintain Draft schedules for future publication."
        meta="Database-driven"
      />

      <AppTabs
        value={view}
        onChange={(nextView) => {
          setView(nextView);
          setScheduleId("");
          setDraftAmounts({});
          setMessage(undefined);
        }}
        items={[
          { value: "published", label: "Published Fees", badge: publishedHistorySchedules.length },
          { value: "drafts", label: "Drafts", badge: draftSchedules.length },
        ]}
      />

      {view === "published" && (
        <div className="grid gap-3 rounded-xl border border-stsn-beige bg-white p-4 shadow-sm sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            School year
            <select
              aria-label="Published fee school year"
              className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-stone-700"
              value={academicYearFilter}
              onChange={(event) => setAcademicYearFilter(event.target.value)}
            >
              <option value="all">All school years</option>
              {publishedAcademicYears.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Academic unit
            <select
              aria-label="Published fee academic unit"
              className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-stone-700"
              value={academicUnitFilter}
              onChange={(event) => setAcademicUnitFilter(event.target.value as AcademicUnitFilter)}
            >
              <option value="all">All academic units</option>
              <option value="basic-ed">Basic Education</option>
              <option value="college">College</option>
            </select>
          </label>
        </div>
      )}

      <div className="rounded-xl border border-stsn-beige bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
          <FileClock className="h-4 w-4 text-stsn-gold" />
          {view === "published" ? "Published schedule history" : "Draft schedules"}
        </div>
        {!scheduleGroups.length ? (
          <p className="rounded-lg border border-dashed border-stone-200 p-4 text-sm text-stone-500">
            {view === "published"
              ? "No Published fee schedules match the selected filters."
              : "No Draft fee schedules exist for this school."}
          </p>
        ) : (
          <div className="space-y-4">
            {scheduleGroups.map((group) => (
              <section key={group.key} aria-label={`${yearById.get(group.academicYearId)?.name ?? "Unconfigured year"} ${formatAcademicUnit(group.academicUnit)}`}>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {yearById.get(group.academicYearId)?.name ?? "Unconfigured year"} · {formatAcademicUnit(group.academicUnit)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.schedules.map((candidate) => {
                    const selected = candidate.id === scheduleId;
                    const currentPublished = candidate.status === "Published";
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => { setScheduleId(candidate.id); setDraftAmounts({}); setMessage(undefined); }}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition ${selected
                          ? "border-stsn-gold bg-amber-50 text-stone-900 ring-1 ring-stsn-gold/30"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
                      >
                        <span className="font-bold">Version {candidate.version}</span>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${currentPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : candidate.status === "Draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-600"}`}
                        >
                          {currentPublished ? "Current Published" : candidate.status === "Draft" ? "Draft" : "Previously Published"}
                        </span>
                        {candidate.publishedAt && (
                          <span className="mt-1 block text-[10px] text-stone-400">{formatPublicationDate(candidate.publishedAt)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${message.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {schedule && (
        <>
          <div className="rounded-xl border border-stsn-beige bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900">
                    {year?.name} · {formatAcademicUnit(schedule.academicUnit)} · Version {schedule.version}
                  </h2>
                  {schedule.status !== "Draft" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-600">
                      <LockKeyhole className="h-3 w-3" /> Read only
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-500">{schedule.sourceReference || "No source reference"}</p>
                {schedule.sourceNotes && <p className="mt-1 text-xs text-stone-500">{schedule.sourceNotes}</p>}
              </div>
              {schedule.status !== "Draft" && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-stone-500 sm:text-right">
                  <dt className="font-semibold">Published</dt>
                  <dd>{formatPublicationDate(schedule.publishedAt)}</dd>
                  <dt className="font-semibold">Published by</dt>
                  <dd>{schedule.publishedBy || "Unavailable"}</dd>
                </dl>
              )}
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-stsn-beige bg-white shadow-sm">
            <table className="min-w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-stone-50">
                <tr>
                  <th className="sticky left-0 z-10 min-w-56 border-b border-r border-stone-200 bg-stone-50 px-3 py-2 text-left">Fee item</th>
                  {levels.map((level) => <th key={level.id} className="min-w-28 border-b border-stone-200 px-2 py-2 text-right">{level.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="sticky left-0 border-r border-stone-100 bg-white px-3 py-2">
                      <div className="font-semibold text-stone-800">{item.name}</div>
                      <div className="text-[10px] text-stone-400">{categoryById.get(item.categoryId)?.name} · {item.code}</div>
                    </td>
                    {levels.map((level) => {
                      const cell = `${item.id}:${level.id}`;
                      const rate = rateByCell.get(cell);
                      if (schedule.status !== "Draft") {
                        return (
                          <td key={level.id} className="px-4 py-2 text-right font-medium tabular-nums text-stone-700">
                            {rate ? formatStudentFeeAmount(rate.amount) : "—"}
                          </td>
                        );
                      }
                      const value = draftAmounts[cell] ?? (rate ? formatStudentFeeAmount(rate.amount) : "");
                      return (
                        <td key={level.id} className="px-2 py-1.5 text-right">
                          <input
                            aria-label={`${item.name} ${level.name}`}
                            className="w-28 rounded border border-stone-200 px-2 py-1.5 text-right tabular-nums"
                            type="text"
                            inputMode="decimal"
                            value={value}
                            placeholder="—"
                            onChange={(event) => setDraftAmounts((current) => ({
                              ...current,
                              [cell]: normalizeStudentFeeAmountInput(event.target.value),
                            }))}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schedule.status === "Draft" && (
            <div className="flex justify-end gap-2">
              <AppButton variant="secondary" onClick={saveDraft} disabled={busy || !Object.keys(draftAmounts).length}>Save Draft</AppButton>
              <AppButton onClick={publish} disabled={busy}>Publish Schedule</AppButton>
            </div>
          )}
          {schedule.status === "Published" && (
            <div className="flex justify-end">
              <AppButton onClick={createDraft} disabled={busy}>Create Draft Version</AppButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
