import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { accessLevelOptions } from './adminFormConstants';
import { categoryNames } from '@/components/pagesComponents/lab/labConstants';
import { useTranslation } from '@/i18n';

export default function GeneralSettingsTab({ experiment, handleInputChange, errors }) {
  const { t, pick } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.form.general.cardTitle')}</CardTitle>
        <CardDescription>{t('admin.form.general.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-base font-medium">{t('admin.form.general.slugLabel')}</Label>
          <Input
            value={experiment.slug}
            onChange={e => handleInputChange('slug', e.target.value)}
            placeholder="free-fall, sho, quantum-tunneling"
            className={errors.slug ? 'border-red-500' : ''}
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1" role="alert">{errors.slug}</p>}
          <p className="text-xs text-slate-500 mt-1">
            {t('admin.form.general.slugHint')}
          </p>
        </div>

        <div>
          <Label className="text-base font-medium">{t('admin.form.general.categoryLabel')}</Label>
          <Select value={experiment.category} onValueChange={val => handleInputChange('category', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryNames).map(([value]) => (
                <SelectItem key={value} value={value}>
                  {pick(categoryNames[value], value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-medium">{t('admin.form.general.visualizationTypeLabel')}</Label>
          <Select value={experiment.visualization_type} onValueChange={val => handleInputChange('visualization_type', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2d">{t('admin.form.general.vis2d')}</SelectItem>
              <SelectItem value="3d">{t('admin.form.general.vis3d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-medium">{t('admin.form.general.accessLevelLabel')}</Label>
          <Select
            value={experiment.access_level || 'public'}
            onValueChange={val => handleInputChange('access_level', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accessLevelOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.i18nKey ? t(option.i18nKey) : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Switch
            checked={experiment.is_active}
            onCheckedChange={val => handleInputChange('is_active', val)}
          />
          <Label className="text-base font-medium">{t('admin.form.general.activeExperimentLabel')}</Label>
        </div>
      </CardContent>
    </Card>
  );
}
