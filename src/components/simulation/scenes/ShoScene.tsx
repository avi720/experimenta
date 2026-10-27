import { memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ParameterValues } from '@/types/experiment';
import type { SimulationDataPoint, SimulationSceneProps } from '@/types/simulation';
import { createGroundPlane, setupScene } from './sceneUtils';

const SPRING_SAMPLES = 128;
const SPRING_TUBULAR_SEGMENTS = 64;
const SPRING_TUBE_RADIUS = 0.8;
const SPRING_RADIAL_SEGMENTS = 8;
const SPRING_COIL_RADIUS = 3;

/**
 * Builds a helical spring tube of the given length along +X. The vertex count is fixed
 * (it depends only on the segment constants), so a spring can be reshaped in place.
 */
export function createSpringGeometry(length: number): THREE.TubeGeometry {
    const springPoints = [];
    const coils = Math.max(8, Math.floor(length / 8));

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

const WALL_EDGE_X = -45;
const MASS_HALF_WIDTH = 10;
const VISUAL_SCALE = 30;
const MIN_SPRING_LENGTH = 10;
const SPRING_RESHAPE_THRESHOLD = 2;

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
            background: 0x87ceeb,
            fov: 75,
            far: 1000,
            cameraPosition: [0, 50, 150],
            target: [0, 10, 0],
            lights: {
                ambientIntensity: 0.7,
                directionalIntensity: 0.8,
                directionalPosition: [50, 80, 30],
                shadowCamera: { top: 100, bottom: -100, left: -100, right: 100 },
            },
            controls: { minDistance: 20, maxDistance: 500, maxPolarAngle: Math.PI / 2 },
        });

        scene.add(createGroundPlane(200, 200, new THREE.MeshStandardMaterial({
            color: 0x228b22, // ForestGreen
            roughness: 0.9,
            metalness: 0.1,
        })));

        // Wall
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(10, 50, 50),
            new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.2, roughness: 0.8 })
        );
        wall.position.set(WALL_EDGE_X - 5, 25, 0);
        wall.receiveShadow = true;
        scene.add(wall);

        // Mass
        const mass = new THREE.Mesh(
            new THREE.BoxGeometry(20, 20, 20),
            new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.4 })
        );
        mass.castShadow = true;
        mass.position.y = 10;
        scene.add(mass);

        // Spring: built once, then reshaped in place.
        const initial = computeMassLayout(parametersRef.current, dataPointRef.current);
        mass.position.x = initial.massX;
        const spring = new THREE.Mesh(
            createSpringGeometry(initial.springLength),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 })
        );
        spring.position.set(WALL_EDGE_X, 10, 0);
        scene.add(spring);

        let lastSpringLength = initial.springLength;

        start(() => {
            const { massX, springLength } = computeMassLayout(parametersRef.current, dataPointRef.current);
            mass.position.x = massX;
            if (Math.abs(springLength - lastSpringLength) > SPRING_RESHAPE_THRESHOLD) {
                updateSpringGeometry(spring.geometry, springLength);
                lastSpringLength = springLength;
            }
        });

        // Disposes the loop, observer, controls, every geometry/material in the scene
        // (ground, wall, mass, spring, lights), the renderer, and removes the canvas.
        return dispose;
    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
};

export default memo(ShoScene);
