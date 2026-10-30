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

export default function TermsOfService() {
  const { t } = useTranslation();

  const sections: LegalSection[] = [
    {
      id: "intro",
      title: t("terms.introTitle"),
      body: <ContentParagraphs paragraphs={listOf(t<string[]>("terms.introParagraphs"))} />,
    },
    {
      id: "account",
      title: t("terms.accountTitle"),
      body: (
        <>
          <ContentSubheading>{t("terms.accountHeading")}</ContentSubheading>
          <ContentList items={listOf(t<string[]>("terms.accountItems"))} />
          <ContentSubheading>{t("terms.ageHeading")}</ContentSubheading>
          <p className={bodyTextClass}>{t("terms.ageBody")}</p>
        </>
      ),
    },
    {
      id: "acceptable-use",
      title: t("terms.acceptableUseTitle"),
      body: (
        <>
          <ContentSubheading>{t("terms.allowedHeading")}</ContentSubheading>
          <ContentList items={listOf(t<string[]>("terms.allowedItems"))} />
          <ContentSubheading>{t("terms.prohibitedHeading")}</ContentSubheading>
          <ContentList items={listOf(t<string[]>("terms.prohibitedItems"))} />
        </>
      ),
    },
    {
      id: "ip",
      title: t("terms.ipTitle"),
      body: <ContentParagraphs paragraphs={listOf(t<string[]>("terms.ipParagraphs"))} />,
    },
    {
      id: "disclaimer",
      title: t("terms.disclaimerTitle"),
      body: (
        <>
          <p className={bodyTextClass}>{t("terms.disclaimerIntro")}</p>
          <ContentList items={listOf(t<string[]>("terms.disclaimerItems"))} />
        </>
      ),
    },
    { id: "changes", title: t("terms.changesTitle"), body: <p className={bodyTextClass}>{t("terms.changesBody")}</p> },
    { id: "termination", title: t("terms.terminationTitle"), body: <p className={bodyTextClass}>{t("terms.terminationBody")}</p> },
    { id: "law", title: t("terms.lawTitle"), body: <p className={bodyTextClass}>{t("terms.lawBody")}</p> },
    {
      id: "contact",
      title: t("terms.contactTitle"),
      body: (
        <p className={bodyTextClass}>
          {t("terms.contactBody")}{" "}
          <a href="mailto:info@experimenta.com" dir="ltr" className={textLinkClass}>info@experimenta.com</a>
        </p>
      ),
    },
  ];

  return <LegalDocument title={t("terms.title")} lastUpdated={t("terms.lastUpdated")} sections={sections} />;
}
