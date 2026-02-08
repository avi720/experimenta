import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { categoryOptions, /*engineOptions*/ } from './adminFormConstants';

export default function GeneralSettingsTab({ experiment, handleInputChange, errors }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטים כלליים</CardTitle>
        <CardDescription>הגדרות בסיסיות של הניסוי</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-base font-medium">מזהה ניסוי (Slug) *</Label>
          <Input 
            value={experiment.slug} 
            onChange={e => handleInputChange('slug', e.target.value)}
            placeholder="free-fall, sho, quantum_1d"
            className={errors.slug ? 'border-red-500' : ''}
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          <p className="text-xs text-slate-500 mt-1">
            מזהה ייחודי באנגלית בלבד (אותיות קטנות, מספרים, מקפים)
          </p>
        </div>

        <div>
          <Label className="text-base font-medium">קטגוריה</Label>
          <Select value={experiment.category} onValueChange={val => handleInputChange('category', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/*<div>
          <Label className="text-base font-medium">מנוע סימולציה</Label>
          <Select value={experiment.engine} onValueChange={val => handleInputChange('engine', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {engineOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>*/}

        <div>
          <Label className="text-base font-medium">סוג תצוגה</Label>
          <Select value={experiment.visualization_type} onValueChange={val => handleInputChange('visualization_type', val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2d">דו מימדי (2D)</SelectItem>
              <SelectItem value="3d">תלת מימדי (3D)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Switch
            checked={experiment.is_active}
            onCheckedChange={val => handleInputChange('is_active', val)}
          />
          <Label className="text-base font-medium">ניסוי פעיל</Label>
        </div>
      </CardContent>
    </Card>
  );
}