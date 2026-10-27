import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/i18n';
import type { ExperimentFormData } from '@/types/experiment';

export default function RawJsonViewer({ experiment }: { experiment: ExperimentFormData }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.form.advanced.rawJsonTitle')}</CardTitle>
        <CardDescription>
          {t('admin.form.advanced.rawJsonDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
          value={JSON.stringify(experiment, null, 2)} 
          readOnly
          rows={12}
          className="font-mono text-xs bg-slate-50"
        />
      </CardContent>
    </Card>
  );
}
