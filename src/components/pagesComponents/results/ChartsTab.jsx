import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from "@/i18n";

function AxisSelect({ label, value, options, onChange }) {
  const { t } = useTranslation();
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
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
}) {
  const { t, pick } = useTranslation();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('results.chartConfigTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          <div>
            <Label>{t('results.physicsFormulaLabel')}</Label>
            <Select value={chartConfig.selectedFormula?.id || 'none'} onValueChange={onFormulaChange}>
              <SelectTrigger>
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
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="theoretical"
                checked={chartConfig.showTheoretical}
                onCheckedChange={(checked) => onChartConfigChange({ showTheoretical: Boolean(checked) })}
              />
              <Label htmlFor="theoretical" className="text-sm">
                {t('results.showTheoreticalLabel')}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('results.interactiveChartTitle')}</CardTitle>
          {chartConfig.selectedFormula && (
            <p className="text-sm text-slate-600 font-mono">
              {chartConfig.selectedFormula.formula}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={chartConfig.xAxis}
                  label={{ value: chartConfig.xAxis, position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  label={{ value: chartConfig.yAxis, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(4) : value,
                    name
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={chartConfig.yAxis}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={t('results.experimentalDataSeries')}
                  isAnimationActive={false}
                />
                {chartConfig.showTheoretical && chartConfig.selectedFormula && hasTheoreticalSeries && (
                  <Line
                    type="monotone"
                    dataKey="theoretical_yAxis"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={t('results.theoreticalSeries')}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
