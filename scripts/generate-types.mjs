import { readFileSync, writeFileSync } from "fs";

const sql = readFileSync(new URL("../supabase/migrations/0001_schema.sql", import.meta.url), "utf8");

// Extract each `create table if not exists public.NAME ( ... );` block
const tableRe = /create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g;

function mapType(sqlType) {
  const t = sqlType.toLowerCase();
  if (t.startsWith("uuid[")) return "string[]";
  if (t.startsWith("text[")) return "string[]";
  if (t === "uuid" || t === "text" || t === "date" || t === "time" || t === "timestamptz") return "string";
  if (t === "numeric" || t.startsWith("int")) return "number";
  if (t === "boolean") return "boolean";
  if (t === "jsonb") return "Json";
  return "string";
}

function toPascalCase(snake) {
  return snake.split("_").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
}

let out = `// AUTO-GENERATED from supabase/migrations/0001_schema.sql — do not hand-edit.\n`;
out += `// Regenerate with: node scripts/generate-types.mjs\n\n`;
out += `export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n\n`;

const tableTypeNames = [];
let match;
while ((match = tableRe.exec(sql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const pascal = toPascalCase(tableName);
  tableTypeNames.push({ tableName, pascal });

  // split column lines: split on commas at top level (no nested parens beyond simple check/default exprs)
  const lines = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const columns = [];
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(unique|create index|primary key|check)\s*\(/i.test(line)) continue; // table-level constraints
    if (/^unique\s*\(/i.test(line)) continue;
    const colMatch = line.match(/^(\w+)\s+([a-zA-Z_]+(?:\[\])?)/);
    if (!colMatch) continue;
    const colName = colMatch[1];
    const colType = colMatch[2];
    const isPk = /primary key/i.test(line);
    const notNull = /not null/i.test(line) || isPk;
    const hasDefault = /default/i.test(line) || isPk;
    columns.push({ colName, colType, notNull, hasDefault });
  }

  const rowFields = columns.map((c) => `  ${c.colName}: ${mapType(c.colType)}${c.notNull ? "" : " | null"};`).join("\n");
  const insertFields = columns
    .map((c) => {
      const optional = c.hasDefault || !c.notNull;
      return `  ${c.colName}${optional ? "?" : ""}: ${mapType(c.colType)}${c.notNull ? "" : " | null"};`;
    })
    .join("\n");
  const updateFields = columns.map((c) => `  ${c.colName}?: ${mapType(c.colType)}${c.notNull ? "" : " | null"};`).join("\n");

  out += `export interface ${pascal}Row {\n${rowFields}\n}\nexport interface ${pascal}Insert {\n${insertFields}\n}\nexport interface ${pascal}Update {\n${updateFields}\n}\n\n`;
}

out += `export interface Database {\n  public: {\n    Tables: {\n`;
for (const { tableName, pascal } of tableTypeNames) {
  out += `      ${tableName}: { Row: ${pascal}Row; Insert: ${pascal}Insert; Update: ${pascal}Update };\n`;
}
out += `    };\n  };\n}\n`;

writeFileSync(new URL("../src/types/database.types.ts", import.meta.url), out);
console.log(`Generated types for ${tableTypeNames.length} tables.`);
