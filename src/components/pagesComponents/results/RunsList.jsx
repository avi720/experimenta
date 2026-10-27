import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";
import { formatRunDate } from "./resultsDomain";

export default function RunsList({ runs, showLoadFailure, selectedRunId, onSelectRun, onRequestDelete, onRetry }) {
  const { t } = useTranslation();

  let content;
  if (showLoadFailure) {
    content = (
      <div className="text-center py-8 space-y-3">
        <p className="text-red-600 text-sm">
          {t('results.loadingRunsFailedShort')}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  } else if (runs.length === 0) {
    content = (
      <p className="text-slate-500 text-center py-8">
        {t('results.noSavedResults')}
      </p>
    );
  } else {
    content = runs.map((run) => (
      <motion.div
        key={run.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg border cursor-pointer transition-all ${
          selectedRunId === run.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => onSelectRun(run)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{run.experiment_slug}</h4>
            <p className="text-xs text-slate-500">
              {formatRunDate(run.created_date, 'dd/MM/yyyy HH:mm')}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {run.samples_count} {t('results.samplesUnit')}
            </p>
          </div>
          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('results.viewRunAria')}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRun(run);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('results.deleteRunAria')}
              className="text-red-500 hover:bg-red-100 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(run);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    ));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('results.savedRunsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {content}
      </CardContent>
    </Card>
  );
}
