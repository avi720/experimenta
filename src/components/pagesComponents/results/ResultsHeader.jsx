import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function ResultsHeader({ hasLoadError, onRefresh }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {t('results.title')}
          </h1>
          <p className="text-slate-600 mt-2">
            {t('results.subtitle')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {hasLoadError && (
        <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <AlertTitle>
                {t('results.loadErrorTitle')}
              </AlertTitle>
              <AlertDescription>
                {t('results.loadErrorDescription')}
              </AlertDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} className="self-start sm:self-center gap-2 bg-white text-slate-900 hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
            {t('common.tryAgain')}
          </Button>
        </Alert>
      )}
    </>
  );
}
