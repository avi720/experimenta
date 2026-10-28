import { useTranslation } from "@/i18n";
import {
  ContentList,
  ContentParagraphs,
  ContentSubheading,
  LegalDocument,
  type LegalSection,
} from "@/components/pagesComponents/content/ContentPage";
import { bodyTextClass, textLinkClass } from "@/components/pagesComponents/content/contentStyles";

const listOf = (value: unknown): string[] => (Array.isArray(value) ? value : []);

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  const sections: LegalSection[] = [
    {
      id: "intro",
      title: t("privacy.introTitle"),
      body: <ContentParagraphs paragraphs={listOf(t<string[]>("privacy.introParagraphs"))} />,
    },
    {
      id: "collected",
      title: t("privacy.collectedTitle"),
      body: (
        <>
          <ContentSubheading>{t("privacy.personalInfoHeading")}</ContentSubheading>
          <ContentList items={listOf(t<string[]>("privacy.personalInfoItems"))} />
          <ContentSubheading>{t("privacy.technicalInfoHeading")}</ContentSubheading>
          <ContentList items={listOf(t<string[]>("privacy.technicalInfoItems"))} />
        </>
      ),
    },
    {
      id: "usage",
      title: t("privacy.usageTitle"),
      body: (
        <>
          <p className={bodyTextClass}>{t("privacy.usageIntro")}</p>
          <ContentList items={listOf(t<string[]>("privacy.usageItems"))} />
        </>
      ),
    },
    {
      id: "security",
      title: t("privacy.securityTitle"),
      body: <ContentParagraphs paragraphs={listOf(t<string[]>("privacy.securityParagraphs"))} />,
    },
    {
      id: "sharing",
      title: t("privacy.sharingTitle"),
      body: (
        <>
          <p className={bodyTextClass}>{t("privacy.sharingIntro")}</p>
          <ContentList items={listOf(t<string[]>("privacy.sharingItems"))} />
        </>
      ),
    },
    {
      id: "rights",
      title: t("privacy.rightsTitle"),
      body: (
        <>
          <p className={bodyTextClass}>{t("privacy.rightsIntro")}</p>
          <ContentList items={listOf(t<string[]>("privacy.rightsItems"))} />
        </>
      ),
    },
    { id: "cookies", title: t("privacy.cookiesTitle"), body: <p className={bodyTextClass}>{t("privacy.cookiesBody")}</p> },
    { id: "changes", title: t("privacy.changesTitle"), body: <p className={bodyTextClass}>{t("privacy.changesBody")}</p> },
    {
      id: "contact",
      title: t("privacy.contactTitle"),
      body: (
        <p className={bodyTextClass}>
          {t("privacy.contactBody")}{" "}
          <a href="mailto:info@experimenta.com" dir="ltr" className={textLinkClass}>info@experimenta.com</a>
        </p>
      ),
    },
  ];

  return <LegalDocument title={t("privacy.title")} lastUpdated={t("privacy.lastUpdated")} sections={sections} />;
}
