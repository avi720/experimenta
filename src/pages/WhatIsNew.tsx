import { useTranslation } from "@/i18n";
import { ContentPageHeader } from "@/components/pagesComponents/content/ContentPage";
import { bodyTextClass } from "@/components/pagesComponents/content/contentStyles";

type UpdateItem = { title?: string; date?: string; badge?: string; description?: string };

export default function WhatIsNew() {
  const { t, dir } = useTranslation();
  const updates = t<UpdateItem[]>("whatsNew.updates") || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24" dir={dir}>
      <ContentPageHeader title={t("whatsNew.title")} subtitle={t("whatsNew.subtitle")} />

      {/* A changelog read as a timeline: newest first, each entry a body on one hairline. */}
      <ol className="mt-16 md:mt-24 border-t border-line">
        {Array.isArray(updates) && updates.map((update, index) => (
          <li key={index} className="grid gap-3 border-b border-line py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-12">
            <div className="flex items-center gap-3 md:block">
              <p className="text-[15px] text-dust">{update.date}</p>
              {update.badge && (
                <span
                  className={`inline-block rounded-full border px-2.5 text-[13px] md:mt-3 ${
                    index === 0 ? "border-blueshift/50 text-blueshift" : "border-line text-dust"
                  }`}
                >
                  {update.badge}
                </span>
              )}
            </div>
            <div className="max-w-[40rem]">
              <h2 className="text-[clamp(1.4rem,2.4vw,1.75rem)] font-light leading-[1.2] text-star">{update.title}</h2>
              <p className={`${bodyTextClass} mt-3`}>{update.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
