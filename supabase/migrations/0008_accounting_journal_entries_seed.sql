-- ============================================================================
-- STSN Connect — Seed Data: Journal Entries (SY 2025-2026)
-- 14 entries across August–December 2025
--   11 Posted  |  1 Void  |  2 Draft
--
-- Uses a DO $$ block so cost_center IDs are resolved dynamically from the
-- seed data inserted in migration 0006.
-- Guard: skips silently if legacy_id 'je-seed-001' already exists.
-- ============================================================================

-- ============================================================================
-- STSN Connect — Migration
-- Add legacy_id to journal_entries for seed idempotency
-- ============================================================================

alter table public.journal_entries
add column if not exists legacy_id text;

create unique index if not exists ux_journal_entries_legacy_id
on public.journal_entries (legacy_id)
where legacy_id is not null;


-- ============================================================================
-- STSN Connect — Seed Data: Journal Entries (SY 2025-2026)
-- 14 entries across August–December 2025
--   11 Posted  |  1 Void  |  2 Draft
--
-- Uses a DO $$ block so cost_center IDs are resolved dynamically from the
-- seed data inserted in migration 0006.
-- Guard: skips silently if legacy_id 'je-seed-001' already exists.
-- ============================================================================

do $$
declare
  -- ── Journal Entry header IDs ──────────────────────────────────────────────
  je01 uuid := gen_random_uuid();
  je02 uuid := gen_random_uuid();
  je03 uuid := gen_random_uuid();
  je04 uuid := gen_random_uuid();
  je05 uuid := gen_random_uuid();
  je06 uuid := gen_random_uuid();
  je07 uuid := gen_random_uuid();
  je08 uuid := gen_random_uuid();
  je09 uuid := gen_random_uuid();
  je10 uuid := gen_random_uuid();
  je11 uuid := gen_random_uuid();
  je12 uuid := gen_random_uuid();
  je13 uuid := gen_random_uuid();
  je14 uuid := gen_random_uuid();

  -- ── Cost center IDs ──────────────────────────────────────────────────────
  cc_basic_ed   uuid;
  cc_college    uuid;
  cc_admin      uuid;
  cc_hr         uuid;
  cc_facilities uuid;

begin
  -- ── Guard ─────────────────────────────────────────────────────────────────
  if exists (select 1 from public.journal_entries where legacy_id = 'je-seed-001') then
    raise notice 'Journal entry seed data already present — skipping.';
    return;
  end if;

  -- continue the rest of your current insert script here...
end $$;

do $$
declare
  -- ── Journal Entry header IDs ──────────────────────────────────────────────
  je01 uuid := gen_random_uuid();
  je02 uuid := gen_random_uuid();
  je03 uuid := gen_random_uuid();
  je04 uuid := gen_random_uuid();
  je05 uuid := gen_random_uuid();
  je06 uuid := gen_random_uuid();
  je07 uuid := gen_random_uuid();
  je08 uuid := gen_random_uuid();
  je09 uuid := gen_random_uuid();
  je10 uuid := gen_random_uuid();
  je11 uuid := gen_random_uuid();
  je12 uuid := gen_random_uuid();
  je13 uuid := gen_random_uuid();
  je14 uuid := gen_random_uuid();

  -- ── Cost center IDs (resolved from 0006 seed) ────────────────────────────
  cc_basic_ed   uuid;   -- CC-1000  Basic Education
  cc_college    uuid;   -- CC-2000  College / Tertiary
  cc_admin      uuid;   -- CC-3000  Administrative
  cc_hr         uuid;   -- CC-3200  Human Resources
  cc_facilities uuid;   -- CC-4000  Facilities & Maintenance

