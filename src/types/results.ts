/** Types for the Results page: saved run samples, parsed parameters, chart state and statistics. */

/** One saved simulation sample (a row of `results_url`), keyed by output name. */
export type Sample = Record<string, unknown>;

export type ParamStateError = 'malformed_parameters_json';

/** `run.parameters_json` parsed for display; `error` is set when it could not be read. */
export type ParamState = {
  parameters: Record<string, unknown>;
  error: ParamStateError | null;
};

/** A theoretical (drag-free) formula that adds `theoretical_*` columns to samples. */
export type PhysicsFormula = {
  id: string;
  name_he: string;
  name_en: string;
  formula: string;
  axes: string[];
  calculate: (data: Sample[], params: Record<string, unknown>) => Sample[];
};

export type ChartConfig = {
  xAxis: string;
  yAxis: string;
  showTheoretical: boolean;
  selectedFormula: PhysicsFormula | null;
};

export type KeyStatistic = {
  key: string;
  avg: number;
  std: number;
  min: number;
  max: number;
};

/** `dateRange` is `all` | `today` | `week` | `month`; `experiment` is a slug or `all`. */
export type RunFilters = {
  experiment: string;
  dateRange: string;
};
