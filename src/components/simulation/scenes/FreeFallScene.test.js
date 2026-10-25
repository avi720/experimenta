import { describe, it, expect, vi } from "vitest";
import { createBuildingWithWindows, disposeObject3D } from "./FreeFallScene.jsx";

describe("FreeFallScene resource management (T25)", () => {
    it("shares window geometries across floors and disposes all geometries and materials on rebuild", () => {
        const building = createBuildingWithWindows(500);
        const geometries = new Set();
        const materials = new Set();

        building.traverse((node) => {
            if (node.geometry) geometries.add(node.geometry);
            if (node.material) materials.add(node.material);
        });

        // 4 unique geometries: main building box, door box, front/back window box, left/right window box
        expect(geometries.size).toBe(4);
        expect(materials.size).toBe(3);

        const geomSpies = Array.from(geometries).map((g) => vi.spyOn(g, "dispose"));
        const matSpies = Array.from(materials).map((m) => vi.spyOn(m, "dispose"));

        disposeObject3D(building);

        geomSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
        matSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    });
});
