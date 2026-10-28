import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createSlitPlate, fillPatternData, screenOffsetFor, slitGapFor } from "./DoubleSlitScene";
import { calculateInterference } from "@/simulation/engines/doubleSlitEngine";

describe("DoubleSlitScene apparatus", () => {
    it("moves the screen further away as the screen distance grows", () => {
        expect(screenOffsetFor(5)).toBeGreaterThan(screenOffsetFor(1));
        expect(screenOffsetFor(1)).toBeGreaterThan(screenOffsetFor(0.1));
    });

    it("widens the slit gap with the slit separation, within the plate", () => {
        expect(slitGapFor(10000)).toBeGreaterThan(slitGapFor(2000));
        expect(slitGapFor(500)).toBeGreaterThan(0);
        expect(slitGapFor(100000)).toBe(slitGapFor(10000));
    });

    it("leaves two open slits centred at ±gap/2", () => {
        const { group, slitCenters } = createSlitPlate(2, new THREE.MeshBasicMaterial());
        expect(slitCenters).toEqual([-1, 1]);
        const blocks = group.children as THREE.Mesh[];
        expect(blocks).toHaveLength(5);
        // No block covers a slit centre at the beam height (y = 0).
        for (const z of slitCenters) {
            const covering = blocks.filter((block) => {
                block.geometry.computeBoundingBox();
                const box = block.geometry.boundingBox!.clone().translate(block.position);
                return box.containsPoint(new THREE.Vector3(0, 0, z));
            });
            expect(covering).toHaveLength(0);
        }
    });
});

describe("DoubleSlitScene pattern texture", () => {
    it("normalizes the engine pattern so the central maximum is full brightness", () => {
        const pattern = calculateInterference({ wavelength: 500, slit_separation: 10000, screen_distance: 1 });
        const data = fillPatternData(new Uint8Array(512 * 4), pattern);
        const centre = data[256 * 4];
        expect(centre).toBeGreaterThan(245);
        // Fringe spacing λD/d = 50 mm: the first minima sit at ±25 mm, the screen edges.
        expect(data[0]).toBeLessThan(10);
        expect(data[511 * 4]).toBeLessThan(10);
    });

    it("stays dark without a pattern", () => {
        const data = fillPatternData(new Uint8Array(16 * 4).fill(9), null);
        expect(Array.from(data).every((v) => v === 0)).toBe(true);
    });
});
