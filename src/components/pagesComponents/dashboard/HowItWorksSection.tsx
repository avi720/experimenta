import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type TextItem = { title: string; description: string };

// Each step is a body on one infall path; the last node is a small horizon, where the result lands.
const NODE_CLASSES = [
    'bg-space border-blueshift',
    'bg-space border-plasma',
    'bg-hole border-plasma-hi shadow-[0_0_14px_2px_rgb(var(--plasma)/0.55)]',
];

export default function HowItWorksSection({ isRTL }: IsRTLProps) {
    const { t } = useTranslation(isRTL);
    const steps = t<TextItem[]>('dashboard.steps') || [];

    return (
        <section aria-labelledby="steps-title" className="border-t border-line/70">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
                <h2 id="steps-title" data-reveal className="text-[clamp(2rem,4vw,3.3rem)] font-light leading-[1.1] tracking-[-0.01em] text-star max-w-[22ch]">
                    {t('dashboard.stepsTitle')}
                </h2>

                <ol data-scroll="steps" className="relative mt-16 md:mt-20 grid md:grid-cols-3 gap-12 md:gap-10 ps-10 md:ps-0">
                    {/* The path draws in from the reading start as the section scrolls into view. */}
                    <span
                        aria-hidden="true"
                        className="absolute start-[9px] top-0 bottom-0 w-px origin-top [transform:scaleY(var(--sp,1))]
                            bg-gradient-to-b from-blueshift/15 to-plasma/90
                            md:start-0 md:end-0 md:top-[9px] md:bottom-auto md:w-auto md:h-px
                            md:origin-left md:rtl:origin-right md:[transform:scaleX(var(--sp,1))]
                            md:bg-gradient-to-r md:rtl:bg-gradient-to-l"
                    />
                    {steps.map((step, index) => (
                        <li key={step.title} data-reveal data-step className="relative">
                            <span
                                aria-hidden="true"
                                className={`motion-step-node absolute -start-10 top-1.5 md:static block h-[19px] w-[19px] rounded-full border-[1.5px] ${NODE_CLASSES[index % NODE_CLASSES.length]}`}
                            />
                            <h3 className="md:mt-8 flex items-baseline gap-3.5 text-[22px] text-star">
                                <span className="text-[44px] font-light leading-none text-plasma tabular-nums">{index + 1}</span>
                                <span>{step.title}</span>
                            </h3>
                            <p className="mt-3.5 text-[17px] leading-[1.7] text-dust max-w-[21rem]">{step.description}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
