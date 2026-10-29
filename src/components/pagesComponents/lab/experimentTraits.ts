import { resolveExperimentRegistryEntry } from "@/simulation/experimentRegistry";
import type { ExperimentTemplateData } from "@/types/experiment";

// A template with no registry entry has no engine or scene to open yet.
export function hasSimulation(experiment: Pick<ExperimentTemplateData, "engine" | "slug">): boolean {
    return resolveExperimentRegistryEntry(experiment) !== null;
}

// Shared look of the catalogue's quiet loading state.
export const spinnerClass = "h-5 w-5 animate-spin rounded-full border-2 border-line border-t-blueshift";
