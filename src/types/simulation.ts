import type { ComponentType, LazyExoticComponent } from 'react';
import type { ParameterValues } from './experiment';

/** Types shared by the simulation workspace, its hooks and the experiment registry. */

export type SimulationStatus = 'idle' | 'calculating' | 'running' | 'paused' | 'completed';

/**
 * One point the workspace handles: a step-engine sample, a static pattern point, the static
 * mode's `{ parameters, pattern }` display point, or a sample normalized for charts.
 */
export type SimulationDataPoint = {
  time?: number;
  shouldStop?: boolean;
  /** A number, or `{ y }` on Free Fall before normalization. */
  position?: number | { y: number };
  pattern?: SimulationDataPoint[];
  parameters?: ParameterValues;
  debug?: Record<string, unknown>;
  [quantity: string]: unknown;
};

/** A sample produced by a time-mode engine. */
export type TimeSample = SimulationDataPoint & { time: number };

/** Parameters handed to an engine: the UI's `ParameterValues` or a stored run's `parameters_json`. */
export type EngineInput = Readonly<Record<string, unknown>>;

// Method syntax keeps the parameter bivariant: engines declare `EngineParameters` (numbers or
// strings only) but receive any `EngineInput`; they coerce every value with parseFloat(String(v)).
export type SimulationStepFn = {
  bivarianceHack(t: number, parameters: EngineInput | null | undefined): TimeSample;
}['bivarianceHack'];

export type SimulationStaticFn = {
  bivarianceHack(parameters: EngineInput): SimulationDataPoint[];
}['bivarianceHack'];

export type ParameterValidationResult = { isValid: boolean; error: string | null };

export type ParameterValidationState = {
  isAllValid: boolean;
  errors: Record<string, string>;
  byKey: Record<string, ParameterValidationResult>;
};

/** Props every registry scene receives from the workspace page. */
export type SimulationSceneProps = {
  parameters?: ParameterValues;
  paramValues?: ParameterValues;
  dataPointToRender?: SimulationDataPoint | null;
  /** Parameter keys hidden as the unknown; a scene must not print their values. */
  hiddenParameters?: string[];
};

type RegistryEntryBase = {
  slug: string;
  legacyPageName: string;
  Scene: LazyExoticComponent<ComponentType<SimulationSceneProps>>;
  defaultMaxTime?: number;
  defaultParameters?: ParameterValues;
};

export type ExperimentRegistryEntry =
  | (RegistryEntryBase & { mode: 'time'; calculateStepFn: SimulationStepFn; calculateStaticFn?: undefined })
  | (RegistryEntryBase & { mode: 'static'; calculateStaticFn: SimulationStaticFn; calculateStepFn?: undefined });

/** Playback state and handlers passed from the workspace down to the simulation console. */
export type SimulationConsoleHandlers = {
  simulationState: SimulationStatus;
  onStart: () => void;
  onPause: () => void;
  onContinue: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onScrub: (time: number) => void;
  currentTime?: number;
  playbackTime: number;
  /** The furthest time this run has played to; stepping and scrubbing stop there. */
  playedUntil?: number;
  displayedDataPoint?: SimulationDataPoint | null;
  simulationData?: SimulationDataPoint[];
  validationState?: ParameterValidationState;
};
