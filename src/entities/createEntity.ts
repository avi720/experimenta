import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/api/supabaseClient';
import type { InsertRow, Row, TableName, UpdateRow } from '@/types/models';

// Columns managed by the database; never sent on insert/update.
const READ_ONLY_FIELDS = ['id', 'created_date', 'updated_date', 'created_by'] as const;

// supabase-js generics cannot follow a generic table name, so queries run on an untyped view of the
// client; the entity's public API below is what carries the per-table row types.
const db = supabase as unknown as SupabaseClient;

const stripReadOnly = <T extends object>(data: T): T => {
  const clean: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  READ_ONLY_FIELDS.forEach((field) => delete clean[field]);
  return clean as T;
};

// Sort string: 'created_date' (asc) or '-created_date' (desc).
// Typed loosely: PostgREST builder generics do not survive being passed through a helper.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applySort = <Q extends { order: (...args: any[]) => Q }>(query: Q, sort?: string): Q => {
  if (!sort) return query;
  const descending = sort.startsWith('-');
  return query.order(descending ? sort.slice(1) : sort, { ascending: !descending });
};

const unwrap = <T>({ data, error }: { data: T | null; error: PostgrestError | null }): T => {
  if (error) throw error;
  return data as T;
};

/**
 * Creates a Supabase-backed entity exposing the same API the app's data hooks expect:
 * list(sort, limit), filter(criteria, sort, limit), get(id), create(data), update(id, data), delete(id).
 * Cache invalidation after writes is done by the mutation hooks in `@/hooks/useDataQueries`.
 */
export function createEntity<T extends TableName>(table: T) {
  type R = Row<T>;
  return {
    async list(sort?: string, limit?: number): Promise<R[]> {
      let query = applySort(db.from(table).select('*'), sort);
      if (limit) query = query.limit(limit);
      return unwrap<R[]>(await query);
    },

    async filter(criteria: Partial<R> = {}, sort?: string, limit?: number): Promise<R[]> {
      let query = applySort(db.from(table).select('*').match(criteria), sort);
      if (limit) query = query.limit(limit);
      return unwrap<R[]>(await query);
    },

    async get(id: string): Promise<R> {
      return unwrap<R>(await db.from(table).select('*').eq('id', id).single());
    },

    async create(data: InsertRow<T>): Promise<R> {
      return unwrap<R>(await db.from(table).insert(stripReadOnly(data)).select().single());
    },

    async update(id: string, data: UpdateRow<T>): Promise<R> {
      return unwrap<R>(await db.from(table).update(stripReadOnly(data)).eq('id', id).select().single());
    },

    async delete(id: string): Promise<{ id: string }> {
      const deletedRows = unwrap<{ id: string }[]>(await db.from(table).delete().eq('id', id).select('id'));
      if (!Array.isArray(deletedRows) || deletedRows.length === 0) {
        throw new Error(`Delete failed: row "${id}" in "${table}" was not found or access was denied.`);
      }
      return deletedRows[0];
    },
  };
}
