import { memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ParameterValues } from '@/types/experiment';
import type { SimulationDataPoint, SimulationSceneProps } from '@/types/simulation';
import { setupScene } from '@/simulation/sceneUtils';
import { createLabFloor, createRuler, LAB_COLORS, labMaterials } from '@/simulation/labKit';

const SPRING_SAMPLES = 360;
const SPRING_TUBULAR_SEGMENTS = 360;
const SPRING_TUBE_RADIUS = 0.26;
const SPRING_RADIAL_SEGMENTS = 8;
const SPRING_COIL_RADIUS = 2.1;
const SPRING_COILS = 18;

/**
 * Builds a helical spring tube of the given length along +X. A real spring keeps its number of
 * turns as it stretches, so only the pitch changes; the vertex count is fixed too (it depends
 * only on the segment constants), so a spring can be reshaped in place.
 */
export function createSpringGeometry(length: number): THREE.TubeGeometry {
    const springPoints = [];
    const coils = SPRING_COILS;

    for (let i = 0; i <= SPRING_SAMPLES; i++) {
        const t = i / SPRING_SAMPLES;
        const x = t * length;
        const y = SPRING_COIL_RADIUS * Math.cos(t * coils * 2 * Math.PI);
        const z = SPRING_COIL_RADIUS * Math.sin(t * coils * 2 * Math.PI);
        springPoints.push(new THREE.Vector3(x, y, z));
    }

    const springCurve = new THREE.CatmullRomCurve3(springPoints);
    return new THREE.TubeGeometry(springCurve, SPRING_TUBULAR_SEGMENTS, SPRING_TUBE_RADIUS, SPRING_RADIAL_SEGMENTS, false);
}

/**
 * Reshapes an existing spring geometry to `length` by rewriting its vertex buffers in place,
 * so the GPU buffers are reused instead of a new geometry being allocated per change.
 */
export function updateSpringGeometry<T extends THREE.BufferGeometry>(geometry: T, length: number): T {
    const next = createSpringGeometry(length);
    ['position', 'normal', 'uv'].forEach((name) => {
        const target = geometry.getAttribute(name);
        const source = next.getAttribute(name);
        if (target && source) {
            target.array.set(source.array);
            target.needsUpdate = true;
        }
    });
    next.dispose();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    return geometry;
}

const VISUAL_SCALE = 12; // scene units per metre; x0 spans -5..5 m
const WALL_EDGE_X = -84;
const MASS_HALF_WIDTH = 5;
const MIN_SPRING_LENGTH = 10;
const SPRING_RESHAPE_THRESHOLD = 0.05;
const TRACK_TOP = 8;
const SPRING_Y = TRACK_TOP + 3.7;

/**
 * Maps the physical position (from the current data point, else `x0`, else 1) to the mass's
 * scene X and returns the resulting spring length between the wall and the mass.
 */
function computeMassLayout(
    params: ParameterValues | null | undefined,
    dataPoint: SimulationDataPoint | null | undefined
) {
    let xPhysics: unknown;
    if (dataPoint && dataPoint.position !== undefined) {
        xPhysics = dataPoint.position;
    } else if (params && params.x0 !== undefined) {
        xPhysics = params.x0;
    } else {
        xPhysics = 1;
    }
    const massX = Number(xPhysics) * VISUAL_SCALE;
    const springLength = Math.max(MIN_SPRING_LENGTH, massX - MASS_HALF_WIDTH - WALL_EDGE_X);
    return { massX, springLength };
}

/**
 * Adds the air track apparatus to `scene`: a rail on two stands, the end bracket the spring is
 * fixed to, a metre scale along the rail with the equilibrium position marked, and the glider.
 * Returns the glider group, which the component moves along X.
 */
