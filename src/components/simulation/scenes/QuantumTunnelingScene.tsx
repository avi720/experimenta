import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ParameterValues } from '@/types/experiment';
import type { SimulationDataPoint, SimulationSceneProps } from '@/types/simulation';
import { DETECTOR_X_POSITION } from '@/simulation/engines/quantumTunnelingEngine';
import { setupScene } from '@/simulation/sceneUtils';
import { createGlowSprite, createGlowTexture, createLabFloor, LAB_COLORS, labMaterials } from '@/simulation/labKit';

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

const PARTICLE_COLORS = Object.freeze({
    incoming: LAB_COLORS.blueshift,
    transmitted: LAB_COLORS.emerald,
    reflected: LAB_COLORS.plasma,
});
const DETECTOR_IDLE = 0x3a3152;

/**
 * Adds the floor, beamline, electron gun, potential barrier, detector and particles to `scene`
 * (lights come from `setupScene`). Returns the objects the component updates afterwards.
 */
export function populateQuantumTunnelingScene(scene: THREE.Scene, barrierWidth: number) {
    const steel = labMaterials.steel();
    const anodized = labMaterials.anodized();
    const graphite = labMaterials.graphite();

    scene.add(createLabFloor({ size: 160, divisions: 64, y: -3 }));

    // Beamline: a faint guide the particle travels along.
    const beamline = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, DETECTOR_X_POSITION + 46, 8),
        new THREE.MeshBasicMaterial({ color: LAB_COLORS.blueshift, transparent: true, opacity: 0.45, toneMapped: false })
    );
    beamline.rotation.z = Math.PI / 2;
    beamline.position.x = (DETECTOR_X_POSITION - 46) / 2;
    scene.add(beamline);

    // Electron gun on a stand, firing along +X.
    const gunGroup = new THREE.Group();
    gunGroup.position.set(-48, 0, 0);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 5, 40), anodized);
    housing.rotation.z = Math.PI / 2;
    gunGroup.add(housing);
    const collarGeometry = new THREE.CylinderGeometry(1.35, 1.35, 0.35, 40);
    [-1.6, 0.4, 2.1].forEach((x) => {
        const collar = new THREE.Mesh(collarGeometry, steel);
        collar.rotation.z = Math.PI / 2;
        collar.position.x = x;
        gunGroup.add(collar);
    });
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1, 1.6, 32), steel);
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.x = 3.3;
    gunGroup.add(nozzle);
    const aperture = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), labMaterials.glow(LAB_COLORS.blueshift, 2.4));
    aperture.rotation.y = Math.PI / 2;
    aperture.position.x = 4.11;
    gunGroup.add(aperture);
    const standGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 16);
    const stand = new THREE.Mesh(standGeometry, steel);
    stand.position.y = -1.5;
    gunGroup.add(stand);
    const baseGeometry = new THREE.CylinderGeometry(1.4, 1.6, 0.3, 32);
    const base = new THREE.Mesh(baseGeometry, graphite);
    base.position.y = -2.85;
    gunGroup.add(base);
    gunGroup.traverse((node) => {
        node.castShadow = true;
    });
    scene.add(gunGroup);

    // Potential barrier: a translucent energy slab with lit edges. Its X scale is the width.
    const barrierBox = new THREE.BoxGeometry(1, 8, 4);
    const barrier = new THREE.Group();
    barrier.name = 'barrier';
    barrier.position.set(0, 1, 0);
    barrier.add(
        new THREE.Mesh(
            barrierBox,
            new THREE.MeshStandardMaterial({
                color: LAB_COLORS.horizon,
                emissive: LAB_COLORS.horizon,
                emissiveIntensity: 0.35,
                transparent: true,
                opacity: 0.32,
                depthWrite: false,
                side: THREE.DoubleSide,
            })
        )
    );
    barrier.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(barrierBox),
            new THREE.LineBasicMaterial({ color: LAB_COLORS.horizon, toneMapped: false })
        )
    );
    barrier.scale.x = barrierWidth;
    scene.add(barrier);

    // Detector: a sensor head on a post beside the beamline, its lens aimed at the beam.
    const detectorGroup = new THREE.Group();
    detectorGroup.position.set(DETECTOR_X_POSITION, 3, -4);
    detectorGroup.rotation.x = -Math.PI / 7;
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.6), anodized);
    detectorGroup.add(head);
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1, 32), steel);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.z = 1.8;
    detectorGroup.add(lensBarrel);
    const detectorLens = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), labMaterials.glow(DETECTOR_IDLE, 1.2));
    detectorLens.position.z = 2.31;
    detectorGroup.add(detectorLens);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 12), steel);
    post.position.y = -3.6;
    detectorGroup.add(post);
    detectorGroup.traverse((node) => {
        node.castShadow = true;
    });
    scene.add(detectorGroup);

    // Particles: glowing wave packets with an additive halo sharing one sprite texture.
    const particleGeometry = new THREE.SphereGeometry(0.4, 24, 16);
    const glowTexture = createGlowTexture();
    const createParticle = (color: number) => {
        const material = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: color,
            emissiveIntensity: 2,
            transparent: true,
        });
        const particle = new THREE.Mesh(particleGeometry, material);
        const halo = createGlowSprite(color, 2.6, glowTexture);
        if (halo) particle.add(halo);
        particle.visible = false;
        scene.add(particle);
        return particle;
    };

    return {
        barrier,
        detectorGroup,
        detectorLens,
        incomingParticle: createParticle(PARTICLE_COLORS.incoming),
        transmittedParticle: createParticle(PARTICLE_COLORS.transmitted),
        reflectedParticle: createParticle(PARTICLE_COLORS.reflected),
    };
}

