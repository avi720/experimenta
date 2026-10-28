import { useTranslation } from '@/i18n';
import type { FormTab } from '@/types/admin';

const tabsConfig: { value: FormTab; key: string }[] = [
  { value: 'general', key: 'generalShort' },
  { value: 'content', key: 'content' },
  { value: 'parameters', key: 'parameters' },
  { value: 'presets', key: 'presets' },
  { value: 'advanced', key: 'advanced' }
];

const pad = (n: number) => String(n).padStart(2, '0');

/** A slim segmented track: passed steps in blueshift, the current one in plasma. */
export default function ExperimentFormProgressIndicator({ currentTab }: { currentTab: string }) {
  const { t } = useTranslation();
  const currentIndex = tabsConfig.findIndex(tab => tab.value === currentTab);
  const current = tabsConfig[currentIndex];

  return (
    <div className="flex items-center gap-4">
      <ol className="flex flex-1 items-center gap-1.5" aria-label={t('admin.form.stepOf', { current: currentIndex + 1, total: tabsConfig.length })}>
        {tabsConfig.map((tab, index) => (
          <li
            key={tab.value}
            aria-current={index === currentIndex ? 'step' : undefined}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              index === currentIndex ? 'bg-plasma' : index < currentIndex ? 'bg-blueshift/70' : 'bg-line'
            }`}
          >
            <span className="sr-only">{t(`admin.form.tabs.${tab.key}`)}</span>
          </li>
        ))}
      </ol>
      <p className="flex flex-shrink-0 items-baseline gap-2 text-xs text-dust">
        <span className="font-mono tabular-nums" dir="ltr">
          <span className="text-star">{pad(currentIndex + 1)}</span> / {pad(tabsConfig.length)}
        </span>
        {current && <span className="hidden sm:inline">{t(`admin.form.tabs.${current.key}`)}</span>}
      </p>
    </div>
  );
}
