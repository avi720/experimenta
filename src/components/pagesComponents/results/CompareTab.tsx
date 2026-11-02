import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExperimentTemplatesQuery } from "@/hooks/useDataQueries";
import { useTranslation } from "@/i18n";
import type { ExperimentRun } from "@/types/models";
import type { ParamState, Sample } from "@/types/results";
import { loadRunSamples } from "./runAnalysis";
import { formatDisplayValue, formatRunDate, parseRunParameters } from "./resultsDomain";
import {
  COMPARE_CHART_MARGIN,
  COMPARE_X_AXIS_PADDING,
  formatAxisTick,
} from "./compareChartLayout";
import {
  parametersFromTemplate,
  resolveParameterLabel,
  resolveSeriesLabel,
  type ResolvedLabel,
} from "./compareLabels";
import {
  chartAxisLabelStyle,
  chartColors,
  chartTick,
  chartTooltipProps,
  fieldLabelClass,
  panelTitleClass,
  selectTriggerClass,
  valueClass,
} from "./resultsStyles";
import {
  buildRunOverlay,
  comparableRuns,
  compareParameters,
  compareRunLabel,
  defaultOverlayAxes,
  sharedNumericKeys,
  type OverlayPoint,
  type ParameterDifference,
} from "./compareRuns";

/** Axis titles use the UI face so Hebrew is drawn in the same type as the rest of the page. */
const axisTitleStyle = {
  ...chartAxisLabelStyle,
  fontFamily: '"IBM Plex Sans Hebrew", "Segoe UI", Arial, sans-serif',
};

/** Dashed horizon trace for the second run, distinct from the solid blueshift of the open run. */
const OVERLAY_DASH = "6 4";
const DATE_PATTERN = "dd/MM/yyyy HH:mm";

type SeriesVariant = "primary" | "overlay";

type CompareTabProps = {
  run: ExperimentRun;
  samples: Sample[];
  paramState: ParamState;
  runs: readonly ExperimentRun[];
};

function SeriesSwatch({ variant }: { variant: SeriesVariant }) {
  const color = variant === "primary" ? chartColors.experimental : chartColors.overlay;
  return (
    <svg width="24" height="8" aria-hidden="true" className="shrink-0">
      <line
        x1="0"
        y1="4"
        x2="24"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={variant === "overlay" ? OVERLAY_DASH : undefined}
      />
    </svg>
  );
}

function CompareLabelText({ label }: { label: ResolvedLabel }) {
  const ltr = [
    label.symbol,
    label.unitAffix === "bracket" ? `[${label.unit}]` : label.unitAffix === "paren" ? `(${label.unit})` : "",
  ].filter((part) => part.length > 0).join(" ");
  // The symbol and unit stay left to right so "m/s²" does not reorder in Hebrew. aria-label
  // keeps the spoken name spaced ("Height y [m]") when the visible runs are split.
  return (
    <span aria-label={label.text}>
      <span aria-hidden="true">{label.name}</span>
      {ltr ? <span aria-hidden="true" dir="ltr" className="font-mono">{` ${ltr}`}</span> : null}
    </span>
  );
}

function AxisSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: ResolvedLabel[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={fieldLabelClass}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={selectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              <CompareLabelText label={option} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SeriesLegendItem({
  variant,
  label,
  axis,
  points,
  emptyLabel,
}: {
  variant: SeriesVariant;
  label: string;
  axis: ResolvedLabel;
  points: OverlayPoint[];
  emptyLabel: string;
}) {
  const first = points[0];
  const last = points[points.length - 1];
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-star">
      <SeriesSwatch variant={variant} />
      <span className="break-all" dir="ltr">{label}</span>
      {first && last ? (
        <>
          <span className="text-xs text-dust">
            <CompareLabelText label={axis} />
          </span>
          <span className="font-mono text-xs text-dust" dir="ltr">
            {first.x.toFixed(3)}–{last.x.toFixed(3)}
          </span>
        </>
      ) : (
        <span className="text-dust">{emptyLabel}</span>
      )}
    </li>
  );
}

function ParameterSide({
  variant,
  label,
  value,
  missing,
  missingLabel,
}: {
  variant: SeriesVariant;
  label: string;
  value: unknown;
  missing: boolean;
  missingLabel: string;
}) {
  const blank = value === null || value === undefined;
  return (
    // items-start keeps the value on the same side as its run label. A dir=ltr on the
    // whole dd would pin the number to the physical left in Hebrew.
    <div className="flex min-w-0 flex-col items-start gap-1">
      <dt className="flex items-center gap-2 text-xs text-dust">
        <SeriesSwatch variant={variant} />
        <span className="break-all" dir="ltr">{label}</span>
      </dt>
      {missing ? (
        <dd className="text-sm text-dust">{missingLabel}</dd>
      ) : (
        <dd className={`text-[15px] ${blank ? "text-dust" : valueClass}`}>
          <bdi dir="ltr" style={{ unicodeBidi: "isolate" }} className="break-all">
            {blank ? "—" : formatDisplayValue(value, 3)}
          </bdi>
        </dd>
      )}
    </div>
  );
}

function ParameterDifferences({
  title,
  unreadable,
  unreadableLabel,
  noneLabel,
  unchangedLabel,
  missingLabel,
  currentLabel,
  partnerLabel,
  differences,
  unchangedCount,
  labelFor,
}: {
  title: string;
  unreadable: boolean;
  unreadableLabel: string;
  noneLabel: string;
  unchangedLabel: string;
  missingLabel: string;
  currentLabel: string;
  partnerLabel: string;
  differences: ParameterDifference[] | null;
  unchangedCount: number;
  labelFor: (key: string) => ResolvedLabel;
}) {
  let body;
  if (unreadable || !differences) {
    body = <p role="alert" className="mt-4 text-sm text-danger">{unreadableLabel}</p>;
  } else if (differences.length === 0) {
    body = <p className="mt-4 text-sm leading-relaxed text-dust">{noneLabel}</p>;
  } else {
    body = (
      <>
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {differences.map((diff) => (
            <li key={diff.key} className="py-3">
              <p className="break-words text-sm font-medium text-star">
                <CompareLabelText label={labelFor(diff.key)} />
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ParameterSide
                  variant="primary"
                  label={currentLabel}
                  value={diff.left}
                  missing={diff.kind === "only_right"}
                  missingLabel={missingLabel}
                />
                <ParameterSide
                  variant="overlay"
                  label={partnerLabel}
                  value={diff.right}
                  missing={diff.kind === "only_left"}
                  missingLabel={missingLabel}
                />
              </dl>
            </li>
          ))}
        </ul>
        {unchangedCount > 0 && <p className="mt-3 text-sm text-dust">{unchangedLabel}</p>}
      </>
    );
  }

  return (
    <section className="border-t border-line pt-6">
      <h3 className={panelTitleClass}>{title}</h3>
      {body}
    </section>
  );
}

export default function CompareTab({ run, samples, paramState, runs }: CompareTabProps) {
  const { t, dir, locale } = useTranslation();
  const templatesQuery = useExperimentTemplatesQuery();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [axes, setAxes] = useState<{ x: string; y: string } | null>(null);

  const candidates = useMemo(() => comparableRuns(runs, run), [runs, run]);
  const partner = partnerId ? candidates.find((candidate) => candidate.id === partnerId) ?? null : null;
  const partnerParamState = useMemo(
    () => (partner ? parseRunParameters(partner.parameters_json) : null),
    [partner],
  );
  const partnerSamples = useMemo(
    () => (partner && partnerParamState ? loadRunSamples(partner, partnerParamState) : []),
    [partner, partnerParamState],
  );

  const labels = useMemo(() => {
    const group = [run, ...candidates];
    const formatDate = (date: string | null | undefined) => formatRunDate(date, DATE_PATTERN);
    const byId = new Map<string, string>();
    for (const candidate of group) {
      byId.set(candidate.id, compareRunLabel(candidate, group, formatDate));
    }
    return byId;
  }, [run, candidates]);

  const sharedKeys = useMemo(
    () => (partner ? sharedNumericKeys(samples, partnerSamples) : []),
    [partner, samples, partnerSamples],
  );
  const defaults = useMemo(() => defaultOverlayAxes(sharedKeys), [sharedKeys]);
  const axesMatch = Boolean(
    axes && sharedKeys.includes(axes.x) && sharedKeys.includes(axes.y) && axes.x !== axes.y,
  );
  const activeAxes = axesMatch ? axes : defaults;
  const overlay = useMemo(
    () => (activeAxes ? buildRunOverlay(samples, partnerSamples, activeAxes.x, activeAxes.y) : null),
    [activeAxes, samples, partnerSamples],
  );
  const parameterComparison = useMemo(() => {
    if (!partner || !partnerParamState || paramState.error || partnerParamState.error) return null;
    return compareParameters(paramState.parameters, partnerParamState.parameters);
  }, [partner, partnerParamState, paramState]);

  const parameterCatalog = useMemo(
    () => parametersFromTemplate(templatesQuery.data, run.experiment_slug),
    [templatesQuery.data, run.experiment_slug],
  );
  const seriesLabels = useMemo(() => {
    const byKey = new Map<string, ResolvedLabel>();
    for (const key of sharedKeys) {
      byKey.set(key, resolveSeriesLabel(run.experiment_slug, key, locale));
    }
    return byKey;
  }, [sharedKeys, run.experiment_slug, locale]);
  const labelForSeries = (key: string) => seriesLabels.get(key) ?? resolveSeriesLabel(run.experiment_slug, key, locale);
  const labelForParameter = (key: string) => resolveParameterLabel(key, parameterCatalog, locale);

  const currentLabel = labels.get(run.id) ?? run.id;
  const partnerLabel = partner ? labels.get(partner.id) ?? partner.id : "";
  const xLabel = activeAxes ? labelForSeries(activeAxes.x) : null;
  const yLabel = activeAxes ? labelForSeries(activeAxes.y) : null;
  const paramsUnreadable = Boolean(partner && (paramState.error || partnerParamState?.error));
  const describedBy = candidates.length === 0 ? "compare-empty" : "compare-run-hint";
  const canPlot = Boolean(
    overlay && (overlay.left.length > 0 || overlay.right.length > 0) && overlay.xDomain && overlay.yDomain,
  );

  const chooseAxis = (which: "x" | "y", value: string) => {
    if (!activeAxes) return;
    if (which === "x") {
      setAxes(value === activeAxes.y ? { x: value, y: activeAxes.x } : { x: value, y: activeAxes.y });
      return;
    }
    setAxes(value === activeAxes.x ? { x: activeAxes.y, y: value } : { x: activeAxes.x, y: value });
  };

  return (
    <div dir={dir} className="min-w-0 space-y-8">
      <section className="space-y-4">
        <div className="space-y-2 sm:max-w-md">
          <Label htmlFor="compare-run" className={fieldLabelClass}>{t("results.compareWithLabel")}</Label>
          <Select
            value={partner?.id ?? ""}
            onValueChange={setPartnerId}
            disabled={candidates.length === 0}
          >
            <SelectTrigger id="compare-run" aria-describedby={describedBy} className={selectTriggerClass}>
              <SelectValue placeholder={t("results.compareSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  <span dir="ltr">{labels.get(candidate.id)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {candidates.length > 0 && (
            <p id="compare-run-hint" className="text-[13px] leading-relaxed text-dust">
              {t("results.compareSameExperimentHint")}{" "}
              <bdi dir="ltr" className="font-mono">{run.experiment_slug}</bdi>
            </p>
          )}
        </div>

        {!partner && (
          <p
            id="compare-empty"
            className="border border-dashed border-line px-6 py-10 text-center text-sm leading-relaxed text-dust"
          >
            {candidates.length === 0
              ? t("results.compareNeedAnotherRun")
              : t("results.comparePickSecondRun")}
          </p>
        )}
      </section>

      {partner && partnerParamState && (
        <section className="space-y-4 border-t border-line pt-6">
          <h3 id="compare-chart-title" className={panelTitleClass}>{t("results.compareChartTitle")}</h3>
          {!activeAxes || !overlay ? (
            <p className="border border-dashed border-line px-6 py-10 text-center text-sm leading-relaxed text-dust">
              {t("results.compareNoSharedAxes")}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:max-w-xl">
                <AxisSelect
                  id="compare-x-axis"
                  label={t("results.xAxisLabel")}
                  value={activeAxes.x}
                  options={sharedKeys.map(labelForSeries)}
                  onChange={(value) => chooseAxis("x", value)}
                />
                <AxisSelect
                  id="compare-y-axis"
                  label={t("results.yAxisLabel")}
                  value={activeAxes.y}
                  options={sharedKeys.map(labelForSeries)}
                  onChange={(value) => chooseAxis("y", value)}
                />
              </div>

              <ul
                aria-labelledby="compare-chart-title"
                className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2"
              >
                <SeriesLegendItem
                  variant="primary"
                  label={currentLabel}
                  axis={labelForSeries(activeAxes.x)}
                  points={overlay.left}
                  emptyLabel={t("results.compareNoAxisValues", { axis: labelForSeries(activeAxes.y).name })}
                />
                <SeriesLegendItem
                  variant="overlay"
                  label={partnerLabel}
                  axis={labelForSeries(activeAxes.x)}
                  points={overlay.right}
                  emptyLabel={t("results.compareNoAxisValues", { axis: labelForSeries(activeAxes.y).name })}
                />
              </ul>

              {canPlot && overlay.xDomain && overlay.yDomain && xLabel && yLabel && (
                <div
                  className="h-80 overflow-visible sm:h-96"
                  dir="ltr"
                  role="img"
                  aria-label={t("results.compareChartSummary", {
                    y: yLabel.text,
                    x: xLabel.text,
                    a: currentLabel,
                    b: partnerLabel,
                  })}
                >
                  {/* Chart axes are physical quantities: they read left to right in both languages. */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={COMPARE_CHART_MARGIN}>
                      <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={overlay.xDomain}
                        allowDataOverflow
                        padding={COMPARE_X_AXIS_PADDING}
                        stroke={chartColors.grid}
                        tick={chartTick}
                        tickFormatter={formatAxisTick}
                        tickLine={{ stroke: chartColors.grid }}
                        label={{ value: xLabel.text, position: "insideBottom", offset: -16, style: axisTitleStyle }}
                      />
                      <YAxis
                        type="number"
                        domain={overlay.yDomain}
                        allowDataOverflow
                        stroke={chartColors.grid}
                        tick={chartTick}
                        tickFormatter={formatAxisTick}
                        tickLine={{ stroke: chartColors.grid }}
                        label={{ value: yLabel.text, angle: -90, position: "insideLeft", style: axisTitleStyle }}
                      />
                      <Tooltip
                        {...chartTooltipProps}
                        formatter={(value, name) => {
                          const formatted = typeof value === "number" ? value.toFixed(4) : value;
                          const withUnit = yLabel.unit && formatted !== undefined && formatted !== null
                            ? `${formatted} ${yLabel.unit}`
                            : formatted;
                          return [withUnit, name];
                        }}
                        labelFormatter={(label) => {
                          const formatted = formatAxisTick(label);
                          if (!xLabel.symbol && !xLabel.unit) return formatted;
                          const head = xLabel.symbol ? `${xLabel.symbol} = ` : "";
                          const tail = xLabel.unit ? ` ${xLabel.unit}` : "";
                          return `${head}${formatted}${tail}`;
                        }}
                      />
                      {overlay.left.length > 0 && (
                        <Line
                          data={overlay.left}
                          type="linear"
                          dataKey="y"
                          stroke={chartColors.experimental}
                          strokeWidth={2}
                          dot={overlay.left.length <= 1 ? { r: 3.5, fill: chartColors.experimental } : false}
                          activeDot={{ r: 4, fill: chartColors.experimental, stroke: "rgb(var(--space))" }}
                          name={currentLabel}
                          isAnimationActive={false}
                        />
                      )}
                      {overlay.right.length > 0 && (
                        <Line
                          data={overlay.right}
                          type="linear"
                          dataKey="y"
                          stroke={chartColors.overlay}
                          strokeWidth={2}
                          strokeDasharray={OVERLAY_DASH}
                          dot={overlay.right.length <= 1 ? { r: 3.5, fill: chartColors.overlay } : false}
                          activeDot={{ r: 4, fill: chartColors.overlay, stroke: "rgb(var(--space))" }}
                          name={partnerLabel}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {partner && (
        <ParameterDifferences
          title={t("results.compareChangedTitle")}
          unreadable={paramsUnreadable}
          unreadableLabel={t("results.compareParamsUnavailable")}
          noneLabel={t("results.compareNoParamDiff")}
          unchangedLabel={t("results.compareOtherParametersMatch")}
          missingLabel={t("results.compareNotRecorded")}
          currentLabel={currentLabel}
          partnerLabel={partnerLabel}
          differences={parameterComparison?.differences ?? null}
          unchangedCount={parameterComparison?.unchangedCount ?? 0}
          labelFor={labelForParameter}
        />
      )}
    </div>
  );
}
