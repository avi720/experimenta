import { useTranslation } from "@/i18n";
import { ContentPageHeader } from "@/components/pagesComponents/content/ContentPage";
import { bodyTextClass, textLinkClass } from "@/components/pagesComponents/content/contentStyles";

const SECTIONS = [
  { id: "mission", title: "about.missionTitle", body: "about.missionBody" },
  { id: "vision", title: "about.visionTitle", body: "about.visionBody" },
  { id: "team", title: "about.teamTitle", body: "about.teamBody" },
] as const;

export default function AboutUs() {
  const { t, dir } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24" dir={dir}>
      <ContentPageHeader title={t("about.title")} subtitle={t("about.subtitle")} />

      <div className="mt-16 md:mt-24 border-t border-line">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`about-${section.id}`}
            className="grid gap-4 border-b border-line py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-14"
          >
            <h2 id={`about-${section.id}`} className="text-[clamp(1.6rem,2.8vw,2.1rem)] font-light leading-[1.15] text-star">
              {t(section.title)}
            </h2>
            <p className={`${bodyTextClass} max-w-[40rem]`}>{t(section.body)}</p>
          </section>
        ))}

        <section aria-labelledby="about-contact" className="grid gap-4 py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-14">
          <h2 id="about-contact" className="text-[clamp(1.6rem,2.8vw,2.1rem)] font-light leading-[1.15] text-star">
            {t("about.contactTitle")}
          </h2>
          <div className="max-w-[40rem]">
            <p className={bodyTextClass}>{t("about.contactBody")}</p>
            <a href="mailto:info@experimenta.com" dir="ltr" className={`${textLinkClass} mt-3 inline-block text-[19px]`}>
              info@experimenta.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
