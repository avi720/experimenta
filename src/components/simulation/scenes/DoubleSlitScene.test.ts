import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
    createSlitPlate,
    detectionsAt,
    fillPatternData,
    formatWavelength,
    patternHalfWidth,
    screenOffsetFor,
    screenUnitFor,
    slitGapFor,
    slitOpeningFor,
} from "./DoubleSlitScene";
import { calculateInterference } from "@/simulation/engines/doubleSlitEngine";

describe("DoubleSlitScene apparatus", () => {
    it("moves the screen further away as the screen distance grows", () => {
        expect(screenOffsetFor(5)).toBeGreaterThan(screenOffsetFor(1));
        expect(screenOffsetFor(1)).toBeGreaterThan(screenOffsetFor(0.1));
    });

    it("widens the slit gap with the slit spacing, within the plate", () => {
        expect(slitGapFor(250)).toBeGreaterThan(slitGapFor(1));
        expect(slitGapFor(0.1)).toBeGreaterThan(0);
        expect(slitGapFor(100000)).toBe(slitGapFor(2000));
    });

    it("draws each opening in proportion to the width-to-spacing ratio", () => {
        const gap = slitGapFor(250);
        expect(slitOpeningFor(gap, 250, 50)).toBeCloseTo(gap * 0.2, 9);
        // Never wider than the gap (the slits would merge) and never invisible.
        expect(slitOpeningFor(gap, 250, 500)).toBeLessThan(gap);
        expect(slitOpeningFor(gap, 250, 0.01)).toBeGreaterThan(0);
    });

    it("leaves two open slits centred at ±gap/2", () => {
        const { group, slitCenters } = createSlitPlate(2, 0.3, new THREE.MeshBasicMaterial());
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

describe("DoubleSlitScene screen", () => {
    const light = calculateInterference({ source: "light", wavelength: 532, slit_spacing: 250, slit_width: 50, screen_distance: 1 });

    it("spans the pattern's own window and puts the central maximum in the middle", () => {
        const half = patternHalfWidth(light);
        expect(half).toBeCloseTo(light[light.length - 1].position, 9);
        const data = fillPatternData(new Uint8Array(1024 * 4), light);
        expect(data[512 * 4]).toBeGreaterThan(245);
        // The first dark fringe, half a fringe spacing (λD/2d = 1.064 mm) from the centre.
        const texel = Math.round(512 + (1.064 / (2 * half)) * 1024 - 0.5);
        expect(data[texel * 4]).toBeLessThan(10);
    });

    it("stays dark without a pattern", () => {
        const data = fillPatternData(new Uint8Array(16 * 4).fill(9), null);
        expect(Array.from(data).every((v) => v === 0)).toBe(true);
    });

    it("reads the scale in mm for light and in µm for electrons", () => {
        const electrons = calculateInterference({ source: "electron", accelerating_voltage: 50, slit_spacing: 1, slit_width: 0.2, screen_distance: 1 });
        expect(screenUnitFor(patternHalfWidth(light)).unit).toBe("mm");
        expect(screenUnitFor(patternHalfWidth(electrons)).unit).toBe("µm");
        expect(screenUnitFor(5e-4).unit).toBe("nm");
    });

    it("labels the wavelength with three significant figures", () => {
        expect(formatWavelength(532e-9)).toBe("λ = 532 nm");
        expect(formatWavelength(5.3553e-12)).toBe("λ = 5.36 pm");
    });

    it("lets electrons arrive slowly at first, then faster, up to a cap", () => {
        expect(detectionsAt(0)).toBe(0);
        expect(detectionsAt(1)).toBeLessThan(40);
        expect(detectionsAt(10) - detectionsAt(9)).toBeGreaterThan(detectionsAt(2) - detectionsAt(1));
        expect(detectionsAt(1000)).toBe(detectionsAt(2000));
    });
});
