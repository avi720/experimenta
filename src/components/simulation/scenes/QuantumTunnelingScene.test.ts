import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import { computeBarrierVisualWidth, populateQuantumTunnelingScene } from "./QuantumTunnelingScene";
import { disposeObject3D } from "@/simulation/sceneUtils";
import { calculateQuantumTunnelingStep } from "@/simulation/engines/quantumTunnelingEngine";

describe("QuantumTunnelingScene barrier width scaling (T49)", () => {
    it("scales barrier_width_um from the engine into visible scene units", () => {
        const pointDefault = calculateQuantumTunnelingStep(0, { L: 0.005 });
        const pointWide = calculateQuantumTunnelingStep(0, { L: 0.01 });
        const pointNarrow = calculateQuantumTunnelingStep(0, { L: 0.001 });

        const widthDefault = computeBarrierVisualWidth({ L: 0.005 }, pointDefault);
        const widthWide = computeBarrierVisualWidth({ L: 0.01 }, pointWide);
        const widthNarrow = computeBarrierVisualWidth({ L: 0.001 }, pointNarrow);

        // 0.005 µm = 5 nm -> 5 * 0.25 = 1.25 scene units (not 0.00125)
        expect(widthDefault).toBeCloseTo(1.25, 5);
        expect(widthWide).toBeCloseTo(2.5, 5);
        expect(widthNarrow).toBeCloseTo(0.25, 5);
        expect(widthWide).toBeGreaterThan(widthDefault);
        expect(widthDefault).toBeGreaterThan(widthNarrow);
    });

    it("computes visual width directly from parameters.L before playback starts", () => {
        expect(computeBarrierVisualWidth({ L: 0.008 }, null)).toBeCloseTo(2.0, 5);
    });
});

describe("QuantumTunnelingScene resource management (T26)", () => {
    it("disposes every geometry and material it creates exactly once on teardown", () => {
        const scene = new THREE.Scene();
        const objects = populateQuantumTunnelingScene(scene, computeBarrierVisualWidth({ L: 0.005 }, null));
        expect(objects.barrier.scale.x).toBeCloseTo(1.25, 5);

        const geometries = new Set<THREE.BufferGeometry>();
        const materials = new Set<THREE.Material>();
        scene.traverse((node) => {
            const { geometry, material } = node as THREE.Mesh;
            if (geometry) geometries.add(geometry);
            if (material) for (const m of [material].flat()) materials.add(m);
        });

        // The three particles share one sphere geometry but keep their own materials.
        const particleGeometries = new Set([objects.incomingParticle, objects.transmittedParticle, objects.reflectedParticle].map((p) => p.geometry));
        expect(particleGeometries.size).toBe(1);
        expect(materials.has(objects.incomingParticle.material)).toBe(true);
        expect(objects.transmittedParticle.material).not.toBe(objects.reflectedParticle.material);

        const geomSpies = Array.from(geometries).map((g) => vi.spyOn(g, "dispose"));
        const matSpies = Array.from(materials).map((m) => vi.spyOn(m, "dispose"));

        disposeObject3D(scene);

        geomSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
        matSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    });
});
