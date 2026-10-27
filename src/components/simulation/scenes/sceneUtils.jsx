import * as THREE from 'three';

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
 * Sets up a basic Three.js scene with lighting and a ground plane.
 * @param {HTMLElement} mountElement - The DOM element to attach the renderer to.
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, dispose: () => void}}
 *   `dispose` releases everything in the scene graph (including objects the caller added),
 *   disposes the renderer and removes its canvas from `mountElement`.
 */
export function setupBasicScene(mountElement) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    const camera = new THREE.PerspectiveCamera(
        75,
        mountElement.clientWidth / mountElement.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountElement.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // ForestGreen
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const dispose = () => {
        disposeObject3D(scene);
        scene.clear();
        disposeRenderer(renderer, mountElement);
    };

    return { scene, camera, renderer, dispose };
}
