import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { secondaryButtonClass } from '../adminStyles';
import { useTranslation } from '@/i18n';

export default function NoAdminExperimentsFound({ clearFilters }: { clearFilters: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-y border-line py-20 text-center"
    >
      {/* An empty orbit: nothing in the field of view. */}
      <svg viewBox="0 0 64 32" className="mx-auto mb-6 h-8 w-16" aria-hidden="true" focusable="false">
        <ellipse cx="32" cy="16" rx="28" ry="9" fill="none" stroke="rgb(var(--line))" strokeWidth="1.5" strokeDasharray="3 4" />
        <circle cx="32" cy="16" r="4" fill="none" stroke="rgb(var(--dust) / 0.6)" strokeWidth="1.5" />
      </svg>
      <h3 className="text-[22px] font-light text-star">{t('admin.list.noExperimentsTitle')}</h3>
      <p className="mx-auto mt-2 max-w-[28rem] text-[15px] leading-relaxed text-dust">{t('admin.list.noExperimentsSubtitle')}</p>
      <Button variant="outline" className={`${secondaryButtonClass} mt-6`} onClick={clearFilters}>
        {t('common.clearFilters')}
      </Button>
    </motion.div>
  );
}
