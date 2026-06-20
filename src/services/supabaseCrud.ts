/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabase } from "../lib/supabase";

/** Generates a real UUID so client-created records can be inserted into Supabase
 *  uuid primary key columns under the exact same id the UI already has in memory. */
export const newId = (): string => crypto.randomUUID();

const camelKey = (k: string) => k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const snakeKey = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export const toCamel = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (typeof obj !== "object" || obj instanceof Date) return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) out[camelKey(k)] = v;
  return out;
};

export const toSnake = (obj: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[snakeKey(k)] = v;
  }
  return out;
};

/** Fire-and-forget write — logs failures instead of throwing, since callers keep
 *  the previous synchronous local-state-first UX (state updates immediately,
 *  persistence happens in the background). */
const report = (label: string) => (error: unknown) => {
  if (error) console.error(`[supabase] ${label} failed:`, error);
};

export function dbInsert(table: string, row: Record<string, any>) {
  supabase.from(table).insert(toSnake(row)).then(({ error }) => report(`insert ${table}`)(error));
}

export function dbUpdate(table: string, id: string, updates: Record<string, any>) {
  supabase.from(table).update(toSnake(updates)).eq("id", id).then(({ error }) => report(`update ${table}`)(error));
}

export function dbDelete(table: string, id: string) {
  supabase.from(table).delete().eq("id", id).then(({ error }) => report(`delete ${table}`)(error));
}

export function dbDeleteWhere(table: string, column: string, value: string) {
  supabase.from(table).delete().eq(column, value).then(({ error }) => report(`delete ${table} where ${column}`)(error));
}

export async function dbSelectAll<T = any>(table: string, select = "*"): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(select);
  if (error) {
    console.error(`[supabase] select ${table} failed:`, error);
    return [];
  }
  return (data ?? []).map(toCamel) as T[];
}
