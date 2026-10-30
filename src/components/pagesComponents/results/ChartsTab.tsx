import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from "@/i18n";
import {
  chartAxisLabelStyle, chartColors, chartTick, chartTooltipProps, fieldLabelClass, panelTitleClass, selectTriggerClass,
} from "./resultsStyles";
import type { ChartConfig, PhysicsFormula, Sample } from "@/types/results";

type AxisSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

type ChartsTabProps = {
  chartConfig: ChartConfig;
  axisOptions: string[];
  formulas: PhysicsFormula[];
  chartData: Sample[];
  hasTheoreticalSeries: boolean;
  onChartConfigChange: (patch: Partial<ChartConfig>) => void;
  onFormulaChange: (formulaId: string) => void;
};

function AxisSelect({ label, value, options, onChange }: AxisSelectProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label className={fieldLabelClass}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((key) => (
            <SelectItem key={String(key)} value={String(key)}>
              {key.startsWith('theoretical_') ? t('results.theoreticalPrefix', { field: key.replace('theoretical_', '') }) : key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ChartsTab({
  chartConfig, axisOptions, formulas, chartData, hasTheoreticalSeries, onChartConfigChange, onFormulaChange,
}: ChartsTabProps) {
  const { t, pick } = useTranslation();

  return (
    <>
      <section>
        <h3 className={panelTitleClass}>{t('results.chartConfigTitle')}</h3>
        <div className="mt-4 grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4">
          <AxisSelect
            label={t('results.xAxisLabel')}
            value={chartConfig.xAxis}
            options={axisOptions}
            onChange={(value) => onChartConfigChange({ xAxis: value })}
          />
          <AxisSelect
            label={t('results.yAxisLabel')}
            value={chartConfig.yAxis}
            options={axisOptions}
            onChange={(value) => onChartConfigChange({ yAxis: value })}
          />

          <div className="space-y-2">
            <Label className={fieldLabelClass}>{t('results.physicsFormulaLabel')}</Label>
            <Select value={chartConfig.selectedFormula?.id || 'none'} onValueChange={onFormulaChange}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder={t('results.selectFormulaPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none')}</SelectItem>
                {formulas.map((formula) => (
                  <SelectItem key={String(formula.id)} value={String(formula.id)}>
                    {pick(formula, formula.name_he)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="flex h-10 items-center gap-2">
              <Checkbox
                id="theoretical"
                checked={chartConfig.showTheoretical}
                onCheckedChange={(checked) => onChartConfigChange({ showTheoretical: Boolean(checked) })}
                className="border-dust/60 data-[state=checked]:border-plasma data-[state=checked]:bg-plasma data-[state=checked]:text-[#1C0F04] focus-visible:ring-blueshift"
              />
              <Label htmlFor="theoretical" className="text-sm font-normal text-star cursor-pointer">
                {t('results.showTheoreticalLabel')}
              </Label>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className={panelTitleClass}>{t('results.interactiveChartTitle')}</h3>
          {chartConfig.selectedFormula && (
            <p className="text-sm text-plasma font-mono" dir="ltr">
              {chartConfig.selectedFormula.formula}
            </p>
          )}
        </div>
        {/* Chart axes are physical quantities: they read left to right in both languages. */}
        <div className="mt-4 h-80 sm:h-96" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey={chartConfig.xAxis}
                stroke={chartColors.grid}
                tick={chartTick}
                tickLine={{ stroke: chartColors.grid }}
                label={{ value: chartConfig.xAxis, position: 'insideBottom', offset: -16, style: chartAxisLabelStyle }}
              />
              <YAxis
                stroke={chartColors.grid}
                tick={chartTick}
                tickLine={{ stroke: chartColors.grid }}
                label={{ value: chartConfig.yAxis, angle: -90, position: 'insideLeft', style: chartAxisLabelStyle }}
              />
              <Tooltip
                {...chartTooltipProps}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(4) : value,
                  name
                ]}
              />
              <Legend verticalAlign="top" height={32} iconType="plainline" wrapperStyle={{ fontSize: 12, color: chartColors.tick }} />
              <Line
                type="monotone"
                dataKey={chartConfig.yAxis}
                stroke={chartColors.experimental}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: chartColors.experimental, stroke: 'rgb(var(--space))' }}
                name={t('results.experimentalDataSeries')}
                isAnimationActive={false}
              />
              {chartConfig.showTheoretical && chartConfig.selectedFormula && hasTheoreticalSeries && (
                <Line
                  type="monotone"
                  dataKey="theoretical_yAxis"
                  stroke={chartColors.theoretical}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name={t('results.theoreticalSeries')}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
