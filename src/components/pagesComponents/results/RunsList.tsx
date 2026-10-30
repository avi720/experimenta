import type { ReactNode } from "react";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";
import { formatRunDate } from "./resultsDomain";
import { panelClass, panelTitleClass, secondaryButtonClass } from "./resultsStyles";
import type { ExperimentRun } from "@/types/models";

type RunsListProps = {
  runs: ExperimentRun[];
  showLoadFailure: boolean;
  selectedRunId: string | undefined;
  onSelectRun: (run: ExperimentRun) => void;
  onRequestDelete: (run: ExperimentRun) => void;
  onRetry: () => void;
};

const iconButtonClass =
  "focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-dust transition-colors";

export default function RunsList({ runs, showLoadFailure, selectedRunId, onSelectRun, onRequestDelete, onRetry }: RunsListProps) {
  const { t } = useTranslation();

  let content: ReactNode;
  if (showLoadFailure) {
    content = (
      <div className="px-5 py-10 text-center space-y-4">
        <p className="text-danger text-sm">
          {t('results.loadingRunsFailedShort')}
        </p>
        <button type="button" onClick={onRetry} className={secondaryButtonClass}>
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {t('common.tryAgain')}
        </button>
      </div>
    );
  } else if (runs.length === 0) {
    content = (
      <p className="px-5 py-10 text-sm text-dust text-center">
        {t('results.noSavedResults')}
      </p>
    );
  } else {
    content = (
      <ul className="divide-y divide-line/70">
        {runs.map((run) => {
          const isSelected = selectedRunId === run.id;
          return (
            <motion.li
              key={run.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              aria-current={isSelected ? 'true' : undefined}
              className={`relative cursor-pointer transition-colors ${
                isSelected ? 'bg-space-raised' : 'hover:bg-space-raised/60'
              }`}
              onClick={() => onSelectRun(run)}
            >
              {/* Plasma marker on the reading-start edge: the active line, as in the header nav. */}
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 start-0 w-0.5 ${isSelected ? 'bg-plasma' : 'bg-transparent'}`}
              />
              <div className="flex items-start justify-between gap-3 ps-5 pe-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <h4 className={`truncate text-sm font-medium ${isSelected ? 'text-star' : 'text-star/90'}`}>
                    {run.experiment_slug}
                  </h4>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-dust">
                    <span className="font-mono tabular-nums" dir="ltr">
                      {formatRunDate(run.created_date, 'dd/MM/yyyy HH:mm')}
                    </span>
                    <span>
                      <span className="font-mono tabular-nums">{run.samples_count}</span> {t('results.samplesUnit')}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={t('results.viewRunAria')}
                    className={`${iconButtonClass} hover:bg-space hover:text-blueshift`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRun(run);
                    }}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={t('results.deleteRunAria')}
                    className={`${iconButtonClass} hover:bg-danger/10 hover:text-danger`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(run);
                    }}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    );
  }

  return (
    <aside className={`${panelClass} lg:sticky lg:top-24`} aria-labelledby="saved-runs-title">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="saved-runs-title" className={panelTitleClass}>{t('results.savedRunsTitle')}</h2>
        {!showLoadFailure && runs.length > 0 && (
          <span className="font-mono tabular-nums text-xs text-dust">{runs.length}</span>
        )}
      </div>
      <div className="max-h-[28rem] lg:max-h-[calc(100vh-12rem)] overflow-y-auto">
        {content}
      </div>
    </aside>
  );
}
