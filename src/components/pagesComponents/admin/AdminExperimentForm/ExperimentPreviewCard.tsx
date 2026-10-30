import { categoryNames } from '@/components/pagesComponents/lab/labConstants';
import { useTranslation } from '@/i18n';
import type { ExperimentFormData, LocalizedTexts } from '@/types/experiment';

/** How the experiment reads in the catalogue. */
export default function ExperimentPreviewCard({ experiment }: { experiment: ExperimentFormData }) {
  const { t, pick } = useTranslation();
  const localizedTexts = pick<LocalizedTexts | null>(experiment.i18n_texts, null);
  const title = localizedTexts?.title || t('admin.form.advanced.untitled');
  const shortDesc = localizedTexts?.short_desc || t('admin.form.advanced.noDescription');
  const categoryLabel = pick(experiment.category ? categoryNames[experiment.category] : undefined, experiment.category ?? '');

  return (
    <div className="rounded-md border border-line bg-space-raised/50 p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[19px] font-light leading-snug text-star">{title}</h3>
          {categoryLabel && (
            <span className="whitespace-nowrap rounded-full border border-line px-2.5 py-0.5 text-xs text-dust">{categoryLabel}</span>
          )}
        </div>

        <p className="mt-2 text-sm leading-relaxed text-dust">{shortDesc}</p>

        {(experiment.tags || []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(experiment.tags || []).map((tag) => (
              <span key={tag} className="rounded-full border border-line px-2 py-px text-[11px] text-dust">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-1 border-t border-line pt-3 text-xs text-dust">
          <div>{t('admin.form.advanced.parametersCount', { count: experiment.parameters?.length || 0 })}</div>
          <div>{t('admin.form.advanced.presetsCount', { count: experiment.presets?.length || 0 })}</div>
        </div>
      </div>
    </div>
  );
}