function populateAirTrack(scene: THREE.Scene) {
    const steel = labMaterials.steel();
    const anodized = labMaterials.anodized();
    const graphite = labMaterials.graphite();
    const trackStart = WALL_EDGE_X - 6;
    const trackEnd = 82;
    const trackLength = trackEnd - trackStart;
    const trackCenter = (trackStart + trackEnd) / 2;

    scene.add(createLabFloor({ size: 480, divisions: 48 }));

    const body = new THREE.Mesh(new THREE.BoxGeometry(trackLength, 2.4, 4.2), anodized);
    body.position.set(trackCenter, TRACK_TOP - 1.6, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(trackLength, 0.8, 3), steel);
    rail.position.set(trackCenter, TRACK_TOP - 0.4, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);

    const legGeometry = new THREE.BoxGeometry(2, TRACK_TOP - 2.8, 2);
    const footGeometry = new THREE.BoxGeometry(5, 0.6, 9);
    [trackStart + 14, trackEnd - 14].forEach((x) => {
        const leg = new THREE.Mesh(legGeometry, graphite);
        leg.position.set(x, (TRACK_TOP - 2.8) / 2, 0);
        leg.castShadow = true;
        scene.add(leg);
        const foot = new THREE.Mesh(footGeometry, graphite);
        foot.position.set(x, 0.3, 0);
        foot.receiveShadow = true;
        scene.add(foot);
    });

    // End bracket the spring is anchored to.
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(2, 9, 9), steel);
    bracket.position.set(WALL_EDGE_X - 1, TRACK_TOP + 4.5, 0);
    bracket.castShadow = true;
    scene.add(bracket);
    const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 24), anodized);
    anchor.rotation.z = Math.PI / 2;
    anchor.position.set(WALL_EDGE_X + 0.6, SPRING_Y, 0);
    scene.add(anchor);

    // Metre scale on the front face of the rail; ticks hang down from it.
    const ruler = createRuler({
        min: -5,
        max: 5,
        scale: VISUAL_SCALE,
        minorStep: 0.1,
        majorStep: 0.5,
        labelStep: 1,
        format: (v) => `${v} m`,
        tickSize: 1.2,
        labelHeight: 1.9,
    });
    ruler.rotation.z = -Math.PI / 2;
    ruler.position.set(0, TRACK_TOP - 2.9, 2.2);
    scene.add(ruler);

    const equilibrium = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 3.2, 0.18),
        new THREE.MeshBasicMaterial({ color: LAB_COLORS.blueshift, toneMapped: false })
    );
    equilibrium.position.set(0, TRACK_TOP - 1.4, 2.25);
    scene.add(equilibrium);

    // Glider: a carriage that straddles the rail, with the mass block on top.
    const glider = new THREE.Group();
    glider.name = 'glider';
    const deck = new THREE.Mesh(new THREE.BoxGeometry(MASS_HALF_WIDTH * 2, 0.8, 6), anodized);
    deck.position.y = TRACK_TOP + 0.6;
    glider.add(deck);
    const skirtGeometry = new THREE.BoxGeometry(MASS_HALF_WIDTH * 2, 2.6, 0.5);
    [-2.6, 2.6].forEach((z) => {
        const skirt = new THREE.Mesh(skirtGeometry, anodized);
        skirt.position.set(0, TRACK_TOP - 0.5, z);
        glider.add(skirt);
    });
    const block = new THREE.Mesh(new THREE.BoxGeometry(MASS_HALF_WIDTH * 2 - 1, 5, 5), labMaterials.polished());
    block.position.y = TRACK_TOP + 3.5;
    glider.add(block);
    const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(MASS_HALF_WIDTH * 2 + 0.02, 0.25, 6.02),
        labMaterials.glow(LAB_COLORS.plasma, 1.8)
    );
    stripe.position.y = TRACK_TOP + 1.1;
    glider.add(stripe);
    glider.traverse((node) => {
        node.castShadow = true;
    });
    scene.add(glider);

    return { glider };
}

const ShoScene = ({ parameters, dataPointToRender }: SimulationSceneProps) => {
    const mountRef = useRef<HTMLDivElement>(null);

    // Refs keep the render loop reading the latest props without restarting the scene.
    const dataPointRef = useRef(dataPointToRender);
    const parametersRef = useRef(parameters);

    useEffect(() => {
        dataPointRef.current = dataPointToRender;
    }, [dataPointToRender]);

    useEffect(() => {
        parametersRef.current = parameters;
    }, [parameters]);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const { scene, start, dispose } = setupScene(currentMount, {
            fov: 40,
            far: 2000,
            fog: { near: 260, far: 700 },
            cameraPosition: [24, 46, 128],
            target: [-4, 8, 0],
            lights: {
                ambientIntensity: 0.55,
                directionalIntensity: 1.6,
                directionalPosition: [60, 120, 70],
                shadowCamera: { top: 110, bottom: -110, left: -130, right: 130, near: 1, far: 400 },
            },
            controls: { minDistance: 20, maxDistance: 500, maxPolarAngle: Math.PI / 2 - 0.02 },
        });

        const { glider } = populateAirTrack(scene);

        // Spring: built once, then reshaped in place.
        const initial = computeMassLayout(parametersRef.current, dataPointRef.current);
        glider.position.x = initial.massX;
        const spring = new THREE.Mesh(createSpringGeometry(initial.springLength), labMaterials.steel());
        spring.position.set(WALL_EDGE_X, SPRING_Y, 0);
        spring.castShadow = true;
        scene.add(spring);

        let lastSpringLength = initial.springLength;

        start(() => {
            const { massX, springLength } = computeMassLayout(parametersRef.current, dataPointRef.current);
            glider.position.x = massX;
            if (Math.abs(springLength - lastSpringLength) > SPRING_RESHAPE_THRESHOLD) {
                updateSpringGeometry(spring.geometry, springLength);
                lastSpringLength = springLength;
            }
        });

        // Disposes the loop, observer, controls, every geometry/material in the scene
        // (floor, track, glider, spring, lights), the renderer, and removes the canvas.
        return dispose;
    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
};

export default memo(ShoScene);
