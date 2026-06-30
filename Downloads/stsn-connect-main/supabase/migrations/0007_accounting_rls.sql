-- ============================================================================
-- RLS policies for accounting tables created in 0006.
-- Matches the permissive dev pattern in 0002_rls.sql.
-- ============================================================================

alter table public.chart_of_accounts enable row level security;
create policy "chart_of_accounts_select_anon_auth" on public.chart_of_accounts for select to anon, authenticated using (true);
create policy "chart_of_accounts_insert_anon_auth" on public.chart_of_accounts for insert to anon, authenticated with check (true);
create policy "chart_of_accounts_update_anon_auth" on public.chart_of_accounts for update to anon, authenticated using (true) with check (true);
create policy "chart_of_accounts_delete_anon_auth" on public.chart_of_accounts for delete to anon, authenticated using (true);

alter table public.cost_centers enable row level security;
create policy "cost_centers_select_anon_auth" on public.cost_centers for select to anon, authenticated using (true);
create policy "cost_centers_insert_anon_auth" on public.cost_centers for insert to anon, authenticated with check (true);
create policy "cost_centers_update_anon_auth" on public.cost_centers for update to anon, authenticated using (true) with check (true);
create policy "cost_centers_delete_anon_auth" on public.cost_centers for delete to anon, authenticated using (true);

alter table public.journal_entries enable row level security;
create policy "journal_entries_select_anon_auth" on public.journal_entries for select to anon, authenticated using (true);
create policy "journal_entries_insert_anon_auth" on public.journal_entries for insert to anon, authenticated with check (true);
create policy "journal_entries_update_anon_auth" on public.journal_entries for update to anon, authenticated using (true) with check (true);
create policy "journal_entries_delete_anon_auth" on public.journal_entries for delete to anon, authenticated using (true);

alter table public.journal_entry_lines enable row level security;
create policy "journal_entry_lines_select_anon_auth" on public.journal_entry_lines for select to anon, authenticated using (true);
create policy "journal_entry_lines_insert_anon_auth" on public.journal_entry_lines for insert to anon, authenticated with check (true);
create policy "journal_entry_lines_update_anon_auth" on public.journal_entry_lines for update to anon, authenticated using (true) with check (true);
create policy "journal_entry_lines_delete_anon_auth" on public.journal_entry_lines for delete to anon, authenticated using (true);