begin
  -- ── Guard ─────────────────────────────────────────────────────────────────
  if exists (select 1 from public.journal_entries where legacy_id = 'je-seed-001') then
    raise notice 'Journal entry seed data already present — skipping.';
    return;
  end if;

  -- ── Resolve cost center UUIDs ─────────────────────────────────────────────
  select id into cc_basic_ed   from public.cost_centers where code = 'CC-1000';
  select id into cc_college    from public.cost_centers where code = 'CC-2000';
  select id into cc_admin      from public.cost_centers where code = 'CC-3000';
  select id into cc_hr         from public.cost_centers where code = 'CC-3200';
  select id into cc_facilities from public.cost_centers where code = 'CC-4000';

  -- ══════════════════════════════════════════════════════════════════════════
  -- JOURNAL ENTRY HEADERS
  -- ══════════════════════════════════════════════════════════════════════════
  insert into public.journal_entries (
    id, legacy_id,
    entry_no, entry_date, fiscal_year, fiscal_period,
    description, reference_no, source_type, status,
    created_by, posted_by, posted_at,
    voided_by, voided_at, void_reason
  ) values

  -- ── August 2025 ──────────────────────────────────────────────────────────

  (je01, 'je-seed-001',
   'JE-2025-2026-00001', '2025-08-05', '2025-2026', 'August 2025',
   'Tuition assessment — SY 2025-2026 (Semester 1)',
   null, 'Assessment', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-08-05 09:00:00+08',
   null, null, null),

  (je02, 'je-seed-002',
   'JE-2025-2026-00002', '2025-08-12', '2025-2026', 'August 2025',
   'Book package billing — SY 2025-2026',
   'BP-2025-001', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-08-12 10:30:00+08',
   null, null, null),

  (je03, 'je-seed-003',
   'JE-2025-2026-00003', '2025-08-20', '2025-2026', 'August 2025',
   'Cash collection — tuition payments, August 2025',
   'OR-0001 to OR-0045', 'Payment', 'Posted',
   'Maria Santos', 'Eduardo Bonto, CPA', '2025-08-20 16:00:00+08',
   null, null, null),

  (je04, 'je-seed-004',
   'JE-2025-2026-00004', '2025-08-25', '2025-2026', 'August 2025',
   'Bank deposit — BDO, August 2025',
   'DEP-2025-08-001', 'Manual', 'Posted',
   'Maria Santos', 'Eduardo Bonto, CPA', '2025-08-25 14:00:00+08',
   null, null, null),

  (je05, 'je-seed-005',
   'JE-2025-2026-00005', '2025-08-30', '2025-2026', 'August 2025',
   'Salaries and statutory benefits — August 2025',
   'PAY-2025-08', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-08-30 11:00:00+08',
   null, null, null),

  -- ── September 2025 ───────────────────────────────────────────────────────

  (je06, 'je-seed-006',
   'JE-2025-2026-00006', '2025-09-10', '2025-2026', 'September 2025',
   'Utilities — electricity and water, September 2025',
   'MERALCO-2025-09', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-09-10 09:30:00+08',
   null, null, null),

  (je07, 'je-seed-007',
   'JE-2025-2026-00007', '2025-09-15', '2025-2026', 'September 2025',
   'Miscellaneous fees collection — September 2025',
   'OR-0046 to OR-0095', 'Payment', 'Posted',
   'Maria Santos', 'Eduardo Bonto, CPA', '2025-09-15 17:00:00+08',
   null, null, null),

  (je08, 'je-seed-008',
   'JE-2025-2026-00008', '2025-09-30', '2025-2026', 'September 2025',
   'SSS / PhilHealth / Pag-IBIG remittance — August 2025',
   'SSS-PHIC-PAG-AUG25', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-09-30 10:00:00+08',
   null, null, null),

  -- ── October 2025 ─────────────────────────────────────────────────────────

  (je09, 'je-seed-009',
   'JE-2025-2026-00009', '2025-10-05', '2025-2026', 'October 2025',
   'Classroom supplies purchase — Q2, SY 2025-2026',
   'REC-2025-10-001', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-10-05 13:00:00+08',
   null, null, null),

  -- VOID: duplicate entry of JE-00009, voided next day
  (je10, 'je-seed-010',
   'JE-2025-2026-00010', '2025-10-05', '2025-2026', 'October 2025',
   'Classroom supplies purchase — Q2 [ENTERED IN ERROR]',
   'REC-2025-10-001', 'Manual', 'Void',
   'Eduardo Bonto, CPA', null, null,
   'Eduardo Bonto, CPA', '2025-10-06 09:00:00+08',
   'Duplicate entry — refer to JE-2025-2026-00009'),

  (je11, 'je-seed-011',
   'JE-2025-2026-00011', '2025-10-31', '2025-2026', 'October 2025',
   'Salaries and statutory benefits — October 2025',
   'PAY-2025-10', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-10-31 11:30:00+08',
   null, null, null),

  -- ── November 2025 ────────────────────────────────────────────────────────

  (je12, 'je-seed-012',
   'JE-2025-2026-00012', '2025-11-10', '2025-2026', 'November 2025',
   'Repairs & maintenance — school building, November 2025',
   'PO-2025-11-001', 'Manual', 'Posted',
   'Eduardo Bonto, CPA', 'Eduardo Bonto, CPA', '2025-11-10 14:00:00+08',
   null, null, null),

  -- ── December 2025 (Drafts pending approval) ──────────────────────────────

  (je13, 'je-seed-013',
   'JE-2025-2026-00013', '2025-12-05', '2025-2026', 'December 2025',
   'Accounts payable settlement — contractor invoices, December 2025',
   null, 'Manual', 'Draft',
   'Eduardo Bonto, CPA', null, null,
   null, null, null),

  (je14, 'je-seed-014',
   'JE-2025-2026-00014', '2025-12-15', '2025-2026', 'December 2025',
   '13th month pay — teaching and administrative staff',
   'PAY-2025-13MO', 'Manual', 'Draft',
   'Eduardo Bonto, CPA', null, null,
   null, null, null);

  -- ══════════════════════════════════════════════════════════════════════════
  -- JOURNAL ENTRY LINES
  -- Rule: each line has EITHER debit_amount > 0 OR credit_amount > 0 (XOR).
  -- Columns: (id, journal_entry_id, line_no, account_code, cost_center_id,
  --           debit_amount, credit_amount, description)
  -- ══════════════════════════════════════════════════════════════════════════
  insert into public.journal_entry_lines (
    id, journal_entry_id, line_no, account_code, cost_center_id,
    debit_amount, credit_amount, description
  ) values

  -- ── JE 01 · Tuition Assessment  Dr 520,000 = Cr 360,000 + 160,000 ───────
  (gen_random_uuid(), je01, 1, '1130', null,
   520000.00,      0.00, 'AR — tuition receivable SY 2025-2026 sem 1'),
  (gen_random_uuid(), je01, 2, '4110', cc_basic_ed,
        0.00, 360000.00, 'Basic Education tuition income'),
  (gen_random_uuid(), je01, 3, '4120', cc_college,
        0.00, 160000.00, 'College / tertiary tuition income'),

  -- ── JE 02 · Book Package Billing  Dr 45,000 = Cr 45,000 ─────────────────
  (gen_random_uuid(), je02, 1, '1130', null,
    45000.00,      0.00, 'AR — book package billing SY 2025-2026'),
  (gen_random_uuid(), je02, 2, '4300', cc_basic_ed,
        0.00,  45000.00, 'Book package revenue'),

  -- ── JE 03 · Cash Collection  Dr 240,000 = Cr 240,000 ────────────────────
  (gen_random_uuid(), je03, 1, '1110', null,
   240000.00,      0.00, 'Cash received — tuition August 2025'),
  (gen_random_uuid(), je03, 2, '1130', null,
        0.00, 240000.00, 'AR settlement — tuition August 2025'),

  -- ── JE 04 · Bank Deposit  Dr 220,000 = Cr 220,000 ───────────────────────
  (gen_random_uuid(), je04, 1, '1120', null,
   220000.00,      0.00, 'BDO deposit — August 2025 collections'),
  (gen_random_uuid(), je04, 2, '1110', null,
        0.00, 220000.00, 'Cash transferred to bank'),

  -- ── JE 05 · August Payroll  Dr 135,300 = Cr 12,300 + 123,000 ────────────
  (gen_random_uuid(), je05, 1, '5110', cc_basic_ed,
    85000.00,      0.00, 'Teachers'' salaries — August 2025'),
  (gen_random_uuid(), je05, 2, '5120', cc_admin,
    38000.00,      0.00, 'Administrative staff salaries — August 2025'),
  (gen_random_uuid(), je05, 3, '5130', cc_hr,
    12300.00,      0.00, 'SSS / PhilHealth / Pag-IBIG employer share — August'),
  (gen_random_uuid(), je05, 4, '2120', null,
        0.00,  12300.00, 'Government contributions payable — August 2025'),
  (gen_random_uuid(), je05, 5, '1120', null,
        0.00, 123000.00, 'Net salaries disbursed via BDO bank transfer'),

  -- ── JE 06 · Utilities  Dr 27,500 = Cr 27,500 ────────────────────────────
  (gen_random_uuid(), je06, 1, '5210', cc_facilities,
    22400.00,      0.00, 'MERALCO electricity — September 2025'),
  (gen_random_uuid(), je06, 2, '5220', cc_facilities,
     5100.00,      0.00, 'NAWASA water bill — September 2025'),
  (gen_random_uuid(), je06, 3, '1120', null,
        0.00,  27500.00, 'Utilities paid via BDO'),

  -- ── JE 07 · Miscellaneous Fees  Dr 28,500 = Cr 28,500 ───────────────────
  (gen_random_uuid(), je07, 1, '1110', null,
    28500.00,      0.00, 'Cash received — miscellaneous fees September 2025'),
  (gen_random_uuid(), je07, 2, '4200', null,
        0.00,  28500.00, 'Miscellaneous fee income'),

  -- ── JE 08 · Gov''t Remittance  Dr 12,300 = Cr 12,300 ────────────────────
  (gen_random_uuid(), je08, 1, '2120', null,
    12300.00,      0.00, 'SSS / PhilHealth / Pag-IBIG payable — August 2025'),
  (gen_random_uuid(), je08, 2, '1120', null,
        0.00,  12300.00, 'Government remittance paid via BDO'),

  -- ── JE 09 · Supplies Purchase  Dr 15,800 = Cr 15,800 ────────────────────
  (gen_random_uuid(), je09, 1, '5230', cc_admin,
    15800.00,      0.00, 'Classroom supplies — Q2 SY 2025-2026'),
  (gen_random_uuid(), je09, 2, '1120', null,
        0.00,  15800.00, 'Supplies paid via BDO'),

  -- ── JE 10 · VOID duplicate  Dr 15,800 = Cr 15,800 ───────────────────────
  (gen_random_uuid(), je10, 1, '5230', cc_admin,
    15800.00,      0.00, '[VOID] Classroom supplies — Q2 SY 2025-2026'),
  (gen_random_uuid(), je10, 2, '1120', null,
        0.00,  15800.00, '[VOID] Supplies paid via BDO'),

  -- ── JE 11 · October Payroll  Dr 140,250 = Cr 12,750 + 127,500 ───────────
  (gen_random_uuid(), je11, 1, '5110', cc_basic_ed,
    88000.00,      0.00, 'Teachers'' salaries — October 2025'),
  (gen_random_uuid(), je11, 2, '5120', cc_admin,
    39500.00,      0.00, 'Administrative staff salaries — October 2025'),
  (gen_random_uuid(), je11, 3, '5130', cc_hr,
    12750.00,      0.00, 'SSS / PhilHealth / Pag-IBIG employer share — October'),
  (gen_random_uuid(), je11, 4, '2120', null,
        0.00,  12750.00, 'Government contributions payable — October 2025'),
  (gen_random_uuid(), je11, 5, '1120', null,
        0.00, 127500.00, 'Net salaries disbursed via BDO bank transfer'),

  -- ── JE 12 · Repairs & Maintenance  Dr 35,000 = Cr 35,000 ────────────────
  (gen_random_uuid(), je12, 1, '5240', cc_facilities,
    35000.00,      0.00, 'School building repairs — perimeter wall'),
  (gen_random_uuid(), je12, 2, '2110', null,
        0.00,  35000.00, 'Payable to contractor — PO-2025-11-001'),

  -- ── JE 13 · DRAFT AP Settlement  Dr 35,000 = Cr 35,000 ──────────────────
  (gen_random_uuid(), je13, 1, '2110', null,
    35000.00,      0.00, 'AP settlement — contractor invoice November 2025'),
  (gen_random_uuid(), je13, 2, '1120', null,
        0.00,  35000.00, 'Payment via BDO — pending approval'),

  -- ── JE 14 · DRAFT 13th Month Pay  Dr 10,250 = Cr 10,250 ─────────────────
  (gen_random_uuid(), je14, 1, '5110', cc_basic_ed,
     7083.33,      0.00, 'Teachers'' 13th month pay — December 2025'),
  (gen_random_uuid(), je14, 2, '5120', cc_admin,
     3166.67,      0.00, 'Admin staff 13th month pay — December 2025'),
  (gen_random_uuid(), je14, 3, '1120', null,
        0.00,  10250.00, 'Net 13th month pay — pending posting');

end $$;
