import { useTranslation } from "@/i18n";
import { formatDisplayValue, formatRunDate } from "./resultsDomain";
import { fieldLabelClass, panelTitleClass, valueClass } from "./resultsStyles";
import type { ExperimentRun } from "@/types/models";
import type { ParamState, Sample } from "@/types/results";

type OverviewTabProps = {
  run: ExperimentRun;
  samples: Sample[];
  paramState: ParamState;
};

export default function OverviewTab({ run, samples, paramState }: OverviewTabProps) {
  const { t } = useTranslation();
  const lastTime = samples[samples.length - 1]?.time;
  const parameterEntries = Object.entries(paramState.parameters);

  const details = [
    { label: t('results.experimentTypeLabel'), value: run.experiment_slug, mono: false },
    { label: t('results.dateTimeLabel'), value: formatRunDate(run.created_date, 'dd/MM/yyyy HH:mm:ss'), mono: true },
    { label: t('results.samplesCountLabel'), value: samples.length || run.samples_count, mono: true },
    { label: t('results.durationLabel'), value: typeof lastTime === 'number' ? `${lastTime.toFixed(3)} s` : 'N/A', mono: true },
  ];

  return (
    <>
      <section>
        <h3 className={panelTitleClass}>{t('results.experimentDetailsTitle')}</h3>
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 border-t border-line">
          {details.map(({ label, value, mono }) => (
            <div key={label} className="border-b border-line py-4 pe-4">
              <dt className={fieldLabelClass}>{label}</dt>
              <dd className={`mt-1.5 break-all ${mono ? `${valueClass} text-[15px]` : 'text-[15px] font-medium text-star'}`} dir={mono ? 'ltr' : undefined}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h3 className={panelTitleClass}>{t('results.experimentParametersTitle')}</h3>
        {paramState.error ? (
          <p className="mt-4 text-sm text-danger">
            {t('results.corruptedParamsInline')}
          </p>
        ) : parameterEntries.length === 0 ? (
          <p className="mt-4 text-sm text-dust">
            {t('results.noParamsRecorded')}
          </p>
        ) : (
          <dl className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-px bg-line border border-line">
            {parameterEntries.map(([key, value]) => (
              <div key={key} className="bg-space px-4 py-3.5">
                <dt className="text-xs text-dust break-all">{key}</dt>
                <dd className={`mt-1 text-lg break-all ${valueClass}`} dir="ltr">{formatDisplayValue(value, 3)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </>
  );
}
