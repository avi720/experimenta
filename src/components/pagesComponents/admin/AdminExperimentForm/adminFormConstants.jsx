export const emptyExperiment = {
  slug: '',
  category: 'Classical',
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

export const categoryOptions = [
  { value: 'ClassicalMechanics', label: 'מכניקה קלאסית' },
  { value: 'QuantumMechanics', label: 'מכניקת הקוונטים' },
  { value: 'FluidMechanics', label: 'מכניקת הנוזלים' },
  { value: 'ThermoDynamics', label: 'תרמו-דינמיקה' },
  { value: 'Electromagnetism and Electricity', label: 'חשמל ומגנטיות' },
  { value: 'Optics', label: 'אופטיקה' },
  { value: 'General Relativity', label: 'יחסות כללית' }
];

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