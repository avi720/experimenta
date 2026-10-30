import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { getExperimentGuide, hiddenQuantityKeys, type ExperimentGuide, type UnknownSpec } from "@/simulation/guides";
import {
    drawUnknownValue,
    guessErrorPercent,
    toRunChallenge,
    type ChallengeState,
    type RunChallenge,
} from "@/simulation/challenge";
import { isParameterVisible } from "@/simulation/parameterValidation";
import type { ExperimentTemplateData, Parameter, ParameterValues } from "@/types/experiment";

/** A parameter the student may choose as the unknown, with its template definition. */
export type UnknownOption = { spec: UnknownSpec; parameter: Parameter };

export type ExperimentChallenge = {
    guide: ExperimentGuide | null;
    options: UnknownOption[];
    state: ChallengeState | null;
    /** True while a value is hidden (chosen and not yet revealed). */
    isHiding: boolean;
    /** Sample keys to hide from the console, charts and CSV export. */
    hiddenKeys: string[];
    start: (key: string) => void;
    stop: () => void;
    reroll: () => void;
    checkGuess: (guess: number) => void;
    reveal: () => void;
    /** The record to store with a saved run, or null when the run was not a challenge. */
    runChallenge: RunChallenge | null;
};

const toLimit = (value: unknown) => {
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * "Find the unknown" mode: keeps one parameter at a secret random value while the student
 * measures it. The secret lives in the ordinary parameter values, so the engine, the scene and a
 * saved run all use it; the UI only masks it.
 */
export function useExperimentChallenge(
    experiment: Pick<ExperimentTemplateData, "slug" | "parameters"> | null | undefined,
    parameters: ParameterValues,
    setParameters: Dispatch<SetStateAction<ParameterValues>>
): ExperimentChallenge {
    const slug = experiment?.slug ?? null;
    const guide = useMemo(() => getExperimentGuide(slug), [slug]);
    const [state, setState] = useState<ChallengeState | null>(null);

    // A different experiment starts without a challenge (its parameters are re-initialised).
    useEffect(() => {
        setState(null);
    }, [slug]);

    const options = useMemo<UnknownOption[]>(() => {
        if (!guide) return [];
        return guide.unknowns.flatMap((spec) => {
            const parameter = experiment?.parameters?.find((p) => p.key === spec.key && p.is_active !== false);
            return parameter && isParameterVisible(parameter, parameters) ? [{ spec, parameter }] : [];
        });
    }, [guide, experiment?.parameters, parameters]);

    const draw = useCallback(
        (key: string) => {
            const option = options.find((o) => o.spec.key === key);
            if (!option) return null;
            return drawUnknownValue(option.spec, {
                min: toLimit(option.parameter.min),
                max: toLimit(option.parameter.max),
            });
        },
        [options]
    );

    const start = useCallback(
        (key: string) => {
            const value = draw(key);
            if (value === null) return;
            setParameters((prev) => {
                const next = { ...prev };
                // Switching unknowns gives the previous one its original value back.
                if (state && !state.revealed && state.key !== key) {
                    next[state.key] = state.previousValue as ParameterValues[string];
                }
                next[key] = value;
                return next;
            });
            const previousValue = state && state.key === key ? state.previousValue : parameters[key];
            setState({ key, value, previousValue, revealed: false, attempts: 0, lastGuess: null, lastErrorPercent: null });
        },
        [draw, setParameters, state, parameters]
    );

    const stop = useCallback(() => {
        if (state && !state.revealed) {
            setParameters((prev) => ({ ...prev, [state.key]: state.previousValue as ParameterValues[string] }));
        }
        setState(null);
    }, [state, setParameters]);

    const reroll = useCallback(() => {
        if (state) start(state.key);
    }, [state, start]);

    const checkGuess = useCallback((guess: number) => {
        setState((prev) =>
            prev && Number.isFinite(guess)
                ? { ...prev, attempts: prev.attempts + 1, lastGuess: guess, lastErrorPercent: guessErrorPercent(guess, prev.value) }
                : prev
        );
    }, []);

    const reveal = useCallback(() => {
        setState((prev) => (prev ? { ...prev, revealed: true } : prev));
    }, []);

    const isHiding = !!state && !state.revealed;
    const secretKey = state?.key;
    const secretValue = state?.value;
    const currentValue = secretKey ? parameters[secretKey] : undefined;
    const isStillAvailable = !secretKey || options.some((o) => o.spec.key === secretKey);

    // Keep the secret in place while hidden: presets and resets must not overwrite it, and an
    // unknown whose parameter is no longer shown (e.g. wavelength after switching to electrons) ends.
    useEffect(() => {
        if (!isHiding || secretKey === undefined || secretValue === undefined) return;
        if (!isStillAvailable) {
            stop();
            return;
        }
        if (Number(currentValue) !== secretValue) {
            setParameters((prev) => ({ ...prev, [secretKey]: secretValue }));
        }
    }, [isHiding, secretKey, secretValue, currentValue, isStillAvailable, stop, setParameters]);

    const hiddenKeys = useMemo(
        () => (isHiding ? hiddenQuantityKeys(guide, secretKey) : []),
        [isHiding, guide, secretKey]
    );

    // After a reveal the student may edit the value; the run then no longer belongs to the challenge.
    const runChallenge = state && Number(currentValue) === state.value ? toRunChallenge(state) : null;

    return { guide, options, state, isHiding, hiddenKeys, start, stop, reroll, checkGuess, reveal, runChallenge };
}
