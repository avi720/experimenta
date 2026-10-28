import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/i18n";
import { errorBannerClass, secondaryButtonClass } from "./resultsStyles";

type ResultsHeaderProps = {
  hasLoadError: boolean;
  onRefresh: () => void;
};

export default function ResultsHeader({ hasLoadError, onRefresh }: ResultsHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-line pb-8">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-light leading-[1.08] tracking-[-0.01em] text-star">
            {t('results.title')}
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-dust">
            {t('results.subtitle')}
          </p>
        </div>

        <button type="button" onClick={onRefresh} className={`${secondaryButtonClass} self-start sm:self-auto`}>
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {t('common.refresh')}
        </button>
      </div>

      {hasLoadError && (
        <div
          role="alert"
          className={`${errorBannerClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md px-4 py-3`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h5 className="font-medium leading-none">
                {t('results.loadErrorTitle')}
              </h5>
              <p className="mt-1.5 text-sm text-red-300/80">
                {t('results.loadErrorDescription')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onRefresh} className={`${secondaryButtonClass} self-start sm:self-center`}>
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t('common.tryAgain')}
          </button>
        </div>
      )}
    </>
  );
}
