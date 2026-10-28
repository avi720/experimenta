import type { ReactNode } from 'react';
import { useTranslation } from '@/i18n';
import { bodyTextClass } from './contentStyles';

// Shared long-form layout for the About, What's New and legal pages (docs/BRAND.md: Layout, Typography).

type ContentPageHeaderProps = { title: string; subtitle?: string };

export function ContentPageHeader({ title, subtitle }: ContentPageHeaderProps) {
    return (
        <header className="max-w-[44rem]">
            <h1 className="text-[clamp(2.5rem,5.5vw,3.75rem)] font-light leading-[1.08] tracking-[-0.01em] text-star">{title}</h1>
            {subtitle && <p className="mt-5 text-[19px] leading-[1.6] text-dust">{subtitle}</p>}
        </header>
    );
}

export function ContentList({ items }: { items: string[] }) {
    return (
        <ul className={`space-y-2.5 ${bodyTextClass}`}>
            {items.map((item, index) => (
                <li key={index} className="relative ps-6 before:absolute before:start-0 before:top-[0.85em] before:h-px before:w-3 before:bg-dust/60">
                    {item}
                </li>
            ))}
        </ul>
    );
}

export function ContentParagraphs({ paragraphs }: { paragraphs: string[] }) {
    return (
        <>
            {paragraphs.map((paragraph, index) => (
                <p key={index} className={bodyTextClass}>{paragraph}</p>
            ))}
        </>
    );
}

export function ContentSubheading({ children }: { children: ReactNode }) {
    return <h3 className="text-[17px] font-medium text-star">{children}</h3>;
}

export type LegalSection = { id: string; title: string; body: ReactNode };

type LegalDocumentProps = { title: string; lastUpdated: string; sections: LegalSection[] };

/** A legal page: start-aligned header, a contents rail on wide screens and ~70ch sections split by hairlines. */
export function LegalDocument({ title, lastUpdated, sections }: LegalDocumentProps) {
    const { t, dir } = useTranslation();
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24" dir={dir}>
            <ContentPageHeader title={title} subtitle={lastUpdated} />

            <div className="mt-14 md:mt-20 grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-16">
                <nav aria-label={t('common.onThisPage')} className="hidden lg:block">
                    <div className="sticky top-24 border-t border-line pt-5">
                        <p className="text-[13px] text-dust">{t('common.onThisPage')}</p>
                        <ol className="mt-4 space-y-2.5 text-[15px] leading-snug">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className="focus-ring text-dust transition-colors hover:text-blueshift">
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </div>
                </nav>

                <article className="max-w-[70ch]">
                    {sections.map((section) => (
                        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24 border-t border-line py-10 first:pt-8">
                            <h2 id={`${section.id}-title`} className="text-[clamp(1.5rem,2.6vw,1.9rem)] font-light leading-[1.2] text-star">
                                {section.title}
                            </h2>
                            <div className="mt-5 space-y-5">{section.body}</div>
                        </section>
                    ))}
                </article>
            </div>
        </div>
    );
}
