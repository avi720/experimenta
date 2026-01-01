import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen, Shield, Lock, Search, Globe } from "lucide-react";

export default function Resources() {
  const resourceCategories = [
    {
      title: "מסמכים ודוחות",
      icon: FileText,
      description: "גישה למדריכי משתמש, תיעוד טכני ודוחות מחקר",
      items: ["מדריך למשתמש", "תיעוד API", "מאמרים אקדמיים"]
    },
    {
      title: "גישה ציבורית",
      icon: Globe,
      description: "משאבים פתוחים וחומרים זמינים לקהל הרחב",
      items: ["ניסויים בסיסיים", "הדרכות וידאו", "שאלות ותשובות"]
    },
    {
      title: "אבטחת מחקר",
      icon: Shield,
      description: "הנחיות ושיטות עבודה לשמירה על בטיחות המחקר",
      items: ["פרוטוקולי אבטחה", "הנחיות לחוקרים", "דיווח אירועים"]
    },
    {
      title: "יושרה מדעית",
      icon: BookOpen,
      description: "עקרונות ונהלים לשמירה על יושרה מדעית",
      items: ["קוד אתי", "תקני מחקר", "נהלי ביקורת"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12" dir="rtl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">משאבים</h1>
        <p className="text-xl text-slate-600">
          כלים, מסמכים ומידע לתמיכה במחקר ובלמידה שלך
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {resourceCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </div>
                <p className="text-slate-600 text-sm">{category.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item, i) => (
                    <li key={i} className="text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              מדיניות פרטיות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">
              מידע על איך אנחנו מגנים על הפרטיות והנתונים שלך.
            </p>
            <a 
              href="/PrivacyPolicy" 
              className="text-blue-600 hover:underline font-medium"
            >
              קרא את מדיניות הפרטיות המלאה ←
            </a>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              תנאי שירות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">
              התנאים וההגבלות לשימוש בפלטפורמת Experimenta.
            </p>
            <a 
              href="/TermsOfService" 
              className="text-green-600 hover:underline font-medium"
            >
              קרא את תנאי השירות המלאים ←
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Research.gov
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700">
            פורטל מרכזי לניהול מענקי מחקר, הגשת הצעות ומעקב אחר פרויקטים מחקריים.
          </p>
          <p className="text-slate-500 text-sm mt-2">קישור חיצוני - בקרוב</p>
        </CardContent>
      </Card>
    </div>
  );
}