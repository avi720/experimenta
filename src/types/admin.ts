/** Types for the admin experiment list and the experiment template form. */

/** Validation messages keyed by field id (e.g. `slug`, `title_he`, `param_0_default`, `preset_1_values`). */
export type FormErrors = Record<string, string>;

/** Raw JSON text of each preset's `values`, keyed by preset index, while it is being edited. */
export type PresetTextValues = Record<number, string>;

/** The arrays of an experiment template the form edits item by item. */
export type FormArrayName = 'parameters' | 'presets';

export type FormTab = 'general' | 'content' | 'parameters' | 'presets' | 'advanced';

export type AdminExperimentStats = {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  byEngine: Record<string, number>;
};

/** A labelled choice in an admin form select; `i18nKey` wins over the fallback `label`. */
export type AdminSelectOption = {
  value: string;
  i18nKey?: string;
  label: string;
};
