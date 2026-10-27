import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { formatDisplayValue, formatRunDate } from "./resultsDomain";

export default function OverviewTab({ run, samples, paramState }) {
  const { t } = useTranslation();
  const lastTime = samples[samples.length - 1]?.time;
  const parameterEntries = Object.entries(paramState.parameters);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('results.experimentDetailsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-slate-500">{t('results.experimentTypeLabel')}</Label>
            <p className="font-medium">{run.experiment_slug}</p>
          </div>
          <div>
            <Label className="text-sm text-slate-500">{t('results.dateTimeLabel')}</Label>
            <p className="font-medium">{formatRunDate(run.created_date, 'dd/MM/yyyy HH:mm:ss')}</p>
          </div>
          <div>
            <Label className="text-sm text-slate-500">{t('results.samplesCountLabel')}</Label>
            <p className="font-medium">{samples.length || run.samples_count}</p>
          </div>
          <div>
            <Label className="text-sm text-slate-500">{t('results.durationLabel')}</Label>
            <p className="font-medium">
              {typeof lastTime === 'number' ? `${lastTime.toFixed(3)}s` : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('results.experimentParametersTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {paramState.error ? (
            <p className="text-sm text-red-600">
              {t('results.corruptedParamsInline')}
            </p>
          ) : parameterEntries.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t('results.noParamsRecorded')}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {parameterEntries.map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500 uppercase">{key}</Label>
                  <p className="font-mono text-lg break-all">{formatDisplayValue(value, 3)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
