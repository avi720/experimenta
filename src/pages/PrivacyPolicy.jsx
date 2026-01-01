import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">הערת טיוטה</h3>
            <p className="text-sm text-amber-800">
              מדיניות פרטיות זו היא טיוטה ראשונית. יש לבדוק ולאשר את התוכן עם יועץ משפטי 
              לפני פרסום סופי. הטקסט הבא הוא כללי ואינו מהווה ייעוץ משפטי.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">מדיניות פרטיות</h1>
        </div>
        <p className="text-slate-600">עודכן לאחרונה: ינואר 2025</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              מבוא
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              ב-Experimenta, אנו מחויבים להגן על הפרטיות שלך ולשמור על המידע האישי שלך בצורה אחראית. 
              מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך בעת השימוש בפלטפורמה שלנו.
            </p>
            <p className="text-slate-700 leading-relaxed">
              השימוש בשירותי Experimenta מהווה הסכמה למדיניות פרטיות זו.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              מידע שאנו אוספים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">מידע אישי</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
                <li>שם מלא וכתובת דוא"ל</li>
                <li>מידע על החשבון והאימות</li>
                <li>העדפות משתמש והגדרות מערכת</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">מידע על שימוש</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
                <li>נתוני ניסויים ותוצאות סימולציות ששמרת</li>
                <li>פעילות במערכת ודפים שצפית בהם</li>
                <li>מידע טכני כגון דפדפן, מערכת הפעלה וכתובת IP</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              שימוש במידע
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">אנו משתמשים במידע שנאסף למטרות הבאות:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
              <li>אספקת ותחזוקת השירותים שלנו</li>
              <li>שיפור וייעול חוויית המשתמש</li>
              <li>אבטחת המערכת ומניעת שימוש לרעה</li>
              <li>תקשורת עם משתמשים בנוגע לעדכונים ושירותים</li>
              <li>ניתוח סטטיסטי למטרות מחקר ושיפור</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              אבטחת המידע
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע האישי שלך, כולל:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
              <li>הצפנת נתונים בעת העברה ובמנוחה</li>
              <li>גישה מוגבלת למידע רק לעובדים מורשים</li>
              <li>גיבויים תקופתיים ומערכות שחזור</li>
              <li>ניטור מתמיד לאיומי אבטחה</li>
            </ul>
            <p className="text-slate-700 leading-relaxed">
              למרות מאמצינו, אין שיטת העברה או אחסון אלקטרוני בטוחה ב-100%.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              שיתוף מידע עם צדדים שלישיים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אנו לא מוכרים או משכירים את המידע האישי שלך לצדדים שלישיים. 
              אנו עשויים לשתף מידע רק במקרים הבאים:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
              <li>עם ספקי שירות הפועלים בשמנו (כגון אחסון ענן)</li>
              <li>כאשר נדרש על פי חוק או צו שיפוטי</li>
              <li>להגנה על זכויות, רכוש או בטיחות של Experimenta ומשתמשיה</li>
              <li>בהסכמתך המפורשת</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>זכויות המשתמש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">למשתמשים יש את הזכויות הבאות:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
              <li>צפייה, עדכון ותיקון של המידע האישי שלך</li>
              <li>מחיקת החשבון והמידע שלך</li>
              <li>הורדת נתוני הניסויים שלך</li>
              <li>ביטול הסכמה לשימוש במידע</li>
              <li>הגשת תלונה לרשות להגנת הפרטיות</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>עוגיות (Cookies)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אנו משתמשים בעוגיות לשיפור חוויית המשתמש, שמירת העדפות ואיסוף סטטיסטיקות שימוש. 
              ניתן לנהל את העדפות העוגיות דרך הדפדפן שלך.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שינויים במדיניות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אנו עשויים לעדכן את מדיניות הפרטיות מעת לעת. 
              שינויים מהותיים יפורסמו באתר ונודיע למשתמשים באמצעות דוא"ל.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>צור קשר</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              לשאלות או חששות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו בכתובת:
            </p>
            <p className="text-blue-600 font-medium mt-2">info@experimenta.com</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}