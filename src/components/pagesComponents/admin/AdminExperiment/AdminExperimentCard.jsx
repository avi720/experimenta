import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Copy, Trash2, Power, PowerOff, ShieldCheck, ShieldAlert, Code, BookOpen, Clock, Tag } from 'lucide-react';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { categoryNames } from '../../lab/labConstants';

export default function AdminExperimentCard({ experiment, index, handleDelete, handleDuplicate, toggleActive }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
                <h3 className="text-lg font-bold text-slate-800">{experiment.i18n_texts?.he?.title || experiment.slug}</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">{experiment.i18n_texts?.he?.short_desc}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5"><Code className="w-4 h-4 text-slate-400" /> <span>{experiment.slug}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> <span>{categoryNames[experiment.category]?.he || experiment.category}</span></div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> <span>נוצר: {moment(experiment.created_date).format('DD/MM/YY')}</span></div>
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
                    <Edit className="w-4 h-4 ml-2" />
                    <span>עריכה</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(experiment)}>
                  <Copy className="w-4 h-4 ml-2" />
                  <span>שכפול</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleActive(experiment)}>
                  {experiment.is_active !== false ? (
                    <><PowerOff className="w-4 h-4 ml-2" /><span>השבתה</span></>
                  ) : (
                    <><Power className="w-4 h-4 ml-2" /><span>הפעלה</span></>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  <span>מחיקה</span>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקת ניסוי</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הניסוי &quot;{experiment.i18n_texts?.he?.title || experiment.slug}&quot;?
              לא ניתן לשחזר פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDelete(experiment.id)}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
