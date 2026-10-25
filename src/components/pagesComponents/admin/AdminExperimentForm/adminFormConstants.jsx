import { categoryNames } from '@/components/pagesComponents/lab/labConstants';

export const emptyExperiment = {
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

export const categoryOptions = Object.entries(categoryNames).map(([value, labels]) => ({
  value,
  label: labels.he,
}));

export const accessLevelOptions = [
  { value: 'public', label: 'פתוח לכולם (Public)' },
  { value: 'registered', label: 'משתמשים רשומים בלבד (Registered)' },
  { value: 'premium', label: 'מנויי פרימיום בלבד (Premium)' },
];

export const parameterTypes = [
  { value: 'float', label: 'מספר עשרוני (float)' },
  { value: 'int', label: 'מספר שלם (integer)' },
  { value: 'select', label: 'רשימת בחירה (select)' },
  { value: 'bool', label: 'בוליאני (true/false)' }
];

export const emptyParameter = {
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
