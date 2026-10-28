import { Plus } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type FaqItem = { question: string; answer: string; thought?: boolean };

export default function FaqSection({ isRTL }: IsRTLProps) {
    const { t } = useTranslation(isRTL);
    const items = t<FaqItem[]>('dashboard.faq') || [];

    return (
        <section aria-labelledby="faq-title" className="border-t border-line/70">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32 grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16">
                <h2 id="faq-title" data-reveal className="text-[clamp(2rem,4vw,3.35rem)] font-light leading-[1.1] tracking-[-0.01em] text-star">
                    {t('dashboard.faqTitle')}
                </h2>

                <div data-reveal className="border-t border-line">
                    {items.map((item) => (
                        <details key={item.question} className="group border-b border-line">
                            <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[19px] leading-snug text-star hover:text-blueshift [&::-webkit-details-marker]:hidden">
                                <span className="flex flex-wrap items-center gap-3">
                                    {/* Horizon violet marks thought experiments across the brand. */}
                                    {item.thought && <span aria-hidden="true" className="h-5 w-0.5 flex-shrink-0 bg-horizon" />}
                                    {item.question}
                                    {item.thought && (
                                        <span className="rounded-full border border-horizon/45 px-2.5 text-[13px] text-horizon">
                                            {t('dashboard.thoughtTag')}
                                        </span>
                                    )}
                                </span>
                                <Plus aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-blueshift transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
                            </summary>
                            <p className="pb-7 pe-11 text-[17px] leading-[1.7] text-dust max-w-[40rem]">{item.answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
