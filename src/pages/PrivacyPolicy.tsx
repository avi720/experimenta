import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function PrivacyPolicy() {
  const { t, dir } = useTranslation();

  const introParagraphs = t<string[]>("privacy.introParagraphs") || [];
  const personalInfoItems = t<string[]>("privacy.personalInfoItems") || [];
  const technicalInfoItems = t<string[]>("privacy.technicalInfoItems") || [];
  const usageItems = t<string[]>("privacy.usageItems") || [];
  const securityParagraphs = t<string[]>("privacy.securityParagraphs") || [];
  const sharingItems = t<string[]>("privacy.sharingItems") || [];
  const rightsItems = t<string[]>("privacy.rightsItems") || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir={dir}>
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">{t("privacy.title")}</h1>
        </div>
        <p className="text-slate-600">{t("privacy.lastUpdated")}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              {t("privacy.introTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(introParagraphs) && introParagraphs.map((paragraph, index) => (
              <p key={index} className="text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              {t("privacy.collectedTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t("privacy.personalInfoHeading")}</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
                {Array.isArray(personalInfoItems) && personalInfoItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t("privacy.technicalInfoHeading")}</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
                {Array.isArray(technicalInfoItems) && technicalInfoItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              {t("privacy.usageTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">{t("privacy.usageIntro")}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
              {Array.isArray(usageItems) && usageItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              {t("privacy.securityTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(securityParagraphs) && securityParagraphs.map((paragraph, index) => (
              <p key={index} className="text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t("privacy.sharingTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">{t("privacy.sharingIntro")}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
              {Array.isArray(sharingItems) && sharingItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.rightsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">{t("privacy.rightsIntro")}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
              {Array.isArray(rightsItems) && rightsItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.cookiesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("privacy.cookiesBody")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.changesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("privacy.changesBody")}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>{t("privacy.contactTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("privacy.contactBody")}</p>
            <a href="mailto:info@experimenta.com" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
              info@experimenta.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
