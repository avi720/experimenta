import { Textarea } from '@/components/ui/textarea';
import FormSection from './FormSection';
import { useTranslation } from '@/i18n';
import type { ExperimentFormData } from '@/types/experiment';

export default function RawJsonViewer({ experiment }: { experiment: ExperimentFormData }) {
  const { t } = useTranslation();

  return (
    <FormSection title={t('admin.form.advanced.rawJsonTitle')} description={t('admin.form.advanced.rawJsonDescription')}>
      <Textarea
        value={JSON.stringify(experiment, null, 2)}
        readOnly
        dir="ltr"
        spellCheck={false}
        rows={16}
        aria-label={t('admin.form.advanced.rawJsonTitle')}
        className="border-line bg-hole/60 font-mono text-xs leading-relaxed text-dust"
      />
    </FormSection>
  );
}
