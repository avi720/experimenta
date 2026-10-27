import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ParameterValues } from '@/types/experiment';
import type { SimulationDataPoint, SimulationSceneProps } from '@/types/simulation';
import { DETECTOR_X_POSITION } from '../engines/quantumTunnelingEngine';
import { createGroundPlane, setupScene } from './sceneUtils';

const UM_TO_NM = 1000;
const VISUAL_L_SCALE_FACTOR = 0.25;

/**
 * Computes the visual X-scale of the barrier mesh in scene units from `parameters.L` (µm)
 * or `dataPointToRender.debug.barrier_width_um` (µm).
 */
export function computeBarrierVisualWidth(
    parameters: ParameterValues | null | undefined = {},
    dataPointToRender: SimulationDataPoint | null | undefined = null
): number {
    const debug = dataPointToRender?.debug || {};
    if (debug.barrier_width_nm !== undefined && !Number.isNaN(parseFloat(String(debug.barrier_width_nm)))) {
        const nm = parseFloat(String(debug.barrier_width_nm));
        if (nm > 0) return nm * VISUAL_L_SCALE_FACTOR;
    }
    const rawUm = debug.barrier_width_um ?? parameters?.L;
    const parsedUm = parseFloat(String(rawUm));
    const widthUm = !Number.isNaN(parsedUm) && parsedUm > 0 ? parsedUm : 0.005;
    const widthNm = widthUm <= 0.5 ? widthUm * UM_TO_NM : widthUm;
    return widthNm * VISUAL_L_SCALE_FACTOR;
}

/**
 * Adds the floor, particle gun, barrier, detector and particles to `scene` (lights come from
 * `setupScene`). Returns the objects the component updates afterwards.
 */
export function populateQuantumTunnelingScene(scene: THREE.Scene, barrierWidth: number) {
    // Floor
    scene.add(createGroundPlane(100, 50, new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }), -2));

    // Particle Gun
    const gunGroup = new THREE.Group();
    gunGroup.position.set(-48, 0, 0);

    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    gunGroup.add(body);

    const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(2.5, 0, 0);
    barrel.rotation.z = Math.PI / 2;
    gunGroup.add(barrel);

    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x718096 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -1.5, 0);
    gunGroup.add(base);

    scene.add(gunGroup);

    // Barrier
    const barrierGeometry = new THREE.BoxGeometry(1, 8, 2);
    const barrierMaterial = new THREE.MeshLambertMaterial({
        color: 0xe53e3e,
        transparent: true,
        opacity: 0.7
    });
    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(0, 2, 0);
    barrier.scale.x = barrierWidth;
    scene.add(barrier);

    // Detector (Camera-like shape placed on the transmitted side at DETECTOR_X_POSITION)
    const detectorGroup = new THREE.Group();
    detectorGroup.position.set(DETECTOR_X_POSITION, 3, -4);

    const detectorBodyGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    const detectorBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    const detectorBody = new THREE.Mesh(detectorBodyGeometry, detectorBodyMaterial);
    detectorGroup.add(detectorBody);

    const detectorConeGeometry = new THREE.ConeGeometry(0.8, 2, 8);
    const detectorConeMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const detectorCone = new THREE.Mesh(detectorConeGeometry, detectorConeMaterial);
    detectorCone.position.set(0, -0.5, 2);
    detectorCone.rotation.x = -Math.PI / 6;
    detectorGroup.add(detectorCone);

    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0, -3, 0);
    detectorGroup.add(arm);

    scene.add(detectorGroup);

    // Particles
    const particleGeometry = new THREE.SphereGeometry(0.4, 16, 16);

    // Incoming Particle (Blue)
    const incomingMaterial = new THREE.MeshLambertMaterial({ color: 0x2b6cb0 });
    const incomingParticle = new THREE.Mesh(particleGeometry, incomingMaterial);
    incomingParticle.castShadow = true;
    incomingParticle.visible = false;
    scene.add(incomingParticle);

    // Transmitted Particle (Green)
    const transmittedMaterial = new THREE.MeshLambertMaterial({
        color: 0x38a169,
        transparent: true,
    });
    const transmittedParticle = new THREE.Mesh(particleGeometry, transmittedMaterial);
    transmittedParticle.castShadow = true;
    transmittedParticle.visible = false;
    scene.add(transmittedParticle);

    // Reflected Particle (Yellow)
    const reflectedMaterial = new THREE.MeshLambertMaterial({
        color: 0xd69e2e,
        transparent: true,
    });
    const reflectedParticle = new THREE.Mesh(particleGeometry, reflectedMaterial);
    reflectedParticle.castShadow = true;
    reflectedParticle.visible = false;
    scene.add(reflectedParticle);

    return {
        barrier,
        detectorGroup,
        detectorCone,
        incomingParticle,
        transmittedParticle,
        reflectedParticle,
    };
}

type QuantumTunnelingObjects = ReturnType<typeof populateQuantumTunnelingScene>;

