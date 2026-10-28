import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { SimulationSceneProps } from '@/types/simulation';
import { disposeObject3D, setupScene, type SceneSetup } from '@/simulation/sceneUtils';
import { createLabFloor, createRuler, LAB_COLORS, labMaterials, niceStep } from '@/simulation/labKit';

export { disposeObject3D };

const DEFAULT_H0 = 50;
/** Heights below this keep the apparatus at a readable minimum size. */
const MIN_RIG_HEIGHT = 4;
const REBUILD_THRESHOLD = 0.5;

/** Parts of the drop rig the component updates after it is built. */
export type DropTower = {
    group: THREE.Group;
    ball: THREE.Mesh;
    heightMarker: THREE.Mesh;
    magnetGlow: THREE.MeshStandardMaterial;
    ballRadius: number;
    /** Overall height of the rig, used to frame the camera. */
    extent: number;
};

/**
 * Builds a drop tower for a release height of `h0` metres (1 scene unit = 1 m): a steel lattice
 * mast with an electromagnet release on an arm over the drop line, a polished ball, a landing
 * sensor pad, a metre scale beside the drop line and a marker that tracks the ball's height.
 *
 * The apparatus scales with `h0` so it stays readable from 1 m to 500 m, and the lattice is
 * instanced, so the geometry and material count is the same at every height (T25).
 */
export function createDropTower(h0: number): DropTower {
    const u = Math.max(h0, MIN_RIG_HEIGHT) / 50; // 1 at the default 50 m drop
    const ballRadius = 0.8 * u;
    const magnetHeight = 1.4 * u;
    const top = h0 + 2 * ballRadius + magnetHeight;
    const extent = top + 2 * u;

    const group = new THREE.Group();
    group.name = 'drop-tower';

    const steel = labMaterials.steel();
    const anodized = labMaterials.anodized();
    const graphite = labMaterials.graphite();

    // Lattice mast: four corner posts, a rung ring per bay and one diagonal per face per bay.
    const mastX = -5 * u;
    const mastHalf = 0.9 * u;
    const post = 0.14 * u;
    const bays = Math.max(4, Math.round(extent / (2.6 * u)));
    const bay = extent / bays;
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

    const posts = new THREE.InstancedMesh(unitBox, steel, 4);
    const rungs = new THREE.InstancedMesh(unitBox, steel, bays * 4);
    const braces = new THREE.InstancedMesh(unitBox, steel, bays * 4);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const faceSpan = mastHalf * 2;
    const braceLength = Math.hypot(faceSpan, bay);
    const braceTilt = Math.atan2(faceSpan, bay);

    corners.forEach(([cx, cz], i) => {
        p.set(mastX + cx * mastHalf, extent / 2, cz * mastHalf);
        posts.setMatrixAt(i, m.compose(p, q.identity(), s.set(post, extent, post)));
    });
    for (let b = 0; b < bays; b++) {
        const y = (b + 1) * bay;
        for (let f = 0; f < 4; f++) {
            // Faces: 0 front (+z), 1 right (+x), 2 back (-z), 3 left (-x).
            const alongX = f % 2 === 0;
            const sign = f < 2 ? 1 : -1;
            const cx = alongX ? mastX : mastX + sign * mastHalf;
            const cz = alongX ? sign * mastHalf : 0;
            p.set(cx, y, cz);
            s.set(alongX ? faceSpan : post * 0.7, post * 0.7, alongX ? post * 0.7 : faceSpan);
            rungs.setMatrixAt(b * 4 + f, m.compose(p, q.identity(), s));

            p.set(cx, y - bay / 2, cz);
            const axis = alongX ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
            q.setFromAxisAngle(axis, (b % 2 === 0 ? 1 : -1) * braceTilt);
            s.set(post * 0.5, braceLength, post * 0.5);
            braces.setMatrixAt(b * 4 + f, m.compose(p, q, s));
        }
    }
    [posts, rungs, braces].forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(4 * u, 0.4 * u, 4 * u), graphite);
    base.position.set(mastX, 0.2 * u, 0);
    base.receiveShadow = true;
    group.add(base);

    // Release arm and electromagnet over the drop line (x = 0).
    const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(mastX) + 1.2 * u, 0.5 * u, 0.6 * u), anodized);
    arm.position.set(mastX / 2 + 0.3 * u, top + 0.25 * u, 0);
    arm.castShadow = true;
    group.add(arm);

    const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.75 * u, 0.85 * u, magnetHeight, 32), anodized);
    magnet.position.set(0, top - magnetHeight / 2, 0);
    magnet.castShadow = true;
    group.add(magnet);

    // Lit while the magnet holds the ball, dark once it is released.
    const magnetGlow = labMaterials.glow(LAB_COLORS.plasma, 2.2);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.82 * u, 0.07 * u, 12, 48), magnetGlow);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0, top - magnetHeight + 0.18 * u, 0);
    group.add(coil);

    // Landing sensor pad.
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(3 * u, 3.2 * u, 0.12 * u, 64), graphite);
    pad.position.y = 0.06 * u;
    pad.receiveShadow = true;
    group.add(pad);
    const padRing = new THREE.Mesh(new THREE.TorusGeometry(2.5 * u, 0.05 * u, 8, 96), labMaterials.glow(LAB_COLORS.blueshift, 1.2));
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.13 * u;
    group.add(padRing);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 48, 32), labMaterials.polished());
    ball.castShadow = true;
    ball.position.set(0, h0 + ballRadius, 0);
    ball.name = 'ball';
    group.add(ball);

    // Metre scale beside the drop line, and a marker line from the ball to it.
    const scaleX = 2.6 * u;
    const majorStep = niceStep(h0, 8);
    const ruler = createRuler({
        min: 0,
        max: h0,
        scale: 1,
        minorStep: majorStep / 5,
        majorStep,
        labelStep: majorStep,
        format: (v) => `${Number(v.toFixed(3))} m`,
        tickSize: 0.9 * u,
        labelHeight: 0.75 * u,
    });
    ruler.position.set(scaleX, 0, 0);
    group.add(ruler);

    const heightMarker = new THREE.Mesh(
        new THREE.BoxGeometry(scaleX, 0.05 * u, 0.05 * u),
        new THREE.MeshBasicMaterial({ color: LAB_COLORS.blueshift, toneMapped: false })
    );
    heightMarker.position.set(scaleX / 2, h0, 0);
    group.add(heightMarker);

    const floorSize = Math.max(120, extent * 8);
    group.add(createLabFloor({ size: floorSize, divisions: Math.round(floorSize / niceStep(extent, 6)) }));

    return { group, ball, heightMarker, magnetGlow, ballRadius, extent };
}

