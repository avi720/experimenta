import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import {
    SIMULATION_MOUSE_BUTTONS,
    computePivotTarget,
    createCameraControls,
    pickPivotPoint,
    pointerToNdc,
} from "./cameraControls";

function makeCamera(position = [0, 10, 30], lookAt = [0, 0, 0]) {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.fromArray(position);
    camera.lookAt(new THREE.Vector3().fromArray(lookAt));
    camera.updateMatrixWorld();
    return camera;
}

function makeGroundScene() {
    const scene = new THREE.Scene();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial());
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    scene.updateMatrixWorld();
    return { scene, ground };
}

/** Minimal stand-in for a canvas: enough for OrbitControls to connect and handle pointer events (a test double, hence the cast). */
function makeDomElement(): HTMLElement {
    const root = new EventTarget();
    return Object.assign(new EventTarget(), {
        style: {},
        clientWidth: 400,
        clientHeight: 400,
        getRootNode: () => root,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
        setPointerCapture: () => {},
        releasePointerCapture: () => {},
    }) as unknown as HTMLElement;
}

function pointerDown(props: Partial<PointerEventInit>) {
    return Object.assign(new Event("pointerdown"), {
        pointerId: 1,
        pointerType: "mouse",
        clientX: 200,
        clientY: 200,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...props,
    });
}

describe("pointerToNdc", () => {
    it("maps the rect centre to the origin and corners to ±1 with +Y up", () => {
        const rect = { left: 10, top: 20, width: 200, height: 100 };
        expect(pointerToNdc(110, 70, rect)?.toArray()).toEqual([0, 0]);
        expect(pointerToNdc(10, 20, rect)?.toArray()).toEqual([-1, 1]);
        expect(pointerToNdc(210, 120, rect)?.toArray()).toEqual([1, -1]);
    });

    it("returns null for an empty rect", () => {
        expect(pointerToNdc(0, 0, { left: 0, top: 0, width: 0, height: 10 })).toBeNull();
    });
});

describe("computePivotTarget", () => {
    const cameraPosition = new THREE.Vector3(0, 10, 30);
    const currentTarget = new THREE.Vector3(0, 0, 0);

    it("moves the target to the hit point and leaves the camera untouched", () => {
        const before = cameraPosition.clone();
        const hitPoint = new THREE.Vector3(5, 0, -10);
        const next = computePivotTarget({ cameraPosition, currentTarget, hitPoint, minDistance: 5, maxDistance: 100 });

        expect(next.toArray()).toEqual(hitPoint.toArray());
        expect(next).not.toBe(currentTarget);
        expect(cameraPosition.toArray()).toEqual(before.toArray());
        expect(currentTarget.toArray()).toEqual([0, 0, 0]);
    });

    it("keeps the current target when nothing was hit", () => {
        const next = computePivotTarget({ cameraPosition, currentTarget, hitPoint: null });
        expect(next.toArray()).toEqual(currentTarget.toArray());
        expect(next).not.toBe(currentTarget);
    });

    it("pulls a too-close hit out to minDistance along the click ray so the camera does not jump", () => {
        const hitPoint = new THREE.Vector3(0, 10, 28); // 2 units in front of the camera
        const next = computePivotTarget({ cameraPosition, currentTarget, hitPoint, minDistance: 5 });
        expect(next.distanceTo(cameraPosition)).toBeCloseTo(5, 10);
        expect(next.toArray().map((v) => +v.toFixed(10))).toEqual([0, 10, 25]);
    });

    it("pulls a too-far hit in to maxDistance along the click ray", () => {
        const hitPoint = new THREE.Vector3(0, 10, -170); // 200 units away
        const next = computePivotTarget({ cameraPosition, currentTarget, hitPoint, maxDistance: 100 });
        expect(next.distanceTo(cameraPosition)).toBeCloseTo(100, 10);
    });

    it("keeps the current target when the camera would fall outside the polar limit", () => {
        // Pivot above the camera: the camera would sit below the pivot's horizon (phi > PI/2).
        const hitPoint = new THREE.Vector3(0, 40, 0);
        const next = computePivotTarget({
            cameraPosition,
            currentTarget,
            hitPoint,
            maxPolarAngle: Math.PI / 2,
        });
        expect(next.toArray()).toEqual(currentTarget.toArray());
    });
});

