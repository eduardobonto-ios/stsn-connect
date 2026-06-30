import { readFileSync, writeFileSync } from "fs";

const schemaPath = new URL("../supabase/migrations/0001_schema.sql", import.meta.url);
const sql = readFileSync(schemaPath, "utf8");

const tableNames = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);

if (tableNames.length === 0) {
  throw new Error("No tables found in schema file");
}

let out = `-- ============================================================================\n`;
out += `-- RLS: enabled on every table with permissive development policies that\n`;
out += `-- allow anon + authenticated to perform full CRUD. TIGHTEN BEFORE PRODUCTION.\n`;
out += `-- Generated from supabase/migrations/0001_schema.sql table list.\n`;
out += `-- ============================================================================\n\n`;

for (const t of tableNames) {
  out += `alter table public.${t} enable row level security;\n`;
  out += `create policy "${t}_select_anon_auth" on public.${t} for select to anon, authenticated using (true);\n`;
  out += `create policy "${t}_insert_anon_auth" on public.${t} for insert to anon, authenticated with check (true);\n`;
  out += `create policy "${t}_update_anon_auth" on public.${t} for update to anon, authenticated using (true) with check (true);\n`;
  out += `create policy "${t}_delete_anon_auth" on public.${t} for delete to anon, authenticated using (true);\n\n`;
}

writeFileSync(new URL("../supabase/migrations/0002_rls.sql", import.meta.url), out);
console.log(`Generated RLS policies for ${tableNames.length} tables.`);
