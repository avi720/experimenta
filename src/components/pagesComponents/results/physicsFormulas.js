// Predefined physics formulas (no drag/damping) for theoretical comparison against saved samples.

const pickNum = (val, fallback) => {
  const num = parseFloat(val);
  return Number.isNaN(num) ? fallback : num;
};

export const physicsFormulas = {
  'free-fall': [
    {
      id: 'position_vs_time',
      name_he: 'מיקום כתלות בזמן (ריק)',
      name_en: 'Position vs Time (Vacuum)',
      formula: 'h = h₀ + v₀t - ½gt²',
      axes: ['time', 'position', 'theoretical_position'],
      calculate: (data, params) => {
        const h0 = pickNum(params.h0, 50);
        const v0 = pickNum(params.v0, 0);
        const g = pickNum(params.g, 9.81);
        return data.map(point => ({
          ...point,
          theoretical_position: Math.max(0, h0 + v0 * point.time - 0.5 * g * Math.pow(point.time, 2))
        }));
      }
    },
    {
      id: 'velocity_vs_time',
      name_he: 'מהירות כתלות בזמן (ריק)',
      name_en: 'Velocity vs Time (Vacuum)',
      formula: 'v = v₀ - gt',
      axes: ['time', 'velocity', 'theoretical_velocity'],
      calculate: (data, params) => {
        const v0 = pickNum(params.v0, 0);
        const g = pickNum(params.g, 9.81);
        return data.map(point => ({
          ...point,
          theoretical_velocity: v0 - g * point.time
        }));
      }
    },
    {
      id: 'energy_conservation',
      name_he: 'שימור אנרגיה (ריק)',
      name_en: 'Energy Conservation (Vacuum)',
      formula: 'E₀ = ½mv₀² + mgh₀',
      axes: ['time', 'energy_kinetic', 'energy_potential', 'energy_total', 'theoretical_energy'],
      calculate: (data, params) => {
        const h0 = pickNum(params.h0, 50);
        const v0 = pickNum(params.v0, 0);
        const g = pickNum(params.g, 9.81);
        const m = pickNum(params.m, 1);
        const initialEnergy = 0.5 * m * v0 * v0 + m * g * h0;
        return data.map(point => ({
          ...point,
          energy_total: point.energy_total ?? (point.energy_kinetic + point.energy_potential),
          theoretical_energy: initialEnergy
        }));
      }
    }
  ],
  'sho': [
    {
      id: 'sho_position',
      name_he: 'מתנד הרמוני אידיאלי - מיקום',
      name_en: 'Ideal SHO Position',
      formula: 'x = x₀ cos(ω₀t) + (v₀/ω₀) sin(ω₀t)',
      axes: ['time', 'position', 'theoretical_position'],
      calculate: (data, params) => {
        const k = pickNum(params.k, 10);
        const m = pickNum(params.m, 1);
        const x0 = pickNum(params.x0, 1);
        const v0 = pickNum(params.v0, 0);
        const omega = Math.sqrt(k / m);
        return data.map(point => ({
          ...point,
          theoretical_position: x0 * Math.cos(omega * point.time) + (omega > 0 ? (v0 / omega) * Math.sin(omega * point.time) : 0)
        }));
      }
    }
  ]
};

export function getFormulasForExperiment(slug) {
  return physicsFormulas[slug] || [];
}

/** Chart axes/formula a freshly selected run opens with. */
export function getDefaultChartSelection(slug, samples) {
  const firstPoint = samples[0] || {};
  const defaultFormula = physicsFormulas[slug]?.[0] || null;
  const xAxis = typeof firstPoint.time === 'number' ? 'time' : Object.keys(firstPoint)[0] || 'time';
  const numericKeys = Object.keys(firstPoint).filter(
    (k) => k !== xAxis && typeof firstPoint[k] === 'number'
  );
  const formulaDefaultY = defaultFormula?.axes[1];
  const yAxis = formulaDefaultY && numericKeys.includes(formulaDefaultY)
    ? formulaDefaultY
    : numericKeys[0] || 'position';
  return { selectedFormula: defaultFormula, xAxis, yAxis };
}