type QuantumTunnelingObjects = ReturnType<typeof populateQuantumTunnelingScene>;
type Particle = QuantumTunnelingObjects['incomingParticle'];

/** Sets a particle's opacity together with its halo's. */
function setParticleOpacity(particle: Particle, opacity: number) {
    particle.material.opacity = opacity;
    particle.children.forEach((child) => {
        if (child instanceof THREE.Sprite) child.material.opacity = opacity;
    });
}

/** Lights the detector lens in the colour of the measured outcome, or dims it when idle. */
function setDetectorState(lens: QuantumTunnelingObjects['detectorLens'], result: 'transmitted' | 'reflected' | null) {
    lens.material.emissive.setHex(result ? PARTICLE_COLORS[result] : DETECTOR_IDLE);
    lens.material.emissiveIntensity = result ? 2.4 : 1.2;
}

export default function QuantumTunnelingScene({ parameters, dataPointToRender }: SimulationSceneProps) {
    const mountRef = useRef<HTMLDivElement>(null);

    // Particle Refs
    const incomingParticleRef = useRef<QuantumTunnelingObjects['incomingParticle'] | null>(null);
    const transmittedParticleRef = useRef<QuantumTunnelingObjects['transmittedParticle'] | null>(null);
    const reflectedParticleRef = useRef<QuantumTunnelingObjects['reflectedParticle'] | null>(null);

    const barrierRef = useRef<QuantumTunnelingObjects['barrier'] | null>(null);
    const detectorLensRef = useRef<QuantumTunnelingObjects['detectorLens'] | null>(null);

    useEffect(() => {
        const mountElement = mountRef.current;
        if (!mountElement) return;

        const { scene, start, dispose } = setupScene(mountElement, {
            fov: 45,
            far: 1000,
            fog: { near: 90, far: 200 },
            cameraPosition: [-11, 24, 68],
            target: [-11, 0, 0],
            lights: {
                ambientIntensity: 0.5,
                directionalIntensity: 1.4,
                directionalPosition: [20, 40, 25],
                shadowCamera: { left: -60, right: 60, top: 40, bottom: -40, near: 1, far: 150 },
            },
            controls: { minDistance: 5, maxDistance: 100, maxPolarAngle: Math.PI / 2 },
        });

        const objects = populateQuantumTunnelingScene(scene, computeBarrierVisualWidth(parameters, dataPointToRender));
        barrierRef.current = objects.barrier;
        detectorLensRef.current = objects.detectorLens;
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
            detectorLensRef.current = null;
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
        const detectorLens = detectorLensRef.current;
        if (!incomingParticle || !transmittedParticle || !reflectedParticle || !barrier || !detectorLens) return;
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
            setDetectorState(
                detectorLens,
                hasCollapsed && (measurementResult === 'transmitted' || measurementResult === 'reflected')
                    ? measurementResult
                    : null
            );

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
                        setParticleOpacity(transmittedParticle, 1);
                    } else if (measurementResult === 'reflected') {
                        transmittedParticle.visible = false;
                        reflectedParticle.visible = true;
                        const reflectedPosition = barrierLeftEdge - (position - barrierLeftEdge);
                        reflectedParticle.position.x = reflectedPosition;
                        setParticleOpacity(reflectedParticle, 1);
                    }
                } else {
                    // Normal superposition state - both particles visible with probability-based opacity
                    transmittedParticle.visible = true;
                    reflectedParticle.visible = true;

                    transmittedParticle.position.x = position;
                    const MIN_DISPLAY_OPACITY = 0.1;
                    setParticleOpacity(transmittedParticle, Math.max(transmission, MIN_DISPLAY_OPACITY));

                    const reflectedPosition = barrierLeftEdge - (position - barrierLeftEdge);
                    reflectedParticle.position.x = reflectedPosition;
                    setParticleOpacity(reflectedParticle, Math.max(reflection, MIN_DISPLAY_OPACITY));
                }
            }

        } else {
            allParticles.forEach(p => p.visible = false);
            setDetectorState(detectorLens, null);
        }
    }, [dataPointToRender, parameters]);

    return <div ref={mountRef} className="w-full h-full" />;
}
