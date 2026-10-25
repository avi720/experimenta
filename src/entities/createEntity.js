import { supabase } from '@/api/supabaseClient';

// Columns managed by the database; never sent on insert/update.
const READ_ONLY_FIELDS = ['id', 'created_date', 'updated_date', 'created_by'];

const stripReadOnly = (data = {}) => {
  const clean = { ...data };
  READ_ONLY_FIELDS.forEach((field) => delete clean[field]);
  return clean;
};

// Sort string: 'created_date' (asc) or '-created_date' (desc).
const applySort = (query, sort) => {
  if (!sort) return query;
  const descending = sort.startsWith('-');
  return query.order(descending ? sort.slice(1) : sort, { ascending: !descending });
};

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

/**
 * Creates a Supabase-backed entity exposing the same API the app's data hooks expect:
 * list(sort, limit), filter(criteria, sort, limit), get(id), create(data), update(id, data), delete(id).
 * `onChange` runs after every successful write (e.g. to invalidate cached queries).
 */
export function createEntity(table, { onChange } = {}) {
  const afterWrite = (result) => {
    onChange?.();
    return result;
  };

  return {
    async list(sort, limit) {
      let query = applySort(supabase.from(table).select('*'), sort);
      if (limit) query = query.limit(limit);
      return unwrap(await query);
    },

    async filter(criteria = {}, sort, limit) {
      let query = applySort(supabase.from(table).select('*').match(criteria), sort);
      if (limit) query = query.limit(limit);
      return unwrap(await query);
    },

    async get(id) {
      return unwrap(await supabase.from(table).select('*').eq('id', id).single());
    },

    async create(data) {
      return afterWrite(unwrap(await supabase.from(table).insert(stripReadOnly(data)).select().single()));
    },

    async update(id, data) {
      return afterWrite(unwrap(await supabase.from(table).update(stripReadOnly(data)).eq('id', id).select().single()));
    },

    async delete(id) {
      const deletedRows = unwrap(await supabase.from(table).delete().eq('id', id).select('id'));
      if (!Array.isArray(deletedRows) || deletedRows.length === 0) {
        throw new Error(`Delete failed: row "${id}" in "${table}" was not found or access was denied.`);
      }
      return afterWrite(deletedRows[0]);
    },
  };
}
