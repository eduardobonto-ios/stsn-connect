/**
 * Runs the Phase 5 UAT "Data Validation" and "Retirement Readiness" SQL
 * checkpoints from docs/TEACHERS_TO_EMPLOYEES_UAT_CHECKLIST.md against the
 * live Supabase project configured in .env, and prints a pass/fail summary.
 *
 * Read-only: SELECT against public views only, no writes.
 *
 * Usage: node scripts/validate-teacher-consolidation.mjs
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are required (see .env).");
  process.exit(1);
}
const supabase = createClient(url, key);

async function selectAll(view, order) {
  let query = supabase.from(view).select("*");
  if (order) query = query.order(order);
  const { data, error } = await query;
  if (error) throw new Error(`${view}: ${error.message}`);
  return data ?? [];
}

let hadFailure = false;

function printTable(title, rows) {
  console.log(`\n=== ${title} ===`);
  if (rows.length === 0) {
    console.log("(no rows)");
    return;
  }
  console.table(rows);
}

const summary = await selectAll("v_teacher_consolidation_validation_summary", "metric_name");
printTable("v_teacher_consolidation_validation_summary", summary);
for (const row of summary) {
  if (row.passes === false) hadFailure = true;
}

const dualKeyGaps = await selectAll("v_teacher_consolidation_dual_key_gaps", "table_name");
printTable("v_teacher_consolidation_dual_key_gaps", dualKeyGaps);

const readiness = await selectAll("v_teacher_consolidation_retirement_readiness");
printTable("v_teacher_consolidation_retirement_readiness", readiness);
const readyForPhase6 = readiness[0]?.ready_for_phase_6 === true;

const bridgeSummary = await selectAll("v_teacher_employee_bridge_summary", "bridge_status");
printTable("v_teacher_employee_bridge_summary", bridgeSummary);

console.log("\n=== Result ===");
console.log(`ready_for_phase_6: ${readyForPhase6}`);
console.log(hadFailure || !readyForPhase6 ? "FAIL — not ready for Phase 6 retirement." : "PASS — retirement readiness gate is clean.");

process.exit(hadFailure || !readyForPhase6 ? 1 : 0);
