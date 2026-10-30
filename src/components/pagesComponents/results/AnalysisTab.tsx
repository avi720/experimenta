import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useTranslation } from "@/i18n";
import { chartAxisLabelStyle, chartColors, chartTick, chartTooltipProps, panelTitleClass } from "./resultsStyles";
import type { ChartConfig, KeyStatistic, Sample } from "@/types/results";

type AnalysisTabProps = {
  statistics: KeyStatistic[];
  chartConfig: ChartConfig;
  chartData: Sample[];
};

export default function AnalysisTab({ statistics, chartConfig, chartData }: AnalysisTabProps) {
  const { t } = useTranslation();
  const comparisonFormula = chartConfig.showTheoretical ? chartConfig.selectedFormula : null;

  return (
    <>
      <section>
        <h3 className={panelTitleClass}>{t('results.statisticalAnalysisTitle')}</h3>
        <div className="mt-4 grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-px bg-line border border-line">
          {statistics.map(({ key, avg, std, min, max }) => {
            const rows: [string, number][] = [
              [t('results.averageLabel'), avg],
              [t('results.stdDevLabel'), std],
              [t('results.minLabel'), min],
              [t('results.maxLabel'), max],
            ];
            return (
              <div key={key} className="bg-space p-4">
                <h4 className="text-sm font-medium text-star break-all">{key}</h4>
                <dl className="mt-3 space-y-1.5 text-xs">
                  {rows.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3">
                      <dt className="text-dust">{label}</dt>
                      <dd className="font-mono tabular-nums text-star" dir="ltr">{value.toFixed(4)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line pt-6">
        <h3 className={panelTitleClass}>{t('results.comparisonCardTitle')}</h3>
        {comparisonFormula ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-dust">
              {t('results.comparingToFormulaPrefix')}
              <span className="font-mono text-plasma" dir="ltr">{comparisonFormula.formula}</span>
            </p>

            {/* Chart axes are physical quantities: they read left to right in both languages. */}
            <div className="h-64 sm:h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={chartData} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                  <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="theoretical_yAxis"
                    stroke={chartColors.grid}
                    tick={chartTick}
                    tickLine={{ stroke: chartColors.grid }}
                    label={{ value: t('results.theoreticalSeries'), position: 'insideBottom', offset: -16, style: chartAxisLabelStyle }}
                  />
                  <YAxis
                    dataKey={chartConfig.yAxis}
                    stroke={chartColors.grid}
                    tick={chartTick}
                    tickLine={{ stroke: chartColors.grid }}
                    label={{ value: t('results.experimentalAxis'), angle: -90, position: 'insideLeft', style: chartAxisLabelStyle }}
                  />
                  <Tooltip {...chartTooltipProps} cursor={{ stroke: chartColors.grid, strokeDasharray: '3 3' }} />
                  <Scatter
                    dataKey={chartConfig.yAxis}
                    fill={chartColors.experimental}
                    fillOpacity={0.85}
                    name={t('results.comparisonDataSeries')}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="mt-4 border border-dashed border-line px-6 py-10 text-center text-sm leading-relaxed text-dust">
            {t('results.comparisonInstructions')}
          </p>
        )}
      </section>
    </>
  );
}
