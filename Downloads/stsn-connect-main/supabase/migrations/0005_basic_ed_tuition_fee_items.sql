-- ============================================================================
-- STSN CONNECT — Basic Education Tuition Fee Items per Year Level
-- Run this on an existing Supabase instance where 0001–0004 are already applied.
--
-- What this does:
--   • Adds 15 new fee_items rows (Nursery → Grade 12) in setup_items.
--     Each row carries a `yearLevel` key in its metadata JSONB that maps to
--     the `code` value of the corresponding year_levels setup item (e.g. "NURS",
--     "K1", "G1" … "G12").
--   • NO ALTER TABLE is required — the existing `metadata jsonb` column in
--     setup_items already holds arbitrary key/value pairs.
--   • Safe to run multiple times: `on conflict (category, code) do nothing`
--     skips rows that already exist.
--
-- How the Assessment tab uses this:
--   When a Basic Education student opens the Assessment tab, the system detects
--   that year-level-mapped tuition items exist and shows ONLY the single tuition
--   fee whose yearLevel code resolves to the student's year level name.
--   Non-tuition fees (Misc, Lab, ID, etc.) are unaffected.
-- ============================================================================

insert into public.setup_items
  (legacy_id, category, code, name, description, is_active, sort_order, metadata, created_by, created_at)
values
  ('fi-7',  'fee_items', 'TUI-NURS', 'Tuition Fee - Nursery',  'Basic Ed tuition for Nursery',        true, 10, '{"categoryId":"fc-1","amount":10500,"yearLevel":"NURS"}'::jsonb, 'Admin Administrator', now()),
  ('fi-8',  'fee_items', 'TUI-K1',   'Tuition Fee - Kinder 1', 'Basic Ed tuition for Kinder 1',       true, 11, '{"categoryId":"fc-1","amount":11000,"yearLevel":"K1"}'::jsonb,   'Admin Administrator', now()),
  ('fi-9',  'fee_items', 'TUI-K2',   'Tuition Fee - Kinder 2', 'Basic Ed tuition for Kinder 2',       true, 12, '{"categoryId":"fc-1","amount":11500,"yearLevel":"K2"}'::jsonb,   'Admin Administrator', now()),
  ('fi-10', 'fee_items', 'TUI-G1',   'Tuition Fee - Grade 1',  'Basic Ed tuition for Grade 1',        true, 13, '{"categoryId":"fc-1","amount":14000,"yearLevel":"G1"}'::jsonb,   'Admin Administrator', now()),
  ('fi-11', 'fee_items', 'TUI-G2',   'Tuition Fee - Grade 2',  'Basic Ed tuition for Grade 2',        true, 14, '{"categoryId":"fc-1","amount":14000,"yearLevel":"G2"}'::jsonb,   'Admin Administrator', now()),
  ('fi-12', 'fee_items', 'TUI-G3',   'Tuition Fee - Grade 3',  'Basic Ed tuition for Grade 3',        true, 15, '{"categoryId":"fc-1","amount":14500,"yearLevel":"G3"}'::jsonb,   'Admin Administrator', now()),
  ('fi-13', 'fee_items', 'TUI-G4',   'Tuition Fee - Grade 4',  'Basic Ed tuition for Grade 4',        true, 16, '{"categoryId":"fc-1","amount":15000,"yearLevel":"G4"}'::jsonb,   'Admin Administrator', now()),
  ('fi-14', 'fee_items', 'TUI-G5',   'Tuition Fee - Grade 5',  'Basic Ed tuition for Grade 5',        true, 17, '{"categoryId":"fc-1","amount":15000,"yearLevel":"G5"}'::jsonb,   'Admin Administrator', now()),
  ('fi-15', 'fee_items', 'TUI-G6',   'Tuition Fee - Grade 6',  'Basic Ed tuition for Grade 6',        true, 18, '{"categoryId":"fc-1","amount":15500,"yearLevel":"G6"}'::jsonb,   'Admin Administrator', now()),
  ('fi-16', 'fee_items', 'TUI-G7',   'Tuition Fee - Grade 7',  'Basic Ed tuition for Grade 7',        true, 19, '{"categoryId":"fc-1","amount":17000,"yearLevel":"G7"}'::jsonb,   'Admin Administrator', now()),
  ('fi-17', 'fee_items', 'TUI-G8',   'Tuition Fee - Grade 8',  'Basic Ed tuition for Grade 8',        true, 20, '{"categoryId":"fc-1","amount":17000,"yearLevel":"G8"}'::jsonb,   'Admin Administrator', now()),
  ('fi-18', 'fee_items', 'TUI-G9',   'Tuition Fee - Grade 9',  'Basic Ed tuition for Grade 9',        true, 21, '{"categoryId":"fc-1","amount":17500,"yearLevel":"G9"}'::jsonb,   'Admin Administrator', now()),
  ('fi-19', 'fee_items', 'TUI-G10',  'Tuition Fee - Grade 10', 'Basic Ed tuition for Grade 10',       true, 22, '{"categoryId":"fc-1","amount":17500,"yearLevel":"G10"}'::jsonb,  'Admin Administrator', now()),
  ('fi-20', 'fee_items', 'TUI-G11',  'Tuition Fee - Grade 11', 'Basic Ed tuition for Grade 11 (SHS)', true, 23, '{"categoryId":"fc-1","amount":18500,"yearLevel":"G11"}'::jsonb,  'Admin Administrator', now()),
  ('fi-21', 'fee_items', 'TUI-G12',  'Tuition Fee - Grade 12', 'Basic Ed tuition for Grade 12 (SHS)', true, 24, '{"categoryId":"fc-1","amount":18500,"yearLevel":"G12"}'::jsonb,  'Admin Administrator', now())
on conflict (category, code) do nothing;
