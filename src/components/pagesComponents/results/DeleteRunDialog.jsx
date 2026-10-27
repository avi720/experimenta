import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/i18n";

export default function DeleteRunDialog({ open, isDeleting, onCancel, onConfirm }) {
  const { t, dir } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isDeleting) onCancel();
      }}
    >
      <AlertDialogContent dir={dir}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('results.confirmDeleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('results.confirmDeleteDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
