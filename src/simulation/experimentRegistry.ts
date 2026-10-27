import { calculateFreeFallStep } from "./engines/freeFallEngine";
import { calculateStep as calculateShoStep } from "./engines/shoEngine";
import { calculateQuantumTunnelingStep } from "./engines/quantumTunnelingEngine";
import { calculateInterference } from "./engines/doubleSlitEngine";
import { lazy } from "react";
import type { ExperimentRegistryEntry } from "@/types/simulation";

// Scenes pull in three.js, so they load only when an experiment is opened (T30).
const FreeFallScene = lazy(() => import("@/components/simulation/scenes/FreeFallScene"));
const ShoScene = lazy(() => import("@/components/simulation/scenes/ShoScene"));
const QuantumTunnelingScene = lazy(() => import("@/components/simulation/scenes/QuantumTunnelingScene"));
const DoubleSlitScene = lazy(() => import("@/components/simulation/scenes/DoubleSlitScene"));

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
} satisfies Record<string, ExperimentRegistryEntry>;

const ENTRIES: ExperimentRegistryEntry[] = Object.values(EXPERIMENT_REGISTRY);
const BY_KEY: Readonly<Record<string, ExperimentRegistryEntry | undefined>> = EXPERIMENT_REGISTRY;

const BY_SLUG: Readonly<Record<string, ExperimentRegistryEntry | undefined>> = Object.fromEntries(
    ENTRIES.map((entry) => [entry.slug, entry])
);

const BY_LEGACY_PAGE: Readonly<Record<string, ExperimentRegistryEntry | undefined>> = Object.fromEntries(
    ENTRIES.map((entry) => [
        entry.legacyPageName.toLowerCase(),
        entry,
    ])
);

export const LEGACY_EXPERIMENT_PAGE_SLUGS: Readonly<Record<string, string>> = Object.fromEntries(
    ENTRIES.map((entry) => [
        entry.legacyPageName,
        entry.slug,
    ])
);

/**
 * Resolves a registry entry from an experiment template (by `engine` or `slug`)
 * or from a slug / legacy page identifier string.
 */
export function resolveExperimentRegistryEntry(
    experimentOrKey: string | { engine?: string | null; slug?: string | null } | null | undefined
): ExperimentRegistryEntry | null {
    if (!experimentOrKey) return null;

    if (typeof experimentOrKey === "string") {
        const key = experimentOrKey.trim();
        return (
            BY_KEY[key] ||
            BY_SLUG[key.toLowerCase()] ||
            BY_LEGACY_PAGE[key.toLowerCase()] ||
            null
        );
    }

    const { engine, slug } = experimentOrKey;
    const byEngine = engine ? BY_KEY[engine] : undefined;
    if (byEngine) {
        return byEngine;
    }
    const bySlug = slug ? BY_SLUG[slug.toLowerCase()] : undefined;
    if (bySlug) {
        return bySlug;
    }
    return null;
}

/**
 * Canonical URL to open an experiment workspace for the given slug.
 */
export function getExperimentWorkspaceUrl(slug: string | null | undefined): string {
    if (!slug) return "/Lab";
    return `/LabWorkspace?id=${encodeURIComponent(slug)}`;
}
