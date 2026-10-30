import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import { createDropTower, disposeObject3D } from "./FreeFallScene";

function collectResources(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    root.traverse((node) => {
        const { geometry, material } = node as THREE.Mesh;
        if (geometry) geometries.add(geometry);
        if (material) for (const m of [material].flat()) materials.add(m);
    });
    return { geometries, materials };
}

describe("FreeFallScene drop tower resource management (T25)", () => {
    it("keeps the same number of geometries and materials at every release height", () => {
        const low = collectResources(createDropTower(2).group);
        const high = collectResources(createDropTower(500).group);

        expect(high.geometries.size).toBe(low.geometries.size);
        expect(high.materials.size).toBe(low.materials.size);
    });

    it("disposes every geometry and material exactly once on rebuild", () => {
        const tower = createDropTower(120);
        const { geometries, materials } = collectResources(tower.group);

        const geomSpies = Array.from(geometries).map((g) => vi.spyOn(g, "dispose"));
        const matSpies = Array.from(materials).map((m) => vi.spyOn(m, "dispose"));

        disposeObject3D(tower.group);

        geomSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
        matSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    });

    it("rests the ball's lowest point at the release height", () => {
        const tower = createDropTower(50);
        expect(tower.ball.position.y - tower.ballRadius).toBeCloseTo(50, 6);
        expect(tower.heightMarker.position.y).toBeCloseTo(50, 6);
    });
});
