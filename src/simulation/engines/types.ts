/** Parameter values arrive from the UI as numbers or numeric strings. */
export type ParameterValue = number | string | null | undefined;

/** Parameters passed to an engine; keys are the template's parameter keys. */
export type EngineParameters = Record<string, ParameterValue>;

/** One time-series sample produced by a step engine. */
export type SimulationSample = {
    time: number;
    shouldStop?: boolean;
    [quantity: string]: unknown;
};
