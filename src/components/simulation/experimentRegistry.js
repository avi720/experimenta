import { calculateFreeFallStep } from "./engines/freeFallEngine";
import { calculateStep as calculateShoStep } from "./engines/shoEngine";
import { calculateQuantumTunnelingStep } from "./engines/quantumTunnelingEngine";
import { calculateInterference } from "./engines/doubleSlitEngine";
import FreeFallScene from "./scenes/FreeFallScene";
import ShoScene from "./scenes/ShoScene";
import QuantumTunnelingScene from "./scenes/QuantumTunnelingScene";
import DoubleSlitScene from "./scenes/DoubleSlitScene";

/**
 * Single source of truth for simulation engines and 3D/2D scenes.
 * Adding a new experiment requires only an `experiment_templates` row and one entry here.
 */
export const EXPERIMENT_REGISTRY = {
    freeFall: {
        slug: "free-fall",
        legacyPageName: "FreeFallExperiment",
        mode: "time",
        calculateStepFn: calculateFreeFallStep,
        Scene: FreeFallScene,
        defaultMaxTime: 60,
    },
    sho: {
        slug: "sho",
        legacyPageName: "ShoExperiment",
        mode: "time",
        calculateStepFn: calculateShoStep,
        Scene: ShoScene,
        defaultMaxTime: 20,
    },
    quantumTunneling: {
        slug: "quantum-tunneling",
        legacyPageName: "QuantumTunnelingExperiment",
        mode: "time",
        calculateStepFn: calculateQuantumTunnelingStep,
        Scene: QuantumTunnelingScene,
        defaultMaxTime: 10,
    },
    doubleSlit: {
        slug: "double-slit",
        legacyPageName: "DoubleSlitExperiment",
        mode: "static",
        calculateStaticFn: calculateInterference,
        Scene: DoubleSlitScene,
        defaultParameters: {
            wavelength: 500,
            slit_separation: 2000,
            screen_distance: 1,
        },
    },
};

const BY_SLUG = Object.fromEntries(
    Object.values(EXPERIMENT_REGISTRY).map((entry) => [entry.slug, entry])
);

const BY_LEGACY_PAGE = Object.fromEntries(
    Object.values(EXPERIMENT_REGISTRY).map((entry) => [
        entry.legacyPageName.toLowerCase(),
        entry,
    ])
);

export const LEGACY_EXPERIMENT_PAGE_SLUGS = Object.fromEntries(
    Object.values(EXPERIMENT_REGISTRY).map((entry) => [
        entry.legacyPageName,
        entry.slug,
    ])
);

/**
 * Resolves a registry entry from an experiment template (by `engine` or `slug`)
 * or from a slug / legacy page identifier string.
 */
export function resolveExperimentRegistryEntry(experimentOrKey) {
    if (!experimentOrKey) return null;

    if (typeof experimentOrKey === "string") {
        const key = experimentOrKey.trim();
        return (
            EXPERIMENT_REGISTRY[key] ||
            BY_SLUG[key.toLowerCase()] ||
            BY_LEGACY_PAGE[key.toLowerCase()] ||
            null
        );
    }

    const { engine, slug } = experimentOrKey;
    if (engine && EXPERIMENT_REGISTRY[engine]) {
        return EXPERIMENT_REGISTRY[engine];
    }
    if (slug && BY_SLUG[slug.toLowerCase()]) {
        return BY_SLUG[slug.toLowerCase()];
    }
    return null;
}

/**
 * Canonical URL to open an experiment workspace for the given slug.
 */
export function getExperimentWorkspaceUrl(slug) {
    if (!slug) return "/Lab";
    return `/LabWorkspace?id=${encodeURIComponent(slug)}`;
}
