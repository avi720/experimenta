import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createCameraControls } from './controls/cameraControls';

const MAX_PIXEL_RATIO = 2;

/** The brand's `space` colour (docs/BRAND.md); fog fades distant geometry into it. */
export const SPACE_COLOR = 0x0b0912;

/** Scene-graph node fields read during disposal; most nodes have none of them. */
type DisposableNode = THREE.Object3D & {
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material | THREE.Material[];
    isLight?: boolean;
    dispose?: () => void;
};

function isTexture(value: unknown): value is THREE.Texture {
    return !!value && typeof value === 'object' && 'isTexture' in value && !!value.isTexture;
}

function disposeMaterialTextures(material: THREE.Material, textures: Set<THREE.Texture>) {
    Object.values(material).forEach((value: unknown) => {
        if (isTexture(value)) {
            textures.add(value);
        }
    });
}

/**
 * Releases the GPU resources held by an object tree: every unique geometry, material,
 * texture referenced by a material, and light shadow map. Shared resources are disposed once.
 * @param {THREE.Object3D} root
 */
export function disposeObject3D(root: THREE.Object3D | null | undefined) {
    if (!root) return;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    root.traverse((object) => {
        const node: DisposableNode = object;
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

    const background: unknown = 'background' in root ? root.background : undefined;
    if (isTexture(background)) {
        textures.add(background);
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
export function disposeRenderer(renderer: THREE.WebGLRenderer | null | undefined, mountElement: HTMLElement | null | undefined) {
    if (!renderer) return;
    const canvas = renderer.domElement;
    if (mountElement && canvas && canvas.parentNode === mountElement) {
        mountElement.removeChild(canvas);
    }
    renderer.dispose();
}

export type ShadowCameraOptions = {
    near?: number;
    far?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
};

const SHADOW_CAMERA_KEYS = ['near', 'far', 'left', 'right', 'top', 'bottom'] as const;

export type StandardLightOptions = {
    ambientIntensity?: number;
    directionalIntensity?: number;
    directionalPosition?: number[];
    castShadow?: boolean;
    shadowMapSize?: number;
    shadowCamera?: ShadowCameraOptions;
};

/**
 * Adds the standard light rig to `scene`: a cool hemisphere fill (space above, dark floor below),
 * a warm key light that casts the shadows, and a violet rim light from behind that separates
 * objects from the dark background.
 * @param {THREE.Scene} scene
 * @param {object} [options]
 * @param {number} [options.ambientIntensity=0.7] - Hemisphere fill intensity.
 * @param {number} [options.directionalIntensity=0.8] - Key light intensity; the rim is 60% of it.
 * @param {number[]} [options.directionalPosition=[50, 80, 30]] - Key light position; the rim mirrors it in X/Z.
 * @param {boolean} [options.castShadow=true]
 * @param {number} [options.shadowMapSize=2048]
 * @param {{near?: number, far?: number, left?: number, right?: number, top?: number, bottom?: number}} [options.shadowCamera]
 *   Overrides for the key light's shadow camera; unset fields keep three's defaults.
 * @returns {{ambientLight: THREE.HemisphereLight, directionalLight: THREE.DirectionalLight, rimLight: THREE.DirectionalLight}}
 */
export function addStandardLights(scene: THREE.Scene, options: StandardLightOptions = {}) {
    const {
        ambientIntensity = 0.7,
        directionalIntensity = 0.8,
        directionalPosition = [50, 80, 30],
        castShadow = true,
        shadowMapSize = 2048,
        shadowCamera = {},
    } = options;

    const ambientLight = new THREE.HemisphereLight(0xc9d6ff, 0x1a1426, ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff1e0, directionalIntensity);
    directionalLight.position.fromArray(directionalPosition);
    directionalLight.castShadow = castShadow;
    directionalLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    directionalLight.shadow.bias = -0.0005;
    SHADOW_CAMERA_KEYS.forEach((key) => {
        const value = shadowCamera[key];
        if (value !== undefined) {
            directionalLight.shadow.camera[key] = value;
        }
    });
    directionalLight.shadow.camera.updateProjectionMatrix();
    scene.add(directionalLight);

    const [kx = 0, ky = 0, kz = 0] = directionalPosition;
    const rimLight = new THREE.DirectionalLight(0xb48cff, directionalIntensity * 0.6);
    rimLight.position.set(-kx, ky * 0.6, -kz);
    scene.add(rimLight);

    return { ambientLight, directionalLight, rimLight };
}

/**
 * Creates a horizontal ground plane (rotated into the XZ plane) that receives shadows.
 * @param {number} width
 * @param {number} depth
 * @param {THREE.Material} material
 * @param {number} [y=0]
 * @returns {THREE.Mesh}
 */
export function createGroundPlane(width: number, depth: number, material: THREE.Material, y = 0): THREE.Mesh {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = y;
    ground.receiveShadow = true;
    ground.name = 'ground';
    return ground;
}

export type SceneSetupOptions = {
    background?: number | null;
    fog?: { near: number; far: number };
    environment?: boolean;
    fov?: number;
    near?: number;
    far?: number;
    cameraPosition?: number[];
    target?: number[];
    shadows?: boolean;
    lights?: StandardLightOptions;
    controls?: { minDistance?: number; maxDistance?: number; maxPolarAngle?: number };
};

export type SceneSetup = {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    lights: ReturnType<typeof addStandardLights>;
    start: (onFrame?: (time: number) => void) => void;
    dispose: () => void;
};

/**
 * The single setup/teardown path for the simulation's three.js scenes: scene, camera, renderer,
 * standard lights, camera controls, resize handling and the render loop.
 *
 * Resizing follows the mount element (ResizeObserver), so the canvas also adapts when a side
 * panel opens or closes, not only on window resize.
 *
 * @param {HTMLElement} mountElement - The DOM element to attach the renderer canvas to.
 * Scenes render on a transparent canvas by default, so the workspace's space backdrop shows
 * through; fog fades distant geometry into the same space colour. A studio environment map
 * (RoomEnvironment) gives metals real reflections, and ACES tone mapping keeps emissive
 * highlights from clipping.
 *
 * @param {object} [options]
 * @param {number | null} [options.background=null] - Solid colour, or null for a transparent canvas.
 * @param {{near: number, far: number}} [options.fog] - Linear fog in the brand's space colour.
 * @param {boolean} [options.environment=true] - Studio reflections for physically based materials.
 * @param {number} [options.fov=75]
 * @param {number} [options.near=0.1]
 * @param {number} [options.far=1000]
 * @param {number[]} [options.cameraPosition=[0, 50, 150]]
 * @param {number[]} [options.target=[0, 0, 0]] - Point the camera looks at and orbits around.
 * @param {boolean} [options.shadows=true] - Enables PCF soft shadow maps on the renderer.
 * @param {object} [options.lights] - Passed to addStandardLights.
 * @param {{minDistance?: number, maxDistance?: number, maxPolarAngle?: number}} [options.controls]
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer,
 *   controls: object, lights: ReturnType<typeof addStandardLights>, start: (onFrame?: (time: number) => void) => void, dispose: () => void}}
 *   `start` runs the rAF loop: controls.update() (damping), then `onFrame`, then render.
 *   `dispose` cancels the loop, disconnects the observer, disposes the controls, every
 *   geometry/material/texture in the scene (including objects the caller added), the renderer,
 *   and removes the canvas from `mountElement`.
 */
export function setupScene(mountElement: HTMLElement, options: SceneSetupOptions = {}): SceneSetup {
    const {
        background = null,
        fog,
        environment = true,
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
    if (background !== null) {
        scene.background = new THREE.Color(background);
    }
    if (fog) {
        scene.fog = new THREE.Fog(SPACE_COLOR, fog.near, fog.far);
    }

    const camera = new THREE.PerspectiveCamera(fov, height > 0 ? width / height : 1, near, far);
    camera.position.fromArray(cameraPosition);
    camera.lookAt(new THREE.Vector3().fromArray(target));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background === null });
    if (background === null) {
        renderer.setClearColor(0x000000, 0);
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
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

    const lightRig = addStandardLights(scene, lights);

    let environmentMap: THREE.Texture | null = null;
    if (environment) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        environmentMap = pmrem.fromScene(room, 0.04).texture;
        room.dispose();
        pmrem.dispose();
        scene.environment = environmentMap;
        scene.environmentIntensity = 0.55;
    }

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

    let animationFrameId: number | null = null;
    let isDisposed = false;

    const start = (onFrame?: (time: number) => void) => {
        if (isDisposed || animationFrameId !== null) return;
        const loop = (time: number) => {
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
        environmentMap?.dispose();
        scene.clear();
        disposeRenderer(renderer, mountElement);
    };

    return { scene, camera, renderer, controls, lights: lightRig, start, dispose };
}