/** Points the camera, shadows and fog at a rig of the given height. */
function frameRig(setup: SceneSetup, extent: number) {
    const { camera, controls, scene, lights } = setup;
    const target = new THREE.Vector3(-0.04 * extent, extent * 0.46, 0);
    const offset = new THREE.Vector3(0.55, 0.16, 0.82).normalize().multiplyScalar(extent * 1.45 + 6);
    camera.position.copy(target).add(offset);
    camera.near = Math.max(0.05, extent / 500);
    camera.far = extent * 40;
    camera.updateProjectionMatrix();
    controls.target.copy(target);
    controls.minDistance = extent * 0.05;
    controls.maxDistance = extent * 12;
    controls.update();

    const key = lights.directionalLight;
    key.position.set(0.55, 1, 0.4).multiplyScalar(extent * 1.6);
    const shadow = key.shadow.camera;
    shadow.left = -extent * 0.8;
    shadow.right = extent * 0.8;
    shadow.top = extent * 1.1;
    shadow.bottom = -extent * 0.6;
    shadow.near = 0.1;
    shadow.far = extent * 5;
    shadow.updateProjectionMatrix();
    lights.rimLight.position.set(-0.6, 0.7, -0.8).multiplyScalar(extent * 1.6);

    if (scene.fog instanceof THREE.Fog) {
        scene.fog.near = extent * 2.2;
        scene.fog.far = extent * 6;
    }
}

function readH0(paramValues: SimulationSceneProps['paramValues']) {
    return parseFloat(String(paramValues?.h0)) || DEFAULT_H0;
}

const FreeFallScene = ({ dataPointToRender, paramValues }: SimulationSceneProps) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const setupRef = useRef<SceneSetup | null>(null);
    const towerRef = useRef<DropTower | null>(null);
    const heightRef = useRef<number | null>(null);

    // Initialize scene
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const setup = setupScene(currentMount, {
            fov: 45,
            far: 20000,
            fog: { near: 200, far: 600 },
            lights: {
                ambientIntensity: 0.55,
                directionalIntensity: 1.6,
                shadowMapSize: 2048,
            },
            controls: { maxPolarAngle: Math.PI / 2 - 0.02 },
        });
        setupRef.current = setup;
        setup.start();

        return () => {
            setup.dispose();
            setupRef.current = null;
            towerRef.current = null;
            heightRef.current = null;
        };
    }, []);

    // Rebuild the rig when the release height changes
    useEffect(() => {
        const setup = setupRef.current;
        if (!setup) return;
        const h0 = readH0(paramValues);
        if (heightRef.current !== null && Math.abs(heightRef.current - h0) <= REBUILD_THRESHOLD) return;

        if (towerRef.current) {
            setup.scene.remove(towerRef.current.group);
            disposeObject3D(towerRef.current.group);
        }
        const tower = createDropTower(h0);
        setup.scene.add(tower.group);
        towerRef.current = tower;
        heightRef.current = h0;
        frameRig(setup, tower.extent);
    }, [paramValues]);

    // Move the ball (its lowest point sits at the simulated height)
    useEffect(() => {
        const tower = towerRef.current;
        if (!tower) return;

        const h0 = readH0(paramValues);
        let height = h0;
        let released = false;
        if (dataPointToRender && dataPointToRender.position !== undefined) {
            height =
                typeof dataPointToRender.position === 'number'
                    ? dataPointToRender.position
                    : dataPointToRender.position.y ?? 0;
            released = Number(dataPointToRender.time) > 0;
        }
        const y = Math.max(height, 0);
        tower.ball.position.y = y + tower.ballRadius;
        tower.heightMarker.position.y = y;
        tower.magnetGlow.emissiveIntensity = released ? 0.15 : 2.2;
    }, [dataPointToRender, paramValues]);

    return <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
};

export default FreeFallScene;
