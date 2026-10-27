import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Target, Lightbulb } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function AboutUs() {
  const { t, dir } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir={dir}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{t("about.title")}</h1>
        <p className="text-xl text-slate-600">{t("about.subtitle")}</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              {t("about.missionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {t("about.missionBody")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              {t("about.visionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {t("about.visionBody")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              {t("about.teamTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {t("about.teamBody")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              {t("about.contactTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {t("about.contactBody")}
              <br />
              <a href="mailto:info@experimenta.com" className="text-blue-600 font-medium hover:underline mt-1 inline-block">
                info@experimenta.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
