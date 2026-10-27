import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Beaker, TrendingUp } from "lucide-react";
import { useTranslation } from "@/i18n";

const UPDATE_ICONS = [Zap, Beaker, TrendingUp];

export default function WhatIsNew() {
  const { t, dir } = useTranslation();
  const updates = t("whatsNew.updates") || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12" dir={dir}>
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">{t("whatsNew.title")}</h1>
        </div>
        <p className="text-xl text-slate-600">
          {t("whatsNew.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {Array.isArray(updates) && updates.map((update, index) => {
          const Icon = UPDATE_ICONS[index % UPDATE_ICONS.length] || Sparkles;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{update.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{update.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    {update.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{update.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
