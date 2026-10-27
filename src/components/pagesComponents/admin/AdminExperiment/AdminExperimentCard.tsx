import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Copy, Trash2, Power, PowerOff, ShieldCheck, ShieldAlert, Code, BookOpen, Clock, Tag } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { categoryNames } from '../../lab/labConstants';
import { useTranslation } from '@/i18n';
import type { ExperimentTemplateData, LocalizedTexts } from '@/types/experiment';

type AdminExperimentCardProps = {
  experiment: ExperimentTemplateData;
  index: number;
  handleDelete: (experimentId: string) => void;
  handleDuplicate: (experiment: ExperimentTemplateData) => void;
  toggleActive: (experiment: ExperimentTemplateData) => void;
};

export default function AdminExperimentCard({ experiment, index, handleDelete, handleDuplicate, toggleActive }: AdminExperimentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { t, pick, dir } = useTranslation();

  const localizedTexts = pick<LocalizedTexts | null>(experiment.i18n_texts, null);
  const title = localizedTexts?.title || experiment.slug;
  const shortDesc = localizedTexts?.short_desc || '';
  const categoryLabel = pick(experiment.category ? categoryNames[experiment.category] : undefined, experiment.category ?? '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${experiment.is_active === false ? 'bg-slate-50 opacity-70' : 'bg-white hover:shadow-lg'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {experiment.is_active !== false ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                )}
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">{shortDesc}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5"><Code className="w-4 h-4 text-slate-400" /> <span>{experiment.slug}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> <span>{categoryLabel}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> <span>{t('admin.list.createdPrefix')} {experiment.created_date ? format(new Date(experiment.created_date), 'dd/MM/yy') : ''}</span></div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                  {experiment.is_active !== false ? (
                    <><PowerOff className="w-4 h-4 me-2" /><span>{t('common.deactivate')}</span></>
                  ) : (
                    <><Power className="w-4 h-4 me-2" /><span>{t('common.activate')}</span></>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 me-2" />
                  <span>{t('common.delete')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {experiment.tags && experiment.tags.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                {experiment.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.list.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.list.confirmDeleteDescription', { title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
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
