import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import { createSpringGeometry, updateSpringGeometry } from "./ShoScene";
import { disposeObject3D } from "@/simulation/sceneUtils";

describe("ShoScene spring geometry (T26)", () => {
    it("reshapes the spring in place without allocating or disposing the live geometry", () => {
        const geometry = createSpringGeometry(50);
        const position = geometry.getAttribute("position") as THREE.BufferAttribute;
        const vertexCount = position.count;
        const before = Float32Array.from(position.array);
        const disposeSpy = vi.spyOn(geometry, "dispose");

        // Simulate a long oscillation: many length changes.
        for (let i = 0; i < 120; i++) {
            const length = 40 + 30 * Math.sin(i / 10);
            expect(updateSpringGeometry(geometry, length)).toBe(geometry);
        }

        expect(geometry.getAttribute("position")).toBe(position);
        expect(position.count).toBe(vertexCount);
        expect(position.version).toBeGreaterThan(0);
        expect(Array.from(position.array)).not.toEqual(Array.from(before));
        expect(disposeSpy).not.toHaveBeenCalled();
    });

    it("disposes the temporary geometry used to compute each reshape", () => {
        const geometry = createSpringGeometry(50);
        const disposeSpy = vi.spyOn(THREE.BufferGeometry.prototype, "dispose");
        updateSpringGeometry(geometry, 80);
        expect(disposeSpy).toHaveBeenCalledTimes(1);
        disposeSpy.mockRestore();
    });

    it("matches a freshly built spring of the same length", () => {
        const geometry = createSpringGeometry(50);
        updateSpringGeometry(geometry, 72);
        const fresh = createSpringGeometry(72);
        expect(Array.from(geometry.getAttribute("position").array)).toEqual(
            Array.from(fresh.getAttribute("position").array)
        );
    });

    it("disposes spring, mass, wall and light resources on teardown", () => {
        const scene = new THREE.Scene();
        const light = new THREE.DirectionalLight(0xffffff, 1);
        scene.add(light);
        const spring = new THREE.Mesh(createSpringGeometry(50), new THREE.MeshStandardMaterial());
        const mass = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshStandardMaterial());
        const texture = new THREE.Texture();
        const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 50, 50), new THREE.MeshStandardMaterial({ map: texture }));
        scene.add(spring, mass, wall);

        const spies = [spring, mass, wall].flatMap((m) => [
            vi.spyOn(m.geometry, "dispose"),
            vi.spyOn(m.material, "dispose"),
        ]);
        const textureSpy = vi.spyOn(texture, "dispose");
        const shadowSpy = vi.spyOn(light.shadow, "dispose");

        disposeObject3D(scene);

        spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
        expect(textureSpy).toHaveBeenCalledTimes(1);
        expect(shadowSpy).toHaveBeenCalledTimes(1);
    });
});
