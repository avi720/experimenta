import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { ExperimentGuide, UnknownSpec } from "@/simulation/guides";

// Loaded on demand by ExperimentFormulasDialog: KaTeX and its fonts stay out of the main bundle.

type FormulasContentProps = {
    guide: ExperimentGuide;
    /** The parameter currently hidden, with its localized label. */
    unknown?: { spec: UnknownSpec; label: string } | null;
};

function Tex({ tex, display = true, className }: { tex: string; display?: boolean; className?: string }) {
    const html = useMemo(
        () => katex.renderToString(tex, { displayMode: display, throwOnError: false }),
        [tex, display]
    );
    // Equations read left to right in both languages.
    return <span dir="ltr" className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function FormulasContent({ guide, unknown }: FormulasContentProps) {
    const { t, pick } = useTranslation();

    return (
        <div className="space-y-6">
            {unknown && (
                <div className="space-y-2 rounded-md border border-horizon/60 bg-horizon/10 px-4 py-3 text-sm">
                    <p className="text-star">
                        {t("workspace.formulas.unknownCallout", { label: unknown.label, symbol: unknown.spec.symbol })}
                    </p>
                    <details>
                        <summary className="cursor-pointer text-blueshift">{t("workspace.formulas.hintToggle")}</summary>
                        <p className="mt-2 leading-relaxed text-dust">{pick(unknown.spec.hint)}</p>
                    </details>
                </div>
            )}

            {guide.formulas.map((group) => (
                <section key={pick(group.title)} className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-plasma">{pick(group.title)}</h3>
                    <div className="space-y-2.5">
                        {group.formulas.map((formula) => {
                            const isHit = !!unknown && formula.uses.includes(unknown.spec.key);
                            return (
                                <article
                                    key={formula.id}
                                    className={cn(
                                        "space-y-1.5 rounded-md border px-4 py-3",
                                        isHit ? "border-horizon/70 bg-horizon/10" : "border-line bg-space/50"
                                    )}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="text-sm font-medium text-star">{pick(formula.name)}</h4>
                                        {isHit && unknown && (
                                            <span className="rounded-full border border-horizon/60 px-2 py-px text-[11px] text-horizon">
                                                {t("workspace.formulas.includesUnknown", { symbol: unknown.spec.symbol })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto py-1 text-star">
                                        <Tex tex={formula.tex} />
                                    </div>
                                    <p className="text-[13px] leading-relaxed text-dust">{pick(formula.description)}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}

            {guide.symbols.length > 0 && (
                <section className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-plasma">{t("workspace.formulas.symbolsTitle")}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-line text-dust">
                                    <th scope="col" className="px-2 py-2 text-start font-medium">{t("workspace.formulas.symbolHeader")}</th>
                                    <th scope="col" className="px-2 py-2 text-start font-medium">{t("workspace.formulas.meaningHeader")}</th>
                                    <th scope="col" className="px-2 py-2 text-start font-medium">{t("workspace.formulas.unitHeader")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guide.symbols.map((entry) => (
                                    <tr key={entry.tex} className="border-b border-line">
                                        <td className="px-2 py-2 text-star"><Tex tex={entry.tex} display={false} /></td>
                                        <td className="px-2 py-2 text-star">{pick(entry.meaning)}</td>
                                        <td className="px-2 py-2 font-mono text-dust" dir="ltr">{entry.unit || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
