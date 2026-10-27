import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Mouse mapping shared by every simulation scene: left = pan, middle = dolly, right = rotate. */
export const SIMULATION_MOUSE_BUTTONS = Object.freeze({
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
});

const RIGHT_BUTTON = 2;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * Converts a pointer event's client coordinates into normalized device coordinates
 * (-1..1 on both axes, +Y up) relative to `rect`.
 * @returns {THREE.Vector2 | null} null when the rect has no area.
 */
export function pointerToNdc(
    clientX: number,
    clientY: number,
    rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> | null | undefined
): THREE.Vector2 | null {
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
    );
}

function isEffectivelyVisible(object: THREE.Object3D): boolean {
    for (let node: THREE.Object3D | null = object; node; node = node.parent) {
        if (!node.visible) return false;
    }
    return true;
}

/**
 * Raycasts `root` from `camera` through `ndc` and returns the nearest visible hit point.
 * @returns {THREE.Vector3 | null}
 */
export function pickPivotPoint(
    root: THREE.Object3D | null | undefined,
    camera: THREE.Camera | null | undefined,
    ndc: THREE.Vector2 | null | undefined,
    raycaster: THREE.Raycaster = new THREE.Raycaster()
): THREE.Vector3 | null {
    if (!root || !camera || !ndc) return null;
    camera.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(root, true).find((h) => isEffectivelyVisible(h.object));
    return hit ? hit.point.clone() : null;
}

type PivotTargetArgs = {
    cameraPosition: THREE.Vector3;
    currentTarget: THREE.Vector3;
    hitPoint: THREE.Vector3 | null | undefined;
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
};

export type CameraControlsOptions = {
    pickRoot?: THREE.Object3D | null;
    target?: THREE.Vector3 | number[];
    minDistance?: number;
    maxDistance?: number;
    maxPolarAngle?: number;
};

/**
 * Computes the orbit pivot for a right-click on `hitPoint` without moving the camera.
 *
 * The new target lies on the ray from the camera through the hit point. When the hit is closer
 * than `minDistance` (or farther than `maxDistance`) it is moved along that ray to the limit,
 * because OrbitControls would otherwise snap the camera to the allowed range. When the camera
 * would sit outside the allowed polar range around the new pivot, the current target is kept for
 * the same reason. Inputs are not mutated.
 *
 * @param {object} args
 * @param {THREE.Vector3} args.cameraPosition
 * @param {THREE.Vector3} args.currentTarget
 * @param {THREE.Vector3 | null} args.hitPoint
 * @param {number} [args.minDistance=0]
 * @param {number} [args.maxDistance=Infinity]
 * @param {number} [args.minPolarAngle=0]
 * @param {number} [args.maxPolarAngle=Math.PI]
 * @returns {THREE.Vector3} the new target (a copy of `currentTarget` when the hit is rejected)
 */
export function computePivotTarget({
    cameraPosition,
    currentTarget,
    hitPoint,
    minDistance = 0,
    maxDistance = Infinity,
    minPolarAngle = 0,
    maxPolarAngle = Math.PI,
}: PivotTargetArgs): THREE.Vector3 {
    if (!hitPoint) return currentTarget.clone();

    const ray = hitPoint.clone().sub(cameraPosition);
    const distance = ray.length();
    if (distance === 0) return currentTarget.clone();

    // Polar angle of the camera as seen from the pivot (OrbitControls' phi, measured from +Y).
    const polar = ray.clone().negate().angleTo(WORLD_UP);
    if (polar < minPolarAngle || polar > maxPolarAngle) return currentTarget.clone();

    const clamped = Math.min(Math.max(distance, minDistance), maxDistance);
    return cameraPosition.clone().addScaledVector(ray.divideScalar(distance), clamped);
}

/**
 * Creates three's OrbitControls configured for the simulation scenes: left = pan,
 * right = rotate around the point under the cursor, wheel/middle = dolly, damping on,
 * default touch gestures.
 *
 * On a right-button pointerdown the scene (`pickRoot`) is raycast; if a visible object or the
 * ground is hit, the controls' target moves to that point while the camera position stays put.
 * If nothing is hit, the current target is kept.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {HTMLElement} domElement - The renderer canvas.
 * @param {object} [options]
 * @param {THREE.Object3D} [options.pickRoot] - Object tree to raycast for the pivot (usually the scene).
 * @param {THREE.Vector3 | number[]} [options.target]
 * @param {number} [options.minDistance]
 * @param {number} [options.maxDistance]
 * @param {number} [options.maxPolarAngle]
 * @returns {OrbitControls} controls whose `dispose()` also removes the pivot listener.
 */
export function createCameraControls(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    options: CameraControlsOptions = {}
): OrbitControls {
    const { pickRoot = null, target, minDistance, maxDistance, maxPolarAngle } = options;

    const controls = new OrbitControls(camera, domElement);
    controls.mouseButtons = { ...SIMULATION_MOUSE_BUTTONS };
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    if (minDistance !== undefined) controls.minDistance = minDistance;
    if (maxDistance !== undefined) controls.maxDistance = maxDistance;
    if (maxPolarAngle !== undefined) controls.maxPolarAngle = maxPolarAngle;
    if (target) {
        if (Array.isArray(target)) controls.target.fromArray(target);
        else controls.target.copy(target);
    }
    controls.update();

    const raycaster = new THREE.Raycaster();

    const onPointerDown = (event: PointerEvent) => {
        if (!controls.enabled || !pickRoot || event.button !== RIGHT_BUTTON) return;
        const ndc = pointerToNdc(event.clientX, event.clientY, domElement.getBoundingClientRect());
        const hitPoint = pickPivotPoint(pickRoot, camera, ndc, raycaster);
        if (!hitPoint) return;
        controls.target.copy(computePivotTarget({
            cameraPosition: camera.position,
            currentTarget: controls.target,
            hitPoint,
            minDistance: controls.minDistance,
            maxDistance: controls.maxDistance,
            minPolarAngle: controls.minPolarAngle,
            maxPolarAngle: controls.maxPolarAngle,
        }));
    };
    domElement.addEventListener('pointerdown', onPointerDown);

    const disposeOrbit = controls.dispose.bind(controls);
    controls.dispose = () => {
        domElement.removeEventListener('pointerdown', onPointerDown);
        disposeOrbit();
    };

    return controls;
}
