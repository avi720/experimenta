import { useCallback, useMemo, useState } from "react";
import type { ExperimentRun } from "@/types/models";
import type { ChartConfig, ParamState, Sample } from "@/types/results";
import { parseRunParameters } from "./resultsDomain";
import { getDefaultChartSelection, getFormulasForExperiment } from "./physicsFormulas";
import {
  buildChartData,
  computeKeyStatistics,
  getChartAxisOptions,
  getNumericDataKeys,
  loadRunSamples,
} from "./runAnalysis";

type RunSelection = { run: ExperimentRun | null; paramState: ParamState; samples: Sample[] };

const EMPTY_SELECTION: RunSelection = { run: null, paramState: { parameters: {}, error: null }, samples: [] };

const INITIAL_CHART_CONFIG: ChartConfig = {
  xAxis: 'time',
  yAxis: 'position',
  showTheoretical: false,
  selectedFormula: null,
};

/**
 * Selected-run state for the Results page. Samples are parsed/reconstructed once when a run is
 * selected; everything derived from them (keys, statistics, axis options, chart data) is memoised.
 */
export function useRunAnalysis() {
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [chartConfig, setChartConfig] = useState(INITIAL_CHART_CONFIG);
  const { run: selectedRun, paramState, samples } = selection;

  const selectRun = useCallback((run: ExperimentRun) => {
    const nextParamState = parseRunParameters(run.parameters_json);
    const nextSamples = loadRunSamples(run, nextParamState);
    setSelection({ run, paramState: nextParamState, samples: nextSamples });
    setChartConfig((prev) => ({ ...prev, ...getDefaultChartSelection(run.experiment_slug, nextSamples) }));
  }, []);

  const clearRunIfSelected = useCallback((runId: string) => {
    setSelection((prev) => (prev.run?.id === runId ? EMPTY_SELECTION : prev));
  }, []);

  const updateChartConfig = useCallback((patch: Partial<ChartConfig>) => {
    setChartConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectFormula = useCallback((formulaId: string | null | undefined) => {
    const formula = formulaId && formulaId !== 'none'
      ? getFormulasForExperiment(selectedRun?.experiment_slug).find((f) => f.id === formulaId) || null
      : null;
    setChartConfig((prev) => ({
      ...prev,
      selectedFormula: formula,
      xAxis: formula?.axes?.[0] || 'time',
      yAxis: formula?.axes?.[1] || 'position',
    }));
  }, [selectedRun]);

  const numericKeys = useMemo(() => getNumericDataKeys(samples), [samples]);
  const statistics = useMemo(() => computeKeyStatistics(samples, numericKeys), [samples, numericKeys]);
  const axisOptions = useMemo(
    () => getChartAxisOptions(samples, chartConfig.selectedFormula, numericKeys),
    [samples, chartConfig.selectedFormula, numericKeys]
  );
  const chartData = useMemo(
    () => buildChartData(samples, chartConfig, paramState),
    [samples, chartConfig, paramState]
  );
  const hasTheoreticalSeries = useMemo(
    () => chartData.some((d) => Object.prototype.hasOwnProperty.call(d, 'theoretical_yAxis')),
    [chartData]
  );

  return {
    selectedRun,
    paramState,
    samples,
    chartConfig,
    statistics,
    axisOptions,
    chartData,
    hasTheoreticalSeries,
    formulas: getFormulasForExperiment(selectedRun?.experiment_slug),
    selectRun,
    clearRunIfSelected,
    updateChartConfig,
    selectFormula,
  };
}

export type RunAnalysis = ReturnType<typeof useRunAnalysis>;
