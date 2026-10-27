import { format as formatDate } from "date-fns";
import type { ExperimentRun } from "@/types/models";
import type { ParamState, RunFilters } from "@/types/results";

/**
 * Safely parses `run.parameters_json` without throwing during render.
 * Returns `{ parameters, error }` where `error` is non-null when JSON is malformed
 * or does not represent a plain parameter object.
 */
export function parseRunParameters(parametersJson: unknown): ParamState {
  if (parametersJson === null || parametersJson === undefined || parametersJson === '') {
    return { parameters: {}, error: null };
  }
  if (typeof parametersJson === 'object') {
    if (Array.isArray(parametersJson)) {
      return { parameters: {}, error: 'malformed_parameters_json' };
    }
    return { parameters: parametersJson as Record<string, unknown>, error: null };
  }
  if (typeof parametersJson !== 'string') {
    return { parameters: {}, error: 'malformed_parameters_json' };
  }
  try {
    const parsed: unknown = JSON.parse(parametersJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { parameters: {}, error: 'malformed_parameters_json' };
    }
    return { parameters: parsed as Record<string, unknown>, error: null };
  } catch {
    return { parameters: {}, error: 'malformed_parameters_json' };
  }
}

/**
 * Formats arbitrary parameter or table cell values safely so objects/arrays never crash React.
 */
export function formatDisplayValue(value: unknown, precision = 3): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toFixed(precision) : String(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Filters runs by experiment slug and date range (`all` | `today` | `week` | `month`).
 */
export function filterRunsByCriteria<T extends Pick<ExperimentRun, 'experiment_slug' | 'created_date'>>(
  runs: readonly T[] | null | undefined,
  filters: Partial<RunFilters> | null | undefined,
  now = new Date()
): T[] {
  if (!Array.isArray(runs)) return [];
  const experimentFilter = filters?.experiment || 'all';
  const dateRange = filters?.dateRange || 'all';

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const nowMs = now.getTime();
  const weekAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const monthAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  return runs.filter((run) => {
    if (experimentFilter !== 'all' && run.experiment_slug !== experimentFilter) {
      return false;
    }
    if (dateRange === 'all') {
      return true;
    }
    const createdMs = new Date(run.created_date).getTime();
    if (Number.isNaN(createdMs)) {
      return false;
    }
    if (dateRange === 'today') {
      return createdMs >= startOfToday;
    }
    if (dateRange === 'week') {
      return createdMs >= weekAgoMs;
    }
    if (dateRange === 'month') {
      return createdMs >= monthAgoMs;
    }
    return true;
  });
}

/** Formats a run timestamp with a date-fns pattern, falling back to the raw value. */
export function formatRunDate(dateStr: string | null | undefined, pattern: string): string {
  const d = new Date(dateStr as string);
  if (Number.isNaN(d.getTime())) return String(dateStr || '');
  return formatDate(d, pattern);
}
