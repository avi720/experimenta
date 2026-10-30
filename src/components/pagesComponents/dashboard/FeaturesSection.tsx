import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type TextItem = { title: string; description: string };

// Small line figures, one per feature, drawn from the physics each one describes.
// SVG coordinates never mirror, so the physical axes read left to right in both languages.
const plot = (from: number, to: number, f: (x: number) => number) => {
    const points: string[] = [];
    for (let x = from; x <= to; x += 1) points.push(`${x},${f(x).toFixed(2)}`);
    return `M${points.join(' L')}`;
};

const stroke = { fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function PendulumFigure() {
    return (
        <>
            <path d="M28 6 H68" stroke="rgb(var(--line))" strokeWidth="1.5" />
            <path d="M48 6 L66 54" stroke="rgb(var(--plasma))" strokeDasharray="3 3" {...stroke} />
            <circle cx="66" cy="54" r="5" stroke="rgb(var(--plasma))" {...stroke} />
            <path d="M48 6 L30 58" stroke="rgb(var(--blueshift))" {...stroke} />
            <circle cx="30" cy="58" r="6" fill="rgb(var(--blueshift))" />
            <path d="M36 66 Q48 72 60 63" stroke="rgb(var(--dust) / 0.6)" strokeDasharray="2 3" {...stroke} />
        </>
    );
}

function ChartFigure() {
    const trace = plot(10, 92, (x) => 36 - 24 * Math.exp(-(x - 10) / 38) * Math.sin((x - 10) / 5));
    return (
        <>
            <path d="M8 6 V66 H94" stroke="rgb(var(--line))" {...stroke} />
            <path d={trace} stroke="rgb(var(--blueshift))" {...stroke} />
        </>
    );
}

function FormulaFigure() {
    const curve = plot(8, 88, (x) => 10 + (x - 8) ** 2 * 0.008);
    const samples = [18, 33, 48, 63, 78].map((x) => [x, 10 + (x - 8) ** 2 * 0.008]);
    return (
        <>
            <path d={curve} stroke="rgb(var(--plasma))" {...stroke} />
            {samples.map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r="3" fill="rgb(var(--plasma))" />
            ))}
        </>
    );
}

function TunnelingFigure() {
    const amplitude = (x: number) => (x < 44 ? 15 : x <= 56 ? 15 * Math.exp(-(x - 44) / 9) : 15 * Math.exp(-12 / 9));
    const wave = plot(4, 94, (x) => 38 - amplitude(x) * Math.sin(x / 3.2));
    return (
        <>
            <rect x="44" y="8" width="12" height="60" fill="rgb(var(--line))" />
            <path d={wave} stroke="rgb(var(--blueshift))" {...stroke} />
        </>
    );
}

const FIGURES = [PendulumFigure, ChartFigure, FormulaFigure, TunnelingFigure];

export default function FeaturesSection({ isRTL }: IsRTLProps) {
    const { t } = useTranslation(isRTL);
    const items = t<TextItem[]>('dashboard.features') || [];

    return (
        <section aria-labelledby="features-title" className="border-t border-line/70">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32">
                <h2 id="features-title" data-reveal className="text-[clamp(2rem,4vw,3.35rem)] font-light leading-[1.1] tracking-[-0.01em] text-star">
                    {t('dashboard.featuresTitle')}
                </h2>

                <div className="mt-14 md:mt-20 grid md:grid-cols-2 gap-x-16 gap-y-14">
                    {items.map((item, index) => {
                        const Figure = FIGURES[index % FIGURES.length];
                        return (
                            <article key={item.title} data-reveal className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr] gap-5 sm:gap-8 border-t border-line pt-8">
                                <svg viewBox="0 0 100 76" className="w-full h-auto" aria-hidden="true" focusable="false">
                                    <Figure />
                                </svg>
                                <div>
                                    <h3 className="text-[22px] leading-snug text-star">{item.title}</h3>
                                    <p className="mt-3 text-[17px] leading-[1.7] text-dust max-w-[34rem]">{item.description}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
