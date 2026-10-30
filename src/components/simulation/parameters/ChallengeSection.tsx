import { useState } from "react";
import { Crosshair, HelpCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { rateGuess } from "@/simulation/challenge";
import type { ExperimentChallenge } from "@/hooks/simulation/useExperimentChallenge";
import type { Parameter } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";
import { panelHeadingClass, plasmaButtonClass, toggleChipClass } from "../workspace/workspaceStyles";

type ChallengeSectionProps = IsRTLProps & { challenge: ExperimentChallenge };

const segmentClass =
    "focus-ring h-8 rounded-[5px] text-[13px] text-dust transition-colors hover:text-star aria-pressed:bg-space-raised aria-pressed:text-star aria-pressed:shadow-[inset_0_0_0_1px_rgb(var(--horizon)/0.5)]";
const linkButtonClass = "focus-ring rounded-sm text-[13px] text-blueshift underline underline-offset-4 hover:text-star";

function formatPercent(percent: number) {
    return percent < 10 ? percent.toFixed(1) : percent.toFixed(0);
}

/** "Experiment goal": free play, or find a hidden parameter from the measurements. */
export default function ChallengeSection({ challenge, isRTL }: ChallengeSectionProps) {
    const { t, pick } = useTranslation(isRTL);
    const [guess, setGuess] = useState("");
    const [guessError, setGuessError] = useState(false);
    const { options, state, guide, hiddenKeys } = challenge;

    if (options.length === 0) return null;

    const active = state ? options.find((o) => o.spec.key === state.key) : undefined;
    const label = (parameter: Parameter) => pick(parameter.i18n_labels, parameter.key);
    const hiddenLabels = (guide?.quantities || [])
        .filter((q) => hiddenKeys.includes(q.key))
        .map((q) => pick(q.label));

    const handleCheck = () => {
        const value = parseFloat(guess);
        setGuessError(!Number.isFinite(value));
        if (Number.isFinite(value)) challenge.checkGuess(value);
    };

    const handleStart = (key: string) => {
        setGuess("");
        setGuessError(false);
        challenge.start(key);
    };

    const rating = state?.lastErrorPercent != null ? rateGuess(state.lastErrorPercent) : null;
    const feedbackClass = {
        good: "bg-emerald-400/10 text-emerald-300",
        close: "bg-plasma/10 text-plasma",
        far: "bg-danger/10 text-danger",
    };

    return (
        <section className="space-y-3 pb-5 border-b border-line">
            <h3 className={`${panelHeadingClass} flex items-center gap-2`}>
                <Crosshair className="w-4 h-4 text-blueshift" aria-hidden="true" />
                {t("workspace.challenge.title")}
            </h3>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-line p-[3px]" role="group" aria-label={t("workspace.challenge.title")}>
                <button type="button" className={segmentClass} aria-pressed={!state} onClick={challenge.stop}>
                    {t("workspace.challenge.freeMode")}
                </button>
                <button
                    type="button"
                    className={segmentClass}
                    aria-pressed={!!state}
                    onClick={() => !state && handleStart(options[0].spec.key)}
                >
                    {t("workspace.challenge.unknownMode")}
                </button>
            </div>

            {state && (
                <>
                    <p className="text-xs leading-relaxed text-dust">{t("workspace.challenge.pickIntro")}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {options.map(({ spec, parameter }) => (
                            <button
                                key={spec.key}
                                type="button"
                                className={toggleChipClass}
                                aria-pressed={spec.key === state.key}
                                onClick={() => spec.key !== state.key && handleStart(spec.key)}
                            >
                                {label(parameter)}
                                <span className="font-mono italic text-dust" dir="ltr">{spec.symbol}</span>
                            </button>
                        ))}
                    </div>

                    {active && (
                        <div className="space-y-3 rounded-md border border-line bg-space-raised/60 p-3">
                            <h4 className="flex items-center gap-2 text-[13px] font-medium text-star">
                                <HelpCircle className="w-4 h-4 text-blueshift" aria-hidden="true" />
                                {t("workspace.challenge.answerTitle")}
                            </h4>
                            {state.revealed ? (
                                <p className="text-sm text-star">
                                    {t("workspace.challenge.trueValue")}:{" "}
                                    <span className="font-mono tabular-nums" dir="ltr">
                                        {active.spec.symbol} = {state.value} {active.parameter.unit}
                                    </span>
                                </p>
                            ) : (
                                <form
                                    className="space-y-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleCheck();
                                    }}
                                >
                                    <label htmlFor="challenge-guess" className="block text-xs text-dust">
                                        {t("workspace.challenge.guessLabel", { label: label(active.parameter) })}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="challenge-guess"
                                                type="number"
                                                step="any"
                                                inputMode="decimal"
                                                value={guess}
                                                aria-invalid={guessError}
                                                onChange={(e) => setGuess(e.target.value)}
                                                className={cn(
                                                    "bg-space/60 border-line font-mono tabular-nums text-star hover:border-blueshift/60 focus-visible:ring-blueshift",
                                                    active.parameter.unit && "pe-16"
                                                )}
                                            />
                                            {active.parameter.unit && (
                                                <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center font-mono text-xs text-dust" dir="ltr" aria-hidden="true">
                                                    {active.parameter.unit}
                                                </span>
                                            )}
                                        </div>
                                        <Button type="submit" size="sm" className={plasmaButtonClass}>
                                            {t("workspace.challenge.check")}
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {guessError && !state.revealed && (
                                <p className="rounded-md bg-danger/10 px-2.5 py-1.5 text-[13px] text-danger" role="alert">
                                    {t("workspace.challenge.invalidGuess")}
                                </p>
                            )}
                            {!guessError && rating && state.lastErrorPercent != null && (
                                <p className={cn("rounded-md px-2.5 py-1.5 text-[13px]", feedbackClass[rating])} role="status">
                                    {t(`workspace.challenge.${rating}`, { percent: formatPercent(state.lastErrorPercent) })}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                {!state.revealed && (
                                    <button type="button" className={linkButtonClass} onClick={challenge.reveal}>
                                        {t("workspace.challenge.reveal")}
                                    </button>
                                )}
                                <button type="button" className={linkButtonClass} onClick={() => handleStart(state.key)}>
                                    {t("workspace.challenge.reroll")}
                                </button>
                            </div>
                        </div>
                    )}

                    {hiddenLabels.length > 0 && (
                        <p className="border-s-2 border-horizon/60 ps-2.5 text-xs leading-relaxed text-dust">
                            <Lock className="me-1 inline h-3 w-3 text-horizon" aria-hidden="true" />
                            {t("workspace.challenge.hiddenOutputs", { list: hiddenLabels.join(", ") })}
                        </p>
                    )}
                </>
            )}
        </section>
    );
}

/** Stands in for a parameter's input while its value is the hidden unknown. */
export function LockedParameter({ parameter, symbol, range, isRTL }: IsRTLProps & {
    parameter: Parameter;
    symbol: string;
    range: { min: number; max: number };
}) {
    const { t, pick } = useTranslation(isRTL);
    const unit = parameter.unit ? ` ${parameter.unit}` : "";
    return (
        <div className="space-y-1.5 rounded-md border border-dashed border-horizon/70 bg-horizon/5 p-3">
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-dust">{pick(parameter.i18n_labels, parameter.key)}</span>
                <span className="font-mono text-lg text-horizon" dir="ltr">
                    {symbol} = ?{unit}
                </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-horizon">
                <Lock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                <span>
                    {t("workspace.challenge.lockedValue")}{" "}
                    {/* Numbers and units in their own LTR run, so the Hebrew sentence keeps its order. */}
                    <span className="font-mono whitespace-nowrap" dir="ltr">
                        {range.min}–{range.max}{unit}
                    </span>
                </span>
            </p>
        </div>
    );
}
