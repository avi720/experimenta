import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { createOrbitControls } from "./orbitControls.jsx";

function pointerEvent(type, props = {}) {
    return Object.assign(new Event(type), { clientX: 0, clientY: 0, button: 0 }, props);
}

describe("orbitControls disposal (T26)", () => {
    let doc;
    let domElement;
    let camera;

    beforeEach(() => {
        doc = new EventTarget();
        vi.stubGlobal("document", doc);
        domElement = Object.assign(new EventTarget(), { clientHeight: 500 });
        camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.set(0, 0, 50);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("removes document pointermove/pointerup listeners when disposed mid-drag", () => {
        const addSpy = vi.spyOn(doc, "addEventListener");
        const removeSpy = vi.spyOn(doc, "removeEventListener");
        const controls = createOrbitControls(camera, domElement);

        domElement.dispatchEvent(pointerEvent("pointerdown", { button: 0, clientX: 10, clientY: 10 }));
        expect(controls.state).toBe(controls.STATE.PAN);

        const added = addSpy.mock.calls.map(([type, fn]) => [type, fn]);
        expect(added.map(([type]) => type).sort()).toEqual(["pointermove", "pointerup"]);

        controls.dispose();

        added.forEach(([type, fn]) => {
            expect(removeSpy).toHaveBeenCalledWith(type, fn);
        });
        expect(controls.state).toBe(controls.STATE.NONE);

        // A stray move after dispose must not reach the controls.
        doc.dispatchEvent(pointerEvent("pointermove", { clientX: 200, clientY: 200 }));
        expect(controls.panOffset.lengthSq()).toBe(0);
    });

    it("removes element listeners so pointerdown after dispose starts no drag", () => {
        const addSpy = vi.spyOn(doc, "addEventListener");
        const controls = createOrbitControls(camera, domElement);
        controls.dispose();

        domElement.dispatchEvent(pointerEvent("pointerdown", { button: 2 }));
        expect(controls.state).toBe(controls.STATE.NONE);
        expect(addSpy).not.toHaveBeenCalled();
    });
});
