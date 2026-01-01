import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Beaker, TrendingUp } from "lucide-react";

export default function WhatIsNew() {
  const updates = [
    {
      date: "ינואר 2025",
      title: "סימולציית מנהור קוונטי",
      description: "הוספנו ניסוי חדש המדגים את תופעת המנהור הקוונטי עם ויזואליזציה תלת-מימדית מתקדמת.",
      icon: Zap,
      badge: "חדש"
    },
    {
      date: "דצמבר 2024",
      title: "ניסוי התאבכות דו-סדקית",
      description: "ניסוי קלאסי המדגים את תכונות הגל והחלקיק של האור.",
      icon: Beaker,
      badge: "עדכון"
    },
    {
      date: "נובמבר 2024",
      title: "מערכת שמירת תוצאות",
      description: "כעת ניתן לשמור ולנתח את תוצאות הניסויים שלך, להשוות בין ריצות שונות ולייצא נתונים.",
      icon: TrendingUp,
      badge: "תכונה"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12" dir="rtl">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">מה חדש ב-Experimenta</h1>
        </div>
        <p className="text-xl text-slate-600">
          עדכונים אחרונים, תכונות חדשות ושיפורים
        </p>
      </div>

      <div className="space-y-6">
        {updates.map((update, index) => {
          const Icon = update.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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

      <Card className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle>בלוג המדע שלנו</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed">
            עקוב אחר הבלוג שלנו לקבלת מאמרים מעמיקים, טיפים לשימוש במערכת, 
            והסברים מפורטים על ניסויים ותופעות פיזיקליות.
          </p>
          <p className="text-slate-500 text-sm mt-2">בקרוב - הבלוג בבנייה</p>
        </CardContent>
      </Card>
    </div>
  );
}