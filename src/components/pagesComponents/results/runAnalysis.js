import { resolveExperimentRegistryEntry } from "@/components/simulation/experimentRegistry";
import {
  parseStoredSimulationSamples,
  serializeSimulationSamples,
} from "@/components/hooks/simulation/useExperimentPersistence";

/**
 * Reconstructs run samples from the real physics engine only for legacy rows
 * that were saved before `results_url` stored the actual sample array.
 */
function reconstructLegacyRunSamples(experimentSlug, parameters) {
  const entry = resolveExperimentRegistryEntry(experimentSlug);
  if (!entry) return [];

  if (entry.mode === 'static' && typeof entry.calculateStaticFn === 'function') {
    const mergedParams = { ...(entry.defaultParameters || {}), ...(parameters || {}) };
    const result = entry.calculateStaticFn(mergedParams);
    return Array.isArray(result) ? serializeSimulationSamples(result) : [];
  }

  if (typeof entry.calculateStepFn === 'function') {
    const parsedTMax = parseFloat(parameters?.t_max);
    const maxTime = !Number.isNaN(parsedTMax) && parsedTMax > 0
      ? parsedTMax
      : entry.defaultMaxTime ?? 10;
    const dt = 0.001;
    const raw = [];
    for (let t = 0; t <= maxTime + 1e-9; t += dt) {
      const point = entry.calculateStepFn(Number(t.toFixed(6)), parameters || {});
      raw.push(point);
      if (point?.shouldStop) break;
    }
    return serializeSimulationSamples(raw);
  }

  return [];
}

/**
 * Prefers the exact stored sample array in `results_url`; falls back to the real engine
 * for legacy runs only when parameters parsed cleanly.
 */
export function loadRunSamples(run, paramState) {
  if (!run) return [];
  const storedSamples = parseStoredSimulationSamples(run.results_url);
  if (storedSamples) return storedSamples;
  return paramState.error ? [] : reconstructLegacyRunSamples(run.experiment_slug, paramState.parameters);
}

/** Numeric sample keys other than `time`, taken from the first sample. */
export function getNumericDataKeys(samples) {
  if (!samples.length) return [];
  return Object.keys(samples[0]).filter(
    (key) => key !== 'time' && typeof samples[0][key] === 'number'
  );
}

/** Axis choices: the formula's axes that exist in the data, or every numeric key plus `time`. */
export function getChartAxisOptions(samples, formula, numericKeys) {
  if (formula?.axes) {
    return formula.axes.filter((key) => {
      const baseKey = key.replace('theoretical_', '');
      return samples.length > 0 && Object.prototype.hasOwnProperty.call(samples[0], baseKey);
    });
  }
  return numericKeys.concat(['time']);
}

/** Mean, population std-dev, min and max for each numeric key. */
export function computeKeyStatistics(samples, keys) {
  return keys
    .map((key) => {
      const values = samples.map((d) => d[key]).filter((v) => typeof v === 'number');
      if (values.length === 0) return null;
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);
      return { key, avg, std, min: Math.min(...values), max: Math.max(...values) };
    })
    .filter(Boolean);
}

/** Samples plus theoretical columns (and `theoretical_yAxis`) when a formula is shown. */
export function buildChartData(samples, chartConfig, paramState) {
  if (!samples.length) return [];
  let data = [...samples];
  if (chartConfig.showTheoretical && chartConfig.selectedFormula && !paramState.error) {
    data = chartConfig.selectedFormula.calculate(data, paramState.parameters);
    const theoreticalKey = `theoretical_${chartConfig.yAxis}`;
    if (data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], theoreticalKey)) {
      data = data.map((d) => ({ ...d, theoretical_yAxis: d[theoreticalKey] }));
    }
  }
  return data;
}
