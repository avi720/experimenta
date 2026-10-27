import { categoryNames } from '@/components/pagesComponents/lab/labConstants';
import type { AdminSelectOption } from '@/types/admin';
import type { ExperimentFormData, Parameter } from '@/types/experiment';

export const emptyExperiment: ExperimentFormData = {
  slug: '',
  category: 'ClassicalMechanics',
  visualization_type: '3d',
  access_level: 'public',
  parameters: [],
  outputs: [],
  presets: [],
  i18n_texts: {
    he: { title: '', short_desc: '', steps: [], safety_notes: '' },
    en: { title: '', short_desc: '', steps: [], safety_notes: '' },
  },
  thumbnail_url: '',
  tags: [],
  is_active: true,
};

export const categoryOptions: { value: string; label: string }[] = Object.entries(categoryNames).map(([value, labels]) => ({
  value,
  label: labels.he,
}));

export const accessLevelOptions: AdminSelectOption[] = [
  { value: 'public', i18nKey: 'admin.form.general.accessPublic', label: 'פתוח לכולם (Public)' },
  { value: 'registered', i18nKey: 'admin.form.general.accessRegistered', label: 'משתמשים רשומים בלבד (Registered)' },
  { value: 'premium', i18nKey: 'admin.form.general.accessPremium', label: 'מנויי פרימיום בלבד (Premium)' },
];

export const parameterTypes: AdminSelectOption[] = [
  { value: 'float', i18nKey: 'admin.form.parameters.typeFloat', label: 'מספר עשרוני (float)' },
  { value: 'int', i18nKey: 'admin.form.parameters.typeInt', label: 'מספר שלם (integer)' },
  { value: 'select', i18nKey: 'admin.form.parameters.typeSelect', label: 'רשימת בחירה (select)' },
  { value: 'bool', i18nKey: 'admin.form.parameters.typeBool', label: 'בוליאני (true/false)' }
];

export const emptyParameter: Parameter = {
    key: '',
    type: 'float',
    unit: '',
    default: '0',
    min: '0',
    max: '100',
    step: '0.1',
    options: [],
    i18n_labels: { he: '', en: '' },
    tooltip: { he: '', en: '' },
    is_active: true
};
