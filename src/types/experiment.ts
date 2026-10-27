import type { ExperimentRun, ExperimentTemplate } from './models';

/**
 * Typed views of the jsonb columns on `experiment_templates` / `experiment_runs`. The database
 * types them as `Json`; these are the shapes the app writes and reads.
 */

export type Locale = 'he' | 'en';

/** A value stored once per locale, e.g. `parameter.i18n_labels`. */
export type Bilingual<T = string> = Record<Locale, T>;

export type ParameterType = 'float' | 'int' | 'select' | 'bool';

/** One choice of a `select` parameter. */
export type ParameterOption = {
  value: string;
  label_he?: string;
  label_en?: string;
};

/**
 * One entry of `experiment_templates.parameters`. Numeric fields are edited as text in the
 * admin form, so they may hold numbers or numeric strings.
 */
export type Parameter = {
  key: string;
  type: ParameterType | string;
  unit?: string;
  default?: number | string | boolean | null;
  min?: number | string | null;
  max?: number | string | null;
  step?: number | string | null;
  options?: ParameterOption[];
  i18n_labels?: Partial<Bilingual>;
  tooltip?: Partial<Bilingual>;
  is_active?: boolean;
};

/** Current parameter values, keyed by `Parameter.key`. */
export type ParameterValues = Record<string, number | string | boolean | null | undefined>;

/** One entry of `experiment_templates.presets`. */
export type Preset = {
  name_he?: string;
  name_en?: string;
  values: ParameterValues;
};

/** Texts for one locale in `experiment_templates.i18n_texts`. */
export type LocalizedTexts = {
  title?: string;
  short_desc?: string;
  steps?: string[];
  safety_notes?: string;
};

export type I18nTexts = Partial<Bilingual<LocalizedTexts>>;

/** An experiment template with its jsonb columns typed. */
export type ExperimentTemplateData = Omit<
  ExperimentTemplate,
  'parameters' | 'presets' | 'i18n_texts' | 'tags' | 'outputs'
> & {
  parameters: Parameter[];
  presets: Preset[];
  i18n_texts: I18nTexts;
  tags: string[];
  outputs: string[];
};

/** An experiment template as edited in the admin form (no id until saved). */
export type ExperimentFormData = Omit<ExperimentTemplateData, 'id' | 'created_date' | 'updated_date' | 'created_by' | 'type' | 'name' | 'engine'> &
  Partial<Pick<ExperimentTemplateData, 'id' | 'created_date' | 'updated_date' | 'created_by' | 'type' | 'name' | 'engine'>>;

/** An experiment run with `parameters_json` typed. */
export type ExperimentRunData = Omit<ExperimentRun, 'parameters_json'> & {
  parameters_json: Record<string, unknown>;
};
