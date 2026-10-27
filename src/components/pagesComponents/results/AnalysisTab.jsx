import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useTranslation } from "@/i18n";

export default function AnalysisTab({ statistics, chartConfig, chartData }) {
  const { t } = useTranslation();
  const showComparison = Boolean(chartConfig.selectedFormula && chartConfig.showTheoretical);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('results.statisticalAnalysisTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statistics.map(({ key, avg, std, min, max }) => (
              <div key={key} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">{key}</h4>
                <div className="space-y-1 text-xs">
                  <p><span className="text-slate-500">{t('results.averageLabel')}</span> {avg.toFixed(4)}</p>
                  <p><span className="text-slate-500">{t('results.stdDevLabel')}</span> {std.toFixed(4)}</p>
                  <p><span className="text-slate-500">{t('results.minLabel')}</span> {min.toFixed(4)}</p>
                  <p><span className="text-slate-500">{t('results.maxLabel')}</span> {max.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('results.comparisonCardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {showComparison ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                {t('results.comparingToFormulaPrefix')}
                <span className="font-mono">{chartConfig.selectedFormula.formula}</span>
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="theoretical_yAxis"
                      label={{ value: t('results.theoreticalSeries'), position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis
                      dataKey={chartConfig.yAxis}
                      label={{ value: t('results.experimentalAxis'), angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Scatter
                      dataKey={chartConfig.yAxis}
                      fill="#3b82f6"
                      name={t('results.comparisonDataSeries')}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              {t('results.comparisonInstructions')}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