describe("pickPivotPoint", () => {
    it("returns the nearest visible hit under the pointer", () => {
        const { scene } = makeGroundScene();
        const camera = makeCamera([0, 10, 30], [0, 0, 0]);
        const point = pickPivotPoint(scene, camera, new THREE.Vector2(0, 0));
        expect(point).not.toBeNull();
        expect(point?.x).toBeCloseTo(0, 6);
        expect(point?.y).toBeCloseTo(0, 6);
        expect(point?.z).toBeCloseTo(0, 6);
    });

    it("ignores hidden objects and returns null when nothing visible is hit", () => {
        const { scene, ground } = makeGroundScene();
        const box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshBasicMaterial());
        box.position.set(0, 2, 0);
        box.visible = false;
        scene.add(box);
        scene.updateMatrixWorld();
        const camera = makeCamera([0, 10, 30], [0, 0, 0]);

        const throughHiddenBox = pickPivotPoint(scene, camera, new THREE.Vector2(0, 0));
        expect(throughHiddenBox?.y).toBeCloseTo(0, 6); // ground, not the box top

        ground.visible = false;
        expect(pickPivotPoint(scene, camera, new THREE.Vector2(0, 0))).toBeNull();
    });
});

describe("createCameraControls", () => {
    it("uses left = pan, middle = dolly, right = rotate with damping on and default touches", () => {
        const camera = makeCamera();
        const controls = createCameraControls(camera, makeDomElement(), { minDistance: 5, maxDistance: 100 });

        expect(controls.mouseButtons).toEqual(SIMULATION_MOUSE_BUTTONS);
        expect(SIMULATION_MOUSE_BUTTONS).toEqual({
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
        });
        expect(controls.enableDamping).toBe(true);
        expect(controls.touches).toEqual({ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN });
        expect(controls.minDistance).toBe(5);
        expect(controls.maxDistance).toBe(100);
        controls.dispose();
    });

    it("keeps the initial camera position and target", () => {
        const camera = makeCamera([80, 60, 120], [0, 25, 0]);
        const controls = createCameraControls(camera, makeDomElement(), { target: [0, 25, 0] });
        expect(controls.target.toArray()).toEqual([0, 25, 0]);
        expect(camera.position.toArray().map((v) => +v.toFixed(10))).toEqual([80, 60, 120]);
        controls.dispose();
    });

    it("moves the pivot to the right-clicked point without moving the camera", () => {
        const { scene } = makeGroundScene();
        const camera = makeCamera([0, 10, 30], [0, 0, 0]);
        const domElement = makeDomElement();
        const controls = createCameraControls(camera, domElement, { pickRoot: scene, target: [0, 0, 0] });
        controls.target.set(10, 0, 0); // pivot elsewhere before the click
        const cameraBefore = camera.position.clone();

        domElement.dispatchEvent(pointerDown({ button: 2 }));

        expect(controls.target.x).toBeCloseTo(0, 6);
        expect(controls.target.y).toBeCloseTo(0, 6);
        expect(controls.target.z).toBeCloseTo(0, 6);
        expect(camera.position.toArray()).toEqual(cameraBefore.toArray());
        controls.dispose();
    });

    it("leaves the pivot alone on a left click or when the click hits nothing", () => {
        const scene = new THREE.Scene();
        const camera = makeCamera([0, 10, 30], [0, 0, 0]);
        const domElement = makeDomElement();
        const controls = createCameraControls(camera, domElement, { pickRoot: scene, target: [1, 2, 3] });

        domElement.dispatchEvent(pointerDown({ button: 2 })); // empty scene: no hit
        expect(controls.target.toArray()).toEqual([1, 2, 3]);
        controls.dispose();

        const { scene: groundScene } = makeGroundScene();
        const domElement2 = makeDomElement();
        const controls2 = createCameraControls(camera, domElement2, { pickRoot: groundScene, target: [1, 2, 3] });
        domElement2.dispatchEvent(pointerDown({ button: 0 })); // pan, not rotate
        expect(controls2.target.toArray()).toEqual([1, 2, 3]);
        controls2.dispose();
    });

    it("removes its listeners on dispose", () => {
        const { scene } = makeGroundScene();
        const camera = makeCamera([0, 10, 30], [0, 0, 0]);
        const domElement = makeDomElement();
        const removeSpy = vi.spyOn(domElement, "removeEventListener");
        const controls = createCameraControls(camera, domElement, { pickRoot: scene, target: [10, 0, 0] });

        controls.dispose();
        domElement.dispatchEvent(pointerDown({ button: 2 }));

        expect(controls.target.toArray()).toEqual([10, 0, 0]);
        const removed = removeSpy.mock.calls.map(([type]) => type);
        expect(removed).toEqual(expect.arrayContaining(["pointerdown", "pointermove", "pointerup", "wheel", "contextmenu"]));
    });
});
