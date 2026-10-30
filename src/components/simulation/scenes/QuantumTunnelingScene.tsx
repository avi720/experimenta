import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { ghostIconButtonClass, instrumentSurfaceClass } from '@/components/simulation/workspace/workspaceStyles';
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

    // Detector: a sensor head on a vertical post behind and above the beamline. Only the head
    // tilts: it looks down and forward so its lens (local +Z) faces the beam axis at y = z = 0.
    const DETECTOR_HEIGHT = 3;
    const DETECTOR_DEPTH = -4;
    const detectorGroup = new THREE.Group();
    detectorGroup.position.set(DETECTOR_X_POSITION, DETECTOR_HEIGHT, DETECTOR_DEPTH);
    const detectorHead = new THREE.Group();
    detectorHead.lookAt(new THREE.Vector3(0, -DETECTOR_HEIGHT, -DETECTOR_DEPTH));
    detectorGroup.add(detectorHead);
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.6), anodized);
    detectorHead.add(head);
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1, 32), steel);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.z = 1.8;
    detectorHead.add(lensBarrel);
    const detectorLens = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), labMaterials.glow(DETECTOR_IDLE, 1.2));
    detectorLens.position.z = 2.31;
    detectorHead.add(detectorLens);
    // The post runs from the floor (y = -3) up to the underside of the head.
    const postTop = -0.6;
    const postBottom = -3 - DETECTOR_HEIGHT;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, postTop - postBottom, 12), steel);
    post.position.y = (postTop + postBottom) / 2;
    detectorGroup.add(post);
    const postBase = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 0.3, 32), graphite);
    postBase.position.y = postBottom + 0.15;
    detectorGroup.add(postBase);
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
    const { t, dir } = useTranslation();
    const collapsed = Boolean(dataPointToRender?.hasCollapsed && dataPointToRender?.measurementResult);
    const result = collapsed ? dataPointToRender!.measurementResult : null;
    const statusKey =
        result === 'transmitted' ? 'workspace.quantumCollapse.statusTransmitted'
        : result === 'reflected' ? 'workspace.quantumCollapse.statusReflected'
        : 'workspace.quantumCollapse.statusWaiting';

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

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />

            {/* Inline-end corner. The side panel is at start-0, so this stays clear on desktop.
                Sibling of the WebGL mount so badge clicks never reach OrbitControls. */}
            <div className="pointer-events-none absolute top-3 end-3 z-10">
                <div className={cn('pointer-events-auto flex items-center gap-2 rounded-md border ps-3 pe-1 py-1 shadow-lg shadow-hole/40', instrumentSurfaceClass)}>
                    {/* Same colours as the particles in the scene: emerald passed, plasma reflected. */}
                    <span
                        aria-hidden="true"
                        className={cn(
                            'h-2.5 w-2.5 shrink-0 rounded-full',
                            result === 'transmitted' ? 'bg-success' : result === 'reflected' ? 'bg-plasma' : 'bg-dust'
                        )}
                    />
                    <span className="text-sm text-star" aria-live="polite">
                        {t(statusKey)}
                    </span>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('workspace.quantumCollapse.infoButtonLabel')}
                                className={cn('h-9 w-9 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11', ghostIconButtonClass)}
                            >
                                <Info className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </PopoverTrigger>
                        {/* align="end" is logical: the badge sits in the inline-end corner, so the
                            popover grows back towards the middle. Floating UI flips start/end when
                            this content's direction is rtl, so menuAlignEnd would flip a second
                            time. On a 360px screen the collision middleware slides the 20rem panel
                            inward so it stays fully visible. */}
                        <PopoverContent
                            side="bottom"
                            align="end"
                            sideOffset={6}
                            collisionPadding={12}
                            dir={dir}
                            aria-labelledby="quantum-collapse-title"
                            className="w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto space-y-2 text-start border-line bg-space-raised text-star shadow-lg shadow-hole/50"
                        >
                            <h4 id="quantum-collapse-title" className="text-sm font-medium text-star">
                                {t('workspace.quantumCollapse.title')}
                            </h4>
                            <p className="text-sm leading-relaxed text-dust">
                                {t('workspace.quantumCollapse.intro')}
                            </p>
                            <p className="text-sm leading-relaxed text-dust">
                                {t('workspace.quantumCollapse.body')}
                            </p>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
