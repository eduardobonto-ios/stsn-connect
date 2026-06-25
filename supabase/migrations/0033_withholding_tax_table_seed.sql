-- ============================================================================
-- STSN Connect - Withholding Tax Table Seed
-- Starter BIR semi-monthly withholding brackets as effective-dated config rows.
-- Validate against official BIR tables before production payroll release.
-- ============================================================================

with inserted_table as (
  insert into public.tax_tables (effective_year, name, frequency, is_active)
  values (2026, 'BIR Semi-Monthly Withholding Tax Table - Starter Config', 'Semi-Monthly', true)
  on conflict (effective_year, frequency) do update
    set name = excluded.name,
        is_active = excluded.is_active
  returning id
)
insert into public.tax_brackets (tax_table_id, income_from, income_to, base_tax, rate_above)
select id, 0, 10417, 0, 0 from inserted_table
union all select id, 10417, 16667, 0, 0.15 from inserted_table
union all select id, 16667, 33333, 937.5, 0.20 from inserted_table
union all select id, 33333, 83333, 4270.83, 0.25 from inserted_table
union all select id, 83333, 333333, 16770.83, 0.30 from inserted_table
union all select id, 333333, null, 91770.83, 0.35 from inserted_table
on conflict (tax_table_id, income_from) do update
  set income_to = excluded.income_to,
      base_tax = excluded.base_tax,
      rate_above = excluded.rate_above;
