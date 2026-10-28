import { resolveExperimentRegistryEntry } from "@/simulation/experimentRegistry";
import type { ExperimentTemplateData } from "@/types/experiment";

// Templates have no dedicated column for thought experiments yet, so the catalogue reads the
// template `type` or a tag. Horizon violet marks them across the brand (docs/BRAND.md).
const THOUGHT_MARKERS = new Set(["thought", "thought-experiment", "thought_experiment"]);

export function isThoughtExperiment(experiment: Pick<ExperimentTemplateData, "type" | "tags">): boolean {
    if (experiment.type && THOUGHT_MARKERS.has(experiment.type.toLowerCase())) return true;
    return (experiment.tags ?? []).some((tag) => THOUGHT_MARKERS.has(tag.toLowerCase()));
}

// A template with no registry entry has no engine or scene to open yet.
export function hasSimulation(experiment: Pick<ExperimentTemplateData, "engine" | "slug">): boolean {
    return resolveExperimentRegistryEntry(experiment) !== null;
}

// Shared look of the catalogue's quiet loading state.
export const spinnerClass = "h-5 w-5 animate-spin rounded-full border-2 border-line border-t-blueshift";
