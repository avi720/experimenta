import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Copy, Trash2, Power, PowerOff } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { categoryNames } from '../../lab/labConstants';
import StatusPill from '../StatusPill';
import { iconButtonClass, type PillTone } from '../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentTemplateData, LocalizedTexts } from '@/types/experiment';

type AdminExperimentCardProps = {
  experiment: ExperimentTemplateData;
  index: number;
  handleDelete: (experimentId: string) => void;
  handleDuplicate: (experiment: ExperimentTemplateData) => void;
  toggleActive: (experiment: ExperimentTemplateData) => void;
};

const accessPills: Record<string, { tone: PillTone; key: string }> = {
  public: { tone: 'neutral', key: 'admin.list.accessPublic' },
  registered: { tone: 'info', key: 'admin.list.accessRegistered' },
  premium: { tone: 'premium', key: 'admin.list.accessPremium' },
};

export default function AdminExperimentCard({ experiment, index, handleDelete, handleDuplicate, toggleActive }: AdminExperimentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { t, pick, dir } = useTranslation();

  const localizedTexts = pick<LocalizedTexts | null>(experiment.i18n_texts, null);
  const title = localizedTexts?.title || experiment.slug;
  const shortDesc = localizedTexts?.short_desc || '';
  const categoryLabel = pick(experiment.category ? categoryNames[experiment.category] : undefined, experiment.category ?? '');
  const isActive = experiment.is_active !== false;
  const access = accessPills[experiment.access_level || 'public'] ?? accessPills.public;
  const createdLabel = experiment.created_date ? format(new Date(experiment.created_date), 'dd/MM/yy') : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: Math.min(index, 12) * 0.03 }}
    >
      <div
        className={`grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_7rem_7rem_6rem_2.5rem] items-start md:items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-space-raised/60 ${isActive ? '' : 'opacity-60'}`}
      >
        {/* Identity */}
        <div className="min-w-0">
          <Link
            to={createPageUrl(`AdminExperimentForm?id=${experiment.id}`)}
            className="focus-ring rounded-sm text-[17px] leading-snug text-star hover:text-blueshift"
          >
            {title}
          </Link>
          {shortDesc && <p className="mt-1 text-sm leading-relaxed text-dust line-clamp-2">{shortDesc}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dust">
            <span className="font-mono text-dust" dir="ltr">{experiment.slug}</span>
            {categoryLabel && (
              <>
                <span aria-hidden="true" className="h-3 w-px bg-line" />
                <span>{categoryLabel}</span>
              </>
            )}
            {experiment.tags && experiment.tags.length > 0 && (
              <>
                <span aria-hidden="true" className="h-3 w-px bg-line" />
                {experiment.tags.map(tag => (
                  <span key={tag} className="rounded-full border border-line px-2 py-px text-[11px] text-dust">{tag}</span>
                ))}
              </>
            )}
          </div>
          {/* Small screens: the column cells collapse into this line. */}
          <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
            <StatusPill tone={isActive ? 'success' : 'warning'} dot>
              {isActive ? t('admin.list.activeStat') : t('admin.list.inactiveStat')}
            </StatusPill>
            <StatusPill tone={access.tone}>{t(access.key)}</StatusPill>
            <span className="text-xs text-dust">
              {t('admin.list.createdPrefix')} <span className="font-mono tabular-nums">{createdLabel}</span>
            </span>
          </div>
        </div>

        <div className="hidden md:block">
          <StatusPill tone={isActive ? 'success' : 'warning'} dot>
            {isActive ? t('admin.list.activeStat') : t('admin.list.inactiveStat')}
          </StatusPill>
        </div>
        <div className="hidden md:block">
          <StatusPill tone={access.tone}>{t(access.key)}</StatusPill>
        </div>
        <div className="hidden md:block font-mono text-sm tabular-nums text-dust">{createdLabel}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`${iconButtonClass} flex-shrink-0`}
              aria-label={t('admin.list.actionsFor', { title })}
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-line bg-space-raised text-star">
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`AdminExperimentForm?id=${experiment.id}`)}>
                <Edit className="w-4 h-4 me-2" />
                <span>{t('common.edit')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(experiment)}>
              <Copy className="w-4 h-4 me-2" />
              <span>{t('common.duplicate')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleActive(experiment)}>
              {isActive ? (
                <><PowerOff className="w-4 h-4 me-2" /><span>{t('common.deactivate')}</span></>
              ) : (
                <><Power className="w-4 h-4 me-2" /><span>{t('common.activate')}</span></>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-line" />
            <DropdownMenuItem
              className="text-danger focus:text-red-200 focus:bg-danger/10"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 me-2" />
              <span>{t('common.delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir={dir} className="border-line bg-space-raised">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-normal text-star">{t('admin.list.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-dust">
              {t('admin.list.confirmDeleteDescription', { title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-line bg-transparent text-star hover:bg-space hover:text-star">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/90 text-white hover:bg-red-500"
              onClick={() => handleDelete(experiment.id)}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