export default function QuantumTunnelingScene({ parameters, dataPointToRender }: SimulationSceneProps) {
    const mountRef = useRef<HTMLDivElement>(null);

    // Particle Refs
    const incomingParticleRef = useRef<QuantumTunnelingObjects['incomingParticle'] | null>(null);
    const transmittedParticleRef = useRef<QuantumTunnelingObjects['transmittedParticle'] | null>(null);
    const reflectedParticleRef = useRef<QuantumTunnelingObjects['reflectedParticle'] | null>(null);

    const barrierRef = useRef<QuantumTunnelingObjects['barrier'] | null>(null);
    const detectorConeRef = useRef<QuantumTunnelingObjects['detectorCone'] | null>(null);

    useEffect(() => {
        const mountElement = mountRef.current;
        if (!mountElement) return;

        const { scene, start, dispose } = setupScene(mountElement, {
            background: 0xf7fafc,
            fov: 60,
            far: 1000,
            cameraPosition: [0, 15, 25],
            target: [0, 0, 0],
            lights: {
                ambientIntensity: 0.4,
                directionalIntensity: 1,
                directionalPosition: [10, 10, 5],
            },
            controls: { minDistance: 5, maxDistance: 100, maxPolarAngle: Math.PI / 2 },
        });

        const objects = populateQuantumTunnelingScene(scene, computeBarrierVisualWidth(parameters, dataPointToRender));
        barrierRef.current = objects.barrier;
        detectorConeRef.current = objects.detectorCone;
        incomingParticleRef.current = objects.incomingParticle;
        transmittedParticleRef.current = objects.transmittedParticle;
        reflectedParticleRef.current = objects.reflectedParticle;

        const particles = [objects.incomingParticle, objects.transmittedParticle, objects.reflectedParticle];
        start(() => {
            const bob = Math.sin(Date.now() * 0.005) * 0.1;
            particles.forEach((particle) => {
                if (particle.visible) particle.position.y = bob;
            });
        });

        return () => {
            dispose();
            incomingParticleRef.current = null;
            transmittedParticleRef.current = null;
            reflectedParticleRef.current = null;
            barrierRef.current = null;
            detectorConeRef.current = null;
        };
    // Mount-only scene setup; later parameter/data changes are applied by the update effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to update scene based on simulation data and parameters
    useEffect(() => {
        const incomingParticle = incomingParticleRef.current;
        const transmittedParticle = transmittedParticleRef.current;
        const reflectedParticle = reflectedParticleRef.current;
        const barrier = barrierRef.current;
        const detectorCone = detectorConeRef.current;
        if (!incomingParticle || !transmittedParticle || !reflectedParticle || !barrier || !detectorCone) return;
        const allParticles = [incomingParticle, transmittedParticle, reflectedParticle];

        // Always update barrier width when parameters or dataPointToRender change
        const barrierWidthVisual = computeBarrierVisualWidth(parameters, dataPointToRender);
        barrier.scale.x = barrierWidthVisual;
        const barrierLeftEdge = -barrierWidthVisual / 2;
        
        if (dataPointToRender) {
            const { measurementResult, hasCollapsed } = dataPointToRender;
            const position = Number(dataPointToRender.position);
            const transmission = Number(dataPointToRender.transmission);
            const reflection = Number(dataPointToRender.reflection);
            const time = Number(dataPointToRender.time);

            // Update detector appearance based on measurement result
            if (hasCollapsed && measurementResult) {
                if (measurementResult === 'reflected') {
                    detectorCone.material.color.setHex(0xffa500);
                } else if (measurementResult === 'transmitted') {
                    detectorCone.material.color.setHex(0x00ff00);
                }
            } else {
                detectorCone.material.color.setHex(0x404040);
            }

            // Visibility control
            const isSimulationActive = time > 0;
            const hasFinished = position > 50; 
            const hasHitBarrier = position >= barrierLeftEdge;

            // Before simulation starts or after it finishes, hide all
            if (!isSimulationActive || hasFinished) {
                allParticles.forEach(p => p.visible = false);
                return;
            }

            // Before hitting the barrier
            if (!hasHitBarrier) {
                incomingParticle.visible = true;
                transmittedParticle.visible = false;
                reflectedParticle.visible = false;
                incomingParticle.position.x = position;
            } 
            // After hitting the barrier
            else {
                incomingParticle.visible = false;

                // Handle quantum collapse
                if (hasCollapsed && measurementResult) {
                    if (measurementResult === 'transmitted') {
                        transmittedParticle.visible = true;
                        reflectedParticle.visible = false;
                        transmittedParticle.position.x = position;
                        transmittedParticle.material.opacity = 1.0;
                    } else if (measurementResult === 'reflected') {
                        transmittedParticle.visible = false;
                        reflectedParticle.visible = true;
                        const reflectedPosition = barrierLeftEdge - (position - barrierLeftEdge);
                        reflectedParticle.position.x = reflectedPosition;
                        reflectedParticle.material.opacity = 1.0;
                    }
                } else {
                    // Normal superposition state - both particles visible with probability-based opacity
                    transmittedParticle.visible = true;
                    reflectedParticle.visible = true;

                    transmittedParticle.position.x = position;
                    const MIN_DISPLAY_OPACITY = 0.1;
                    transmittedParticle.material.opacity = Math.max(transmission, MIN_DISPLAY_OPACITY);

                    const reflectedPosition = barrierLeftEdge - (position - barrierLeftEdge);
                    reflectedParticle.position.x = reflectedPosition;
                    reflectedParticle.material.opacity = Math.max(reflection, MIN_DISPLAY_OPACITY);
                }
            }

        } else {
            allParticles.forEach(p => p.visible = false);
            detectorCone.material.color.setHex(0x404040);
        }
    }, [dataPointToRender, parameters]);

    return <div ref={mountRef} className="w-full h-full" />;
}
