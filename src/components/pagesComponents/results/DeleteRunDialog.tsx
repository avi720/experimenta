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

type DeleteRunDialogProps = {
  open: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteRunDialog({ open, isDeleting, onCancel, onConfirm }: DeleteRunDialogProps) {
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
            className="border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25 focus-visible:ring-danger"
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
