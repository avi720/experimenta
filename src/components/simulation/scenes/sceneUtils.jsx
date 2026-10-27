import * as THREE from 'three';
import { createCameraControls } from '../controls/cameraControls';

const MAX_PIXEL_RATIO = 2;

function disposeMaterialTextures(material, textures) {
    Object.values(material).forEach((value) => {
        if (value && value.isTexture) {
            textures.add(value);
        }
    });
}

/**
 * Releases the GPU resources held by an object tree: every unique geometry, material,
 * texture referenced by a material, and light shadow map. Shared resources are disposed once.
 * @param {THREE.Object3D} root
 */
export function disposeObject3D(root) {
    if (!root) return;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    root.traverse((node) => {
        if (node.geometry) {
            geometries.add(node.geometry);
        }
        if (node.material) {
            if (Array.isArray(node.material)) {
                node.material.forEach((m) => m && materials.add(m));
            } else {
                materials.add(node.material);
            }
        }
        if (node.isLight && typeof node.dispose === 'function') {
            node.dispose();
        }
    });

    if (root.background && root.background.isTexture) {
        textures.add(root.background);
    }

    materials.forEach((mat) => disposeMaterialTextures(mat, textures));

    geometries.forEach((geom) => geom.dispose());
    materials.forEach((mat) => mat.dispose());
    textures.forEach((tex) => tex.dispose());
}

/**
 * Disposes a WebGLRenderer and detaches its canvas from the mount element.
 * @param {THREE.WebGLRenderer} renderer
 * @param {HTMLElement} mountElement
 */
export function disposeRenderer(renderer, mountElement) {
    if (!renderer) return;
    const canvas = renderer.domElement;
    if (mountElement && canvas && canvas.parentNode === mountElement) {
        mountElement.removeChild(canvas);
    }
    renderer.dispose();
}

/**
 * Adds the standard light rig to `scene`: one ambient light and one directional light.
 * @param {THREE.Scene} scene
 * @param {object} [options]
 * @param {number} [options.ambientIntensity=0.7]
 * @param {number} [options.directionalIntensity=0.8]
 * @param {number[]} [options.directionalPosition=[50, 80, 30]]
 * @param {boolean} [options.castShadow=true]
 * @param {number} [options.shadowMapSize=2048]
 * @param {{near?: number, far?: number, left?: number, right?: number, top?: number, bottom?: number}} [options.shadowCamera]
 *   Overrides for the directional light's shadow camera; unset fields keep three's defaults.
 * @returns {{ambientLight: THREE.AmbientLight, directionalLight: THREE.DirectionalLight}}
 */
export function addStandardLights(scene, options = {}) {
    const {
        ambientIntensity = 0.7,
        directionalIntensity = 0.8,
        directionalPosition = [50, 80, 30],
        castShadow = true,
        shadowMapSize = 2048,
        shadowCamera = {},
    } = options;

    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directionalLight.position.fromArray(directionalPosition);
    directionalLight.castShadow = castShadow;
    directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    Object.entries(shadowCamera).forEach(([key, value]) => {
        directionalLight.shadow.camera[key] = value;
    });
    directionalLight.shadow.camera.updateProjectionMatrix();
    scene.add(directionalLight);

    return { ambientLight, directionalLight };
}

/**
 * Creates a horizontal ground plane (rotated into the XZ plane) that receives shadows.
 * @param {number} width
 * @param {number} depth
 * @param {THREE.Material} material
 * @param {number} [y=0]
 * @returns {THREE.Mesh}
 */
export function createGroundPlane(width, depth, material, y = 0) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = y;
    ground.receiveShadow = true;
    ground.name = 'ground';
    return ground;
}

/**
 * The single setup/teardown path for the simulation's three.js scenes: scene, camera, renderer,
 * standard lights, camera controls, resize handling and the render loop.
 *
 * Resizing follows the mount element (ResizeObserver), so the canvas also adapts when a side
 * panel opens or closes, not only on window resize.
 *
 * @param {HTMLElement} mountElement - The DOM element to attach the renderer canvas to.
 * @param {object} [options]
 * @param {number} [options.background=0x87ceeb]
 * @param {number} [options.fov=75]
 * @param {number} [options.near=0.1]
 * @param {number} [options.far=1000]
 * @param {number[]} [options.cameraPosition=[0, 50, 150]]
 * @param {number[]} [options.target=[0, 0, 0]] - Point the camera looks at and orbits around.
 * @param {boolean} [options.shadows=true] - Enables PCF soft shadow maps on the renderer.
 * @param {object} [options.lights] - Passed to addStandardLights.
 * @param {{minDistance?: number, maxDistance?: number, maxPolarAngle?: number}} [options.controls]
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer,
 *   controls: object, start: (onFrame?: (time: number) => void) => void, dispose: () => void}}
 *   `start` runs the rAF loop: controls.update() (damping), then `onFrame`, then render.
 *   `dispose` cancels the loop, disconnects the observer, disposes the controls, every
 *   geometry/material/texture in the scene (including objects the caller added), the renderer,
 *   and removes the canvas from `mountElement`.
 */
export function setupScene(mountElement, options = {}) {
    const {
        background = 0x87ceeb,
        fov = 75,
        near = 0.1,
        far = 1000,
        cameraPosition = [0, 50, 150],
        target = [0, 0, 0],
        shadows = true,
        lights = {},
        controls: controlOptions = {},
    } = options;

    const width = mountElement.clientWidth;
    const height = mountElement.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(fov, height > 0 ? width / height : 1, near, far);
    camera.position.fromArray(cameraPosition);
    camera.lookAt(new THREE.Vector3().fromArray(target));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(width, height, false);
    if (shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    // The canvas fills the mount via CSS so it never holds the container at its old size;
    // the drawing buffer follows the mount through the ResizeObserver below.
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    mountElement.appendChild(canvas);

    addStandardLights(scene, lights);

    const controls = createCameraControls(camera, canvas, {
        ...controlOptions,
        target,
        pickRoot: scene,
    });

    const handleResize = () => {
        const w = mountElement.clientWidth;
        const h = mountElement.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountElement);

    let animationFrameId = null;
    let isDisposed = false;

    const start = (onFrame) => {
        if (isDisposed || animationFrameId !== null) return;
        const loop = (time) => {
            if (isDisposed) return;
            animationFrameId = requestAnimationFrame(loop);
            controls.update();
            if (onFrame) onFrame(time);
            renderer.render(scene, camera);
        };
        animationFrameId = requestAnimationFrame(loop);
    };

    const dispose = () => {
        if (isDisposed) return;
        isDisposed = true;
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        resizeObserver.disconnect();
        controls.dispose();
        disposeObject3D(scene);
        scene.clear();
        disposeRenderer(renderer, mountElement);
    };

    return { scene, camera, renderer, controls, start, dispose };
}
