import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export default function NoAdminExperimentsFound({ clearFilters }: { clearFilters: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 bg-slate-50 rounded-lg"
    >
      <h3 className="text-xl font-semibold text-slate-700">{t('admin.list.noExperimentsTitle')}</h3>
      <p className="text-slate-500 mt-2">{t('admin.list.noExperimentsSubtitle')}</p>
      <Button variant="outline" className="mt-6" onClick={clearFilters}>
        {t('common.clearFilters')}
      </Button>
    </motion.div>
  );
}
