import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, UserCheck, Shield, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function TermsOfService() {
  const { t, dir } = useTranslation();

  const introParagraphs = t<string[]>("terms.introParagraphs") || [];
  const accountItems = t<string[]>("terms.accountItems") || [];
  const allowedItems = t<string[]>("terms.allowedItems") || [];
  const prohibitedItems = t<string[]>("terms.prohibitedItems") || [];
  const ipParagraphs = t<string[]>("terms.ipParagraphs") || [];
  const disclaimerItems = t<string[]>("terms.disclaimerItems") || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir={dir}>
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Scale className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">{t("terms.title")}</h1>
        </div>
        <p className="text-slate-600">{t("terms.lastUpdated")}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {t("terms.introTitle")}
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
              <UserCheck className="w-5 h-5 text-blue-600" />
              {t("terms.accountTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t("terms.accountHeading")}</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
                {Array.isArray(accountItems) && accountItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t("terms.ageHeading")}</h3>
              <p className="text-slate-700 leading-relaxed">{t("terms.ageBody")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t("terms.acceptableUseTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t("terms.allowedHeading")}</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
                {Array.isArray(allowedItems) && allowedItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t("terms.prohibitedHeading")}</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
                {Array.isArray(prohibitedItems) && prohibitedItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("terms.ipTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(ipParagraphs) && ipParagraphs.map((paragraph, index) => (
              <p key={index} className="text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              {t("terms.disclaimerTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">{t("terms.disclaimerIntro")}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ms-4">
              {Array.isArray(disclaimerItems) && disclaimerItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("terms.changesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("terms.changesBody")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("terms.terminationTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("terms.terminationBody")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("terms.lawTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("terms.lawBody")}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>{t("terms.contactTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{t("terms.contactBody")}</p>
            <a href="mailto:info@experimenta.com" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
              info@experimenta.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
