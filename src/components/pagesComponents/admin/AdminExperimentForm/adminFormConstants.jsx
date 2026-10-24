import { categoryNames } from '@/components/pagesComponents/lab/labConstants';

export const emptyExperiment = {
  slug: '',
  category: 'ClassicalMechanics',
  visualization_type: '3d',
  //engine: 'classicalMechanics',
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

// export const engineOptions = [
//   { value: 'classicalMechanics', label: 'מכניקה קלאסית' },
//   { value: 'quantumMechanics', label: 'מכניקה קוונטית' },
//   { value: 'optics', label: 'אופטיקה' },
//   { value: 'fluidMechanics', label: 'מכניקת זורמים' },
//   { value: 'thermodynamics', label: 'תרמודינמיקה' },
//   { value: 'electromagnetism', label: 'אלקטרומגנטיות' },
//   { value: 'relativity', label: 'תורת היחסות' }
// ];

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
