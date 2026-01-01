import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, UserCheck, Shield, AlertTriangle, AlertCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">הערת טיוטה</h3>
            <p className="text-sm text-amber-800">
              תנאי שירות אלה הם טיוטה ראשונית. יש לבדוק ולאשר את התוכן עם יועץ משפטי 
              לפני פרסום סופי. הטקסט הבא הוא כללי ואינו מהווה ייעוץ משפטי.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Scale className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">תנאי שירות</h1>
        </div>
        <p className="text-slate-600">עודכן לאחרונה: ינואר 2025</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              מבוא וקבלת התנאים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              ברוכים הבאים ל-Experimenta. תנאי שירות אלה מסדירים את השימוש שלך בפלטפורמה שלנו, 
              לרבות כל התכנים, התכונות והשירותים שאנו מציעים.
            </p>
            <p className="text-slate-700 leading-relaxed">
              על ידי גישה או שימוש ב-Experimenta, אתה מאשר שקראת, הבנת והסכמת להיות מחויב 
              לתנאי שירות אלה. אם אינך מסכים לתנאים אלה, אל תשתמש בשירותים שלנו.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              רישום חשבון ואחריות משתמש
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">יצירת חשבון</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
                <li>עליך לספק מידע מדויק ומעודכן בעת הרישום</li>
                <li>אתה אחראי לשמירה על סודיות פרטי החשבון שלך</li>
                <li>אתה אחראי לכל פעילות המתבצעת דרך החשבון שלך</li>
                <li>עליך להודיע לנו מיד על כל שימוש לא מורשה בחשבון</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">דרישות גיל</h4>
              <p className="text-slate-700 leading-relaxed">
                השירות מיועד למשתמשים מעל גיל 13. משתמשים מתחת לגיל 18 צריכים אישור הורי.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              שימוש מותר ואסור
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">שימוש מותר</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
                <li>ביצוע סימולציות וניסויים למטרות חינוכיות ומחקריות</li>
                <li>שמירה ושיתוף תוצאות הניסויים שלך</li>
                <li>שימוש בכלים והתכנים הזמינים בפלטפורמה</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">שימוש אסור</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
                <li>העתקה, שכפול או הפצה לא מורשית של תכנים מהפלטפורמה</li>
                <li>ניסיון לפרוץ, לפגוע או לשבש את המערכת</li>
                <li>שימוש בפלטפורמה למטרות בלתי חוקיות</li>
                <li>העלאת תוכן פוגעני, גזעני או בלתי הולם</li>
                <li>התחזות למשתמש אחר או גורם אחר</li>
                <li>איסוף מידע על משתמשים אחרים ללא הסכמתם</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>קניין רוחני</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              כל התכנים, התכונות, הקוד והעיצוב של Experimenta הם קניינה הבלעדי של החברה 
              ומוגנים על פי חוקי קניין רוחני. אין להעתיק, לשנות או להפיץ ללא אישור מפורש.
            </p>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">תכנים שיצרת</h4>
              <p className="text-slate-700 leading-relaxed">
                נתוני הניסויים והתוצאות שאתה יוצר בפלטפורמה שייכים לך. 
                אנו שומרים לעצמנו זכות להשתמש בנתונים אנונימיים למטרות סטטיסטיות ושיפור המערכת.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              הגבלת אחריות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              השירות מסופק "כמות שהוא" (AS IS) ללא אחריות מכל סוג. אנו לא אחראים ל:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 mr-4">
              <li>דיוק מוחלט של תוצאות הסימולציות</li>
              <li>נזקים עקיפים הנובעים משימוש או אי-שימוש בשירות</li>
              <li>הפסקות או תקלות זמניות בשירות</li>
              <li>אובדן נתונים כתוצאה מכשלים טכניים</li>
            </ul>
            <p className="text-slate-700 leading-relaxed font-semibold">
              אחריותנו המקסימלית כלפיך לא תעלה על הסכום ששילמת עבור השירות (אם בכלל).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שיפוי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אתה מסכים לשפות ולפצות את Experimenta, עובדיה ושותפיה מפני כל תביעה, הפסד או נזק 
              הנובעים משימושך בשירות או מהפרת תנאי שירות אלה.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שינויים בשירות ובתנאים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אנו שומרים לעצמנו את הזכות לשנות, להשעות או להפסיק חלקים מהשירות בכל עת, 
              ללא הודעה מוקדמת. כמו כן, אנו רשאים לעדכן את תנאי השירות, 
              ושינויים מהותיים יפורסמו באתר.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סיום חשבון</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              אנו רשאים להשעות או לסגור את חשבונך בכל עת אם נראה שאתה מפר את תנאי השירות, 
              משתמש לרעה בפלטפורמה או פוגע במשתמשים אחרים.
            </p>
            <p className="text-slate-700 leading-relaxed">
              אתה רשאי לבקש מחיקת חשבונך בכל עת דרך הגדרות החשבון או יצירת קשר עם התמיכה.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>דין וסמכות שיפוט</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">
              תנאי שירות אלה יהיו כפופים לחוקי מדינת ישראל. 
              כל סכסוך הנובע מתנאים אלה יובא לפתרון בבתי המשפט המוסמכים בישראל.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>צור קשר</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              לשאלות או חששות בנוגע לתנאי שירות אלה, ניתן לפנות אלינו בכתובת:
            </p>
            <p className="text-blue-600 font-medium mt-2">info@experimenta.com</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}