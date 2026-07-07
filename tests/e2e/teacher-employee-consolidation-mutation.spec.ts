import { test, expect, type Locator } from "@playwright/test";
import { login } from "./helpers/auth";
import { goto } from "./helpers/navigation";
import { expectModuleRendered } from "./helpers/assertions";
import {
  boundaryIso,
  getVerifyClient,
  loginAsFaculty,
  makeMarker,
  mutationUatSkipReason,
  resolveFacultyOwnership,
} from "./helpers/mutation-uat";

/**
 * Teacher→Employee consolidation — Phase 6 **mutation** UAT.
 *
 * This is the write-path gate the read-only spec
 * (teacher-employee-consolidation.spec.ts) intentionally does NOT cover. It
 * proves that brand-new / newly-touched rows created through the app UI carry
 * employee-based ownership, not just that historical rows were backfilled.
 *
 * Flows verified:
 *   1. Create schedule      → class_schedules.employee_id
 *   2. Submit attendance    → student_attendance.recorded_by_employee_id
 *   3. Create consultation  → consultation_appointments.employee_id
 *   4. Save/update grade    → grades.employee_id
 *
 * SAFETY: every test skips unless ALLOW_MUTATION_UAT=true AND MUTATION_UAT_TARGET
 * names a safe (local/demo/uat/test) database whose URL does not look like prod.
 * See helpers/mutation-uat.ts. Do NOT run this against production.
 *
 * Rows are tagged with a unique `MUTATION_UAT_<flow>_<timestamp>` marker in a
 * notes/remarks field (or, where no such field exists, located by a pre-action
 * timestamp boundary + known owner) so the exact touched row can be found and
 * cleaned up.
 */

const SKIP_REASON = mutationUatSkipReason();

/** Select the first real (non-placeholder) option of a native <select>. */
async function selectFirstRealOption(select: Locator): Promise<string | null> {
  const value = await select.evaluate((el: HTMLSelectElement) => {
    const opt = Array.from(el.options).find((o) => o.value !== "");
    return opt ? opt.value : null;
  });
  if (value === null) return null;
  await select.selectOption(value);
  return value;
}

test.describe("Teacher→Employee consolidation — Phase 6 mutation UAT (write paths)", () => {
  // Hard safety fence: skip the whole suite unless explicitly opted in against
  // a confirmed-safe database. The reason is printed so a skipped run is legible.
  test.skip(SKIP_REASON !== null, SKIP_REASON ?? "");

  // Writes are serial and stateful; never run these in parallel.
  test.describe.configure({ mode: "serial" });

  test("Schedule: creating a class schedule populates class_schedules.employee_id", async ({ page }) => {
    const client = getVerifyClient();
    const marker = makeMarker("SCHED");
    const since = boundaryIso();

    // Scheduling is an admin-scoped module; sign in as SUPER_ADMIN and assign a
    // bridged faculty member inside the form (that faculty is the owner whose
    // employee_id must be dual-written).
    await login(page, "SUPER_ADMIN");
    await goto(page, "/scheduling");
    await expectModuleRendered(page);

    await page.getByRole("button", { name: /new schedule/i }).first().click();
    const form = page.locator("form").filter({ hasText: /Create New Schedule|Faculty \/ Teacher/i });
    await expect(form).toBeVisible();

    // Cascading selects, in DOM order: [0] Faculty/Teacher, [1] Year Level,
    // [2] Subject, [3] Section, [4] Room, [5] Day. Subject/section options are
    // derived reactively from the chosen teacher + year level, so fill in order.
    const selects = form.locator("select");
    const teacherValue = await selectFirstRealOption(selects.nth(0));
    await selectFirstRealOption(selects.nth(1)); // year level
    const subjectValue = await selectFirstRealOption(selects.nth(2));
    const sectionValue = await selectFirstRealOption(selects.nth(3));
    await selectFirstRealOption(selects.nth(4)); // room

    expect(teacherValue, "no bridged faculty available to assign").not.toBeNull();
    expect(subjectValue, "no subject available for the chosen faculty/year").not.toBeNull();
    expect(sectionValue, "no section available for the chosen faculty/year").not.toBeNull();

    // Marker goes in the Notes textarea → class_schedules.notes.
    await form.locator('textarea[placeholder*="scheduling notes" i]').fill(marker);
    await form.getByRole("button", { name: /create schedule/i }).click();

    // Verify the new row carries an employee_id.
    const { data } = await client
      .from("class_schedules")
      .select("id, teacher_id, employee_id, section, subject_id, day, start_time, end_time, notes, created_at, updated_at")
      .eq("notes", marker)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = data?.[0];

    expect(row, `no class_schedules row found for marker ${marker}`).toBeTruthy();
    console.log(`[mutation-uat] schedule row: ${row!.id} employee_id=${row!.employee_id}`);
    expect(row!.employee_id, "class_schedules.employee_id must be dual-written").not.toBeNull();

    // Cleanup: we created this row, so deleting it cannot clobber demo data.
    await client.from("class_schedules").delete().eq("id", row!.id);
  });

  test("Attendance: submitting attendance populates student_attendance.recorded_by_employee_id", async ({ page }) => {
    const client = getVerifyClient();
    // Fixed sentinel date so the (student_id,date) upsert always INSERTs fresh
    // rows (never clobbers real demo attendance) and cleanup is unambiguous.
    const SENTINEL_DATE = "2099-01-01";
    const since = boundaryIso();

    await loginAsFaculty(page);
    const ownership = await resolveFacultyOwnership(client);
    expect(ownership, "signed-in faculty has no teachers row").toBeTruthy();
    expect(ownership!.employeeId, "faculty account is not bridged to an employee").not.toBeNull();

    await goto(page, "/faculty/portal/attendance-monitoring");
    await expectModuleRendered(page);

    // Use the sentinel date, then submit the pre-filled (all-Present) roll call.
    await page.locator('input[type="date"]').first().fill(SENTINEL_DATE);
    const rows = await page.locator("tbody tr").count();
    expect(rows, "advisory roster is empty — nothing to submit").toBeGreaterThan(0);
    await page.getByRole("button", { name: /submit today's attendance/i }).click();
    await expect(page.getByText(/successfully logged/i)).toBeVisible();

    const { data } = await client
      .from("student_attendance")
      .select("id, student_id, recorded_by, recorded_by_employee_id, date, status, created_at, updated_at")
      .eq("recorded_by", ownership!.teacherId)
      .eq("date", SENTINEL_DATE)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = data?.[0];

    expect(row, `no student_attendance row for teacher ${ownership!.teacherId} on ${SENTINEL_DATE}`).toBeTruthy();
    console.log(`[mutation-uat] attendance row: ${row!.id} recorded_by_employee_id=${row!.recorded_by_employee_id}`);
    expect(row!.recorded_by_employee_id, "student_attendance.recorded_by_employee_id must be populated").not.toBeNull();

    // Cleanup: delete every sentinel-date row we just wrote for this teacher.
    await client.from("student_attendance").delete().eq("recorded_by", ownership!.teacherId).eq("date", SENTINEL_DATE);
  });

  test("Consultation: creating a consultation populates consultation_appointments.employee_id", async ({ page }) => {
    const client = getVerifyClient();
    const marker = makeMarker("CONSULT");
    const since = boundaryIso();

    // Consultation create is reachable to SUPER_ADMIN; the faculty owner is the
    // one selected in the form's Faculty dropdown.
    await login(page, "SUPER_ADMIN");
    await goto(page, "/consultation");
    await expectModuleRendered(page);

    await page.getByRole("button", { name: /request consultation/i }).click();
    const dialog = page.locator("div").filter({ hasText: /New Consultation Request/i }).last();

    await dialog.locator('input[placeholder*="parent / student" i]').fill(`MUTATION UAT ${marker}`);
    // Faculty dropdown → selectedFaculty.employeeId. Pick the first real option.
    const facultySelects = dialog.locator("select");
    // Faculty is the last select in the form (after role + student). Choose one
    // with a real value so employee_id can resolve.
    const facultyValue = await selectFirstRealOption(facultySelects.nth((await facultySelects.count()) - 1));
    expect(facultyValue, "no bridged faculty option in consultation form").not.toBeNull();
    // Purpose is required; embed the marker so the row is greppable via remarks too.
    await dialog.locator('textarea[placeholder*="Reason for requesting" i]').fill(`${marker} — mutation UAT`);
    await dialog.locator('textarea[placeholder*="additional information" i]').fill(marker);

    await dialog.getByRole("button", { name: /submit consultation request/i }).click();

    const { data } = await client
      .from("consultation_appointments")
      .select("id, teacher_id, employee_id, student_id, appointment_date, status, remarks, created_at, updated_at")
      .eq("remarks", marker)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = data?.[0];

    expect(row, `no consultation_appointments row for marker ${marker}`).toBeTruthy();
    console.log(`[mutation-uat] consultation row: ${row!.id} employee_id=${row!.employee_id}`);
    expect(row!.employee_id, "consultation_appointments.employee_id must be populated").not.toBeNull();

    await client.from("consultation_appointments").delete().eq("id", row!.id);
  });

  test("Grade: saving a grade populates student_grade_entries.employee_id", async ({ page }) => {
    const client = getVerifyClient();
    const since = boundaryIso();

    await loginAsFaculty(page);
    const ownership = await resolveFacultyOwnership(client);
    expect(ownership, "signed-in faculty has no teachers row").toBeTruthy();
    expect(ownership!.employeeId, "faculty account is not bridged to an employee").not.toBeNull();

    // ARCHITECTURE (Option B, 2026-07-06): the grade-encoding UI writes the
    // CANONICAL grade table `student_grade_entries` via store.saveGradeEntry()
    // (not the legacy `grades` table — store.saveGrade() is dead code). Each
    // encoded score is now stamped with employee ownership derived from the
    // grade period's owner. This test drives a real score edit and verifies the
    // exact touched entry carries `student_grade_entries.employee_id`.
    const periodRows = await client
      .from("grade_periods")
      .select("id, teacher_id, employee_id")
      .eq("teacher_id", ownership!.teacherId);
    const periodIds = (periodRows.data ?? []).map((p) => p.id);
    expect(periodIds.length, "signed-in faculty owns no grade periods to encode into").toBeGreaterThan(0);

    // Snapshot current scores so cleanup can restore the exact touched row —
    // this flow UPDATEs a pre-seeded demo entry rather than creating one.
    const beforeRows = await client
      .from("student_grade_entries")
      .select("id, score")
      .in("grade_period_id", periodIds);
    const scoreBeforeById = new Map((beforeRows.data ?? []).map((r) => [r.id, r.score]));

    await goto(page, "/faculty/portal/student-grades-encoding");
    await expectModuleRendered(page);

    // The encoding sheet (number inputs) lives under the "Grade Input" tab; the
    // default view is the read-only "Grade Summary".
    await page.getByRole("button", { name: /grade input/i }).click();

    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs.first()).toBeVisible();
    const first = numberInputs.first();
    await first.fill("90");
    await first.blur();

    // Poll for the write: find the entry in this faculty's periods touched after
    // the boundary and assert it carries employee ownership.
    let row: {
      id: string;
      employee_id: string | null;
      student_id: string;
      grade_item_id: string;
      grade_period_id: string;
      score: number | null;
    } | undefined;
    await expect
      .poll(
        async () => {
          const { data } = await client
            .from("student_grade_entries")
            .select("id, employee_id, student_id, grade_item_id, grade_period_id, score, created_at, updated_at")
            .in("grade_period_id", periodIds)
            .gte("updated_at", since)
            .order("updated_at", { ascending: false })
            .limit(1);
          row = data?.[0];
          return row?.employee_id ?? null;
        },
        {
          timeout: 15_000,
          message:
            "No student_grade_entries row was stamped with employee_id after the grade-encoding UI save.",
        },
      )
      .not.toBeNull();

    console.log(`[mutation-uat] grade entry row: ${row!.id} employee_id=${row!.employee_id}`);
    expect(row!.employee_id, "student_grade_entries.employee_id must be stamped on save").not.toBeNull();
    expect(row!.employee_id, "stamped employee_id must match the signed-in faculty's employee").toBe(
      ownership!.employeeId,
    );

    // Cleanup: restore the touched entry's original score (non-destructive —
    // we only updated a pre-existing demo row).
    const originalScore = scoreBeforeById.has(row!.id) ? scoreBeforeById.get(row!.id) ?? null : null;
    await client.from("student_grade_entries").update({ score: originalScore }).eq("id", row!.id);
  });
});
