import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Target, Lightbulb } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">אודות Experimenta</h1>
        <p className="text-xl text-slate-600">
          פלטפורמה חדשנית לסימולציות פיזיקליות אינטראקטיביות
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              המשימה שלנו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              Experimenta מספקת סביבת למידה וירטואלית מתקדמת המאפשרת לסטודנטים, 
              חוקרים ומורים לבצע ניסויים פיזיקליים באופן דיגיטלי. 
              אנו שואפים להנגיש את המדע והפיזיקה לכולם באמצעות סימולציות מדויקות ואינטראקטיביות.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              החזון שלנו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              אנו מאמינים שכל אדם ראוי לגישה לכלים מדעיים מתקדמים. 
              המטרה שלנו היא לבנות את המעבדה הוירטואלית המתקדמת ביותר בעולם, 
              המשלבת פיזיקה קלאסית, קוונטית, ותחומים נוספים במדע.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              הצוות שלנו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              Experimenta מורכבת מצוות מומחים בתחומי הפיזיקה, מדעי המחשב וחינוך. 
              אנו עובדים ביחד כדי ליצור חוויית למידה ייחודית ומעוררת השראה.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              צור קשר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              יש לך שאלות או הצעות? נשמח לשמוע ממך!
              <br />
              ניתן ליצור קשר דרך דף <a href="/contact" className="text-blue-600 hover:underline">יצירת קשר</a> שלנו.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}