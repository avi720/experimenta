import { memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ParameterValues } from '@/types/experiment';
import type { SimulationSceneProps } from '@/types/simulation';
import type { EngineParameters } from '@/simulation/engines/types';
import { disposeObject3D, setupScene } from '@/simulation/sceneUtils';
import {
    createGlowSprite,
    createGlowTexture,
    createLabFloor,
    createRuler,
    createTextSprite,
    LAB_COLORS,
    labMaterials,
    niceStep,
    wavelengthToRgb,
} from '@/simulation/labKit';
import {
    readSource,
    sampleDetections,
    sourceWavelength,
    type DoubleSlitPoint,
    type DoubleSlitSource,
} from '@/simulation/engines/doubleSlitEngine';

/*
 * Double-slit apparatus on an optical bench: a source → a plate with two slits → a screen.
 * The source is a laser (light, an electromagnetic wave) or an electron gun (electrons, whose
 * de Broglie wavelength makes them interfere too).
 *
 * Everything the screen shows comes from the engine's `pattern` (intensity vs. screen position):
 * light paints it as continuous fringes; electrons arrive one at a time at positions drawn from
 * it (sampleDetections), so the fringes build up dot by dot. The screen spans the pattern's own
 * window, and its scale switches between mm, µm and nm to match. Distances along the bench are
 * not to scale (the slits are micrometres apart); the slit plate still shows the spacing (log
 * scale) and the width-to-spacing ratio.
 */

const AXIS_Y = 14;
const BENCH_TOP = 3;
const SOURCE_X = -34;
const SOURCE_LENGTH = 10;
const APERTURE_X = SOURCE_X + SOURCE_LENGTH / 2;
const SLIT_X = -12;
const SCREEN_WIDTH = 30;
const SCREEN_HEIGHT = 14;
const PLATE_WIDTH = 14;
const PLATE_HEIGHT = 12;
const SLIT_HEIGHT = 4;
const PATTERN_SAMPLES = 1024;
/** Electrons that land on the screen before the run stops adding more. */
const MAX_DETECTIONS = 9000;
/** Fraction of the screen height the slit's image covers. */
const HIT_BAND = 0.55;
const ELECTRON_COLOR = new THREE.Color(LAB_COLORS.blueshift);

const DEFAULTS = { screen_distance: 1, slit_spacing: 250, slit_width: 50 };

function readNumber(values: ParameterValues | undefined | null, key: keyof typeof DEFAULTS) {
    const parsed = parseFloat(String(values?.[key]));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULTS[key];
}

/** Scene distance from the slit plate to the screen for a screen distance of `meters` (0.1–5 m). */
export function screenOffsetFor(meters: number): number {
    return 14 + 9 * Math.min(Math.max(meters, 0), 5);
}

const MIN_SPACING_UM = 0.1;
const MAX_SPACING_UM = 2000;

/** Visual gap between the slit centres for a spacing of `um` µm (log scale over 0.1–2000 µm). */
export function slitGapFor(um: number): number {
    const clamped = Math.min(Math.max(um, MIN_SPACING_UM), MAX_SPACING_UM);
    const t = Math.log10(clamped / MIN_SPACING_UM) / Math.log10(MAX_SPACING_UM / MIN_SPACING_UM);
    return 0.6 + 2.4 * t;
}

/** Visual opening of each slit: the real width-to-spacing ratio applied to the visual gap. */
export function slitOpeningFor(gap: number, spacingUm: number, widthUm: number): number {
    const ratio = Math.min(widthUm / spacingUm, 1);
    return Math.min(Math.max(gap * ratio, 0.06), gap * 0.85);
}

/**
 * A plate with two vertical slits `gap` apart (centre to centre), each `opening` wide, in the YZ
 * plane, built from five blocks around the openings. Returns the group and the slit centres (Z).
 */
export function createSlitPlate(gap: number, opening: number, material: THREE.Material) {
    const group = new THREE.Group();
    group.name = 'slit-plate';
    const thickness = 0.3;
    const halfW = PLATE_WIDTH / 2;
    const bandHeight = (PLATE_HEIGHT - SLIT_HEIGHT) / 2;
    const inner = gap / 2 - opening / 2;
    const outer = gap / 2 + opening / 2;

    const block = (zFrom: number, zTo: number, yCenter: number, height: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, zTo - zFrom), material);
        mesh.position.set(0, yCenter, (zFrom + zTo) / 2);
        mesh.castShadow = true;
        group.add(mesh);
    };
    const bandOffset = SLIT_HEIGHT / 2 + bandHeight / 2;
    block(-halfW, halfW, bandOffset, bandHeight);
    block(-halfW, halfW, -bandOffset, bandHeight);
    block(-halfW, -outer, 0, SLIT_HEIGHT);
    block(-inner, inner, 0, SLIT_HEIGHT);
    block(outer, halfW, 0, SLIT_HEIGHT);

    return { group, slitCenters: [-gap / 2, gap / 2] as const };
}

type PatternInput = ReadonlyArray<{ position?: unknown; intensity?: unknown }> | null | undefined;

/** Clean, sorted pattern points, or an empty list. */
function readPattern(pattern: PatternInput): DoubleSlitPoint[] {
    if (!pattern) return [];
    return pattern
        .map((p) => ({ position: Number(p.position), intensity: Number(p.intensity) }))
        .filter((p) => Number.isFinite(p.position) && Number.isFinite(p.intensity))
        .sort((a, b) => a.position - b.position);
}

/** Half-width (mm) of the screen window: the largest |position| in the pattern. */
export function patternHalfWidth(pattern: PatternInput): number {
    const points = readPattern(pattern);
    if (points.length === 0) return 0;
    return Math.max(Math.abs(points[0].position), Math.abs(points[points.length - 1].position));
}

/**
 * Writes the engine pattern into `data` (RGBA, one texel per screen sample across the pattern's
 * own window, -halfWidth..halfWidth), normalized to the brightest point.
 */
export function fillPatternData(data: Uint8Array, pattern: PatternInput) {
    data.fill(0);
    const points = readPattern(pattern);
    const max = points.reduce((m, p) => Math.max(m, p.intensity), 0);
    const half = patternHalfWidth(points);
    if (points.length < 2 || max <= 0 || half <= 0) return data;

    const samples = data.length / 4;
    let j = 0;
    for (let s = 0; s < samples; s++) {
        const x = -half + (2 * half * (s + 0.5)) / samples;
        if (x < points[0].position || x > points[points.length - 1].position) continue;
        while (j < points.length - 2 && points[j + 1].position < x) j++;
        const a = points[j];
        const b = points[j + 1];
        const t = b.position === a.position ? 0 : (x - a.position) / (b.position - a.position);
        const value = Math.round((255 * (a.intensity + (b.intensity - a.intensity) * t)) / max);
        data.set([value, value, value, 255], s * 4);
    }
    return data;
}

/** The unit a screen window of half-width `halfMm` is best read in. */
export function screenUnitFor(halfMm: number): { unit: 'mm' | 'µm' | 'nm'; perMm: number } {
    if (halfMm >= 1) return { unit: 'mm', perMm: 1 };
    if (halfMm >= 1e-3) return { unit: 'µm', perMm: 1e3 };
    return { unit: 'nm', perMm: 1e6 };
}

/** "λ = 532 nm" / "λ = 5.36 pm", three significant figures. */
export function formatWavelength(meters: number): string {
    const [value, unit] = meters >= 1e-9 ? [meters * 1e9, 'nm'] : [meters * 1e12, 'pm'];
    return `λ = ${Number(value.toPrecision(3))} ${unit}`;
}

/** Electrons on the screen `seconds` after a run starts: a few at first, then a steady rain. */
export function detectionsAt(seconds: number): number {
    const t = Math.max(seconds, 0);
    return Math.min(MAX_DETECTIONS, Math.floor(4 * t + 22 * t * t));
}

/** Small seeded PRNG, so a given setup always lands its electrons in the same places. */
function mulberry32(seed: number) {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const FIELD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// The wave between the plate and the screen. A point a fraction f of the way to the screen, at a
// lateral offset z, lies on the ray that lands at z / f on the screen, so it takes that screen
// point's intensity. Travelling wavefronts from the slits are decoration on top.
const FIELD_FRAGMENT = /* glsl */ `
uniform sampler2D uPattern;
uniform vec3 uColor;
uniform float uTime;
uniform float uLength;
uniform float uStrength;
varying vec2 vUv;
void main() {
    float f = max(vUv.x, 0.001);
    float z = 0.5 - vUv.y; // world +Z, matching the screen's u axis
    float landing = z / f;
    float inside = 1.0 - smoothstep(0.44, 0.5, abs(landing));
    float intensity = texture2D(uPattern, vec2(landing + 0.5, 0.5)).r;
    float r = length(vec2(vUv.x * uLength, z * ${SCREEN_WIDTH.toFixed(1)}));
    float wave = 0.62 + 0.38 * cos(r * 4.2 - uTime * 3.0);
    float fadeIn = smoothstep(0.0, 0.06, vUv.x);
    float a = intensity * inside * wave * fadeIn * uStrength;
    gl_FragColor = vec4(uColor, a);
}`;

// Light paints the fringes continuously (uFringes = 1); for electrons the screen is a dark
// phosphor and only the individual detections (a Points layer in front of it) light up.
const SCREEN_FRAGMENT = /* glsl */ `
uniform sampler2D uPattern;
uniform vec3 uColor;
uniform float uFringes;
varying vec2 vUv;
void main() {
    float intensity = texture2D(uPattern, vec2(vUv.x, 0.5)).r;
    float band = 1.0 - smoothstep(0.22, 0.42, abs(vUv.y - 0.5));
    vec3 lit = uColor * pow(intensity, 0.8) * 1.5 * band * uFringes;
    gl_FragColor = vec4(vec3(0.035, 0.03, 0.05) + lit, 1.0);
}`;

/** sRGB colour (0..1) of light at `nm`. */
function lightColor(nm: number): THREE.Color {
    const [r, g, b] = wavelengthToRgb(nm);
    return new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
}

const DoubleSlitScene = ({ paramValues, dataPointToRender, hiddenParameters }: SimulationSceneProps) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const paramsRef = useRef(paramValues);
    const dataRef = useRef(dataPointToRender);
    const hideWavelengthRef = useRef(false);
    const applyRef = useRef<(() => void) | null>(null);
    const hideWavelength = !!hiddenParameters?.includes('wavelength');

    useEffect(() => {
        paramsRef.current = paramValues;
        dataRef.current = dataPointToRender;
        hideWavelengthRef.current = hideWavelength;
        applyRef.current?.();
    }, [paramValues, dataPointToRender, hideWavelength]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const { scene, start, dispose } = setupScene(mount, {
            fov: 42,
            far: 1000,
            fog: { near: 140, far: 320 },
            cameraPosition: [-24, 32, 64],
            target: [4, 10, 0],
            lights: {
                ambientIntensity: 0.5,
                directionalIntensity: 1.3,
                directionalPosition: [30, 60, 40],
                shadowCamera: { left: -70, right: 70, top: 40, bottom: -40, near: 1, far: 200 },
            },
            controls: { minDistance: 10, maxDistance: 260, maxPolarAngle: Math.PI / 2 - 0.02 },
        });

        const steel = labMaterials.steel();
        const anodized = labMaterials.anodized();
        const graphite = labMaterials.graphite();
        const ceramic = new THREE.MeshStandardMaterial({ color: 0xe6e1ee, metalness: 0, roughness: 0.45 });
        const glowTexture = createGlowTexture();

        scene.add(createLabFloor({ size: 260, divisions: 52 }));

        // Optical bench with a steel rail on top.
        const bench = new THREE.Mesh(new THREE.BoxGeometry(118, 2, 6), anodized);
        bench.position.set(12, BENCH_TOP - 1, 0);
        bench.receiveShadow = true;
        bench.castShadow = true;
        scene.add(bench);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(118, 0.3, 2.2), steel);
        rail.position.set(12, BENCH_TOP + 0.15, 0);
        scene.add(rail);
        const legGeometry = new THREE.BoxGeometry(2.4, BENCH_TOP - 2, 4.5);
        [-40, 64].forEach((x) => {
            const leg = new THREE.Mesh(legGeometry, graphite);
            leg.position.set(x, (BENCH_TOP - 2) / 2, 0);
            scene.add(leg);
        });

        // A carrier (slides on the rail) with a post up to the beam axis.
        const carrierGeometry = new THREE.BoxGeometry(3, 1, 4);
        const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16);
        const createCarrier = (postTop: number) => {
            const carrier = new THREE.Group();
            const base = new THREE.Mesh(carrierGeometry, graphite);
            base.position.y = BENCH_TOP + 0.8;
            carrier.add(base);
            const post = new THREE.Mesh(postGeometry, steel);
            const height = postTop - (BENCH_TOP + 1.3);
            post.scale.y = height;
            post.position.y = BENCH_TOP + 1.3 + height / 2;
            carrier.add(post);
            carrier.traverse((node) => {
                node.castShadow = true;
            });
            scene.add(carrier);
            return carrier;
        };

        // Both sources share the aperture material, so the beam colour lights whichever is shown.
        const apertureMaterial = labMaterials.glow(0xffffff, 2.5);
        const apertureGeometry = new THREE.CircleGeometry(0.35, 32);
        const addAperture = (group: THREE.Group) => {
            const aperture = new THREE.Mesh(apertureGeometry, apertureMaterial);
            aperture.rotation.y = Math.PI / 2;
            aperture.position.x = SOURCE_LENGTH / 2 + 0.26;
            group.add(aperture);
        };

        // Laser head: a square housing with end caps and a power LED.
        const laser = new THREE.Group();
        laser.position.set(SOURCE_X, AXIS_Y, 0);
        const housing = new THREE.Mesh(new THREE.BoxGeometry(SOURCE_LENGTH, 2.6, 2.6), anodized);
        housing.castShadow = true;
        laser.add(housing);
        const capGeometry = new THREE.BoxGeometry(0.5, 2.9, 2.9);
        [-SOURCE_LENGTH / 2, SOURCE_LENGTH / 2].forEach((x) => {
            const cap = new THREE.Mesh(capGeometry, steel);
            cap.position.x = x;
            laser.add(cap);
        });
        addAperture(laser);
        const powerLed = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), labMaterials.glow(LAB_COLORS.plasma, 2));
        powerLed.position.set(-SOURCE_LENGTH / 2 + 1.4, 1.32, 0.8);
        laser.add(powerLed);
        scene.add(laser);

        // Electron gun: a round vacuum column with a ribbed ceramic high-voltage insulator at the
        // back (where the heated cathode sits) and an anode disk at the front.
        const gun = new THREE.Group();
        gun.position.set(SOURCE_X, AXIS_Y, 0);
        const column = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, SOURCE_LENGTH * 0.6, 40), anodized);
        column.rotation.z = Math.PI / 2;
        column.position.x = SOURCE_LENGTH * 0.2;
        gun.add(column);
        const ribGeometry = new THREE.CylinderGeometry(1.15, 1.15, 0.45, 40);
        for (let i = 0; i < 5; i++) {
            const rib = new THREE.Mesh(ribGeometry, ceramic);
            rib.rotation.z = Math.PI / 2;
            rib.position.x = -SOURCE_LENGTH / 2 + 0.4 + i * 0.75;
            gun.add(rib);
        }
        const insulatorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 3.8, 32), ceramic);
        insulatorCore.rotation.z = Math.PI / 2;
        insulatorCore.position.x = -SOURCE_LENGTH / 2 + 1.9;
        gun.add(insulatorCore);
        const flangeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 40);
        [-SOURCE_LENGTH * 0.1, SOURCE_LENGTH / 2].forEach((x) => {
            const flange = new THREE.Mesh(flangeGeometry, steel);
            flange.rotation.z = Math.PI / 2;
            flange.position.x = x;
            gun.add(flange);
        });
        const cathode = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), labMaterials.glow(LAB_COLORS.plasma, 2.4));
        cathode.position.x = -SOURCE_LENGTH / 2 + 3.9;
        gun.add(cathode);
        addAperture(gun);
        gun.traverse((node) => {
            node.castShadow = true;
        });
        scene.add(gun);
        createCarrier(AXIS_Y - 1.3).position.x = SOURCE_X;

        // Beam from the aperture to the slit plate: a bright core and a soft sheath.
        const beamLength = SLIT_X - APERTURE_X;
        const beamCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
        const beamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, beamLength, 12), beamCoreMaterial);
        const beamSheathMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
        });
        const beamSheath = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, beamLength, 16), beamSheathMaterial);
        [beamCore, beamSheath].forEach((mesh) => {
            mesh.rotation.z = Math.PI / 2;
            mesh.position.set(APERTURE_X + beamLength / 2, AXIS_Y, 0);
            scene.add(mesh);
        });
        const beamSpot = createGlowSprite(0xffffff, 2.4, glowTexture);
        if (beamSpot) {
            beamSpot.position.set(SLIT_X - 0.2, AXIS_Y, 0);
            scene.add(beamSpot);
        }
        // Electrons in flight towards the slits (electron mode only).
        const pulses = [0, 1, 2]
            .map(() => createGlowSprite(LAB_COLORS.blueshift, 1.1, glowTexture))
            .filter((sprite): sprite is THREE.Sprite => sprite !== null);
        pulses.forEach((pulse) => {
            pulse.position.set(APERTURE_X, AXIS_Y, 0);
            scene.add(pulse);
        });

        // λ readout above the source; rebuilt when the wavelength changes.
        let wavelengthLabel: THREE.Sprite | null = null;
        let wavelengthText = '';
        const setWavelengthLabel = (text: string) => {
            if (text === wavelengthText) return;
            wavelengthText = text;
            if (wavelengthLabel) {
                scene.remove(wavelengthLabel);
                disposeObject3D(wavelengthLabel);
            }
            wavelengthLabel = createTextSprite(text, { height: 1.1, color: '#f1ecf7' });
            if (wavelengthLabel) {
                wavelengthLabel.position.set(SOURCE_X, AXIS_Y + 3.2, 0);
                scene.add(wavelengthLabel);
            }
        };

        // Slit plate holder; the plate itself is rebuilt when the slits change.
        createCarrier(AXIS_Y - PLATE_HEIGHT / 2).position.x = SLIT_X;
        const plateMaterial = labMaterials.steel();
        let plate: THREE.Group | null = null;
        let plateKey = '';

        // Shared pattern texture, read by both the wave field and the screen.
        const patternData = new Uint8Array(PATTERN_SAMPLES * 4);
        const patternTexture = new THREE.DataTexture(patternData, PATTERN_SAMPLES, 1);
        patternTexture.magFilter = THREE.LinearFilter;
        patternTexture.minFilter = THREE.LinearFilter;
        patternTexture.needsUpdate = true;

        const fieldUniforms = {
            uPattern: { value: patternTexture },
            uColor: { value: new THREE.Color(1, 1, 1) },
            uTime: { value: 0 },
            uLength: { value: 20 },
            uStrength: { value: 0 },
        };
        const field = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.ShaderMaterial({
                uniforms: fieldUniforms,
                vertexShader: FIELD_VERTEX,
                fragmentShader: FIELD_FRAGMENT,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
            })
        );
        field.rotation.x = -Math.PI / 2;
        scene.add(field);

        // Screen: a frame on its carrier with the display surface facing the slits.
        const screen = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.6, SCREEN_HEIGHT + 1, SCREEN_WIDTH + 1), graphite);
        frame.castShadow = true;
        screen.add(frame);
        const screenUniforms = {
            uPattern: { value: patternTexture },
            uColor: fieldUniforms.uColor,
            uFringes: { value: 0 },
        };
        const display = new THREE.Mesh(
            new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT),
            new THREE.ShaderMaterial({
                uniforms: screenUniforms,
                vertexShader: FIELD_VERTEX,
                fragmentShader: SCREEN_FRAGMENT,
            })
        );
        display.rotation.y = -Math.PI / 2;
        display.position.x = -0.32;
        screen.add(display);

        // Electron detections: one point per electron, revealed over time with the draw range.
        const hitPositions = new Float32Array(MAX_DETECTIONS * 3);
        const hitGeometry = new THREE.BufferGeometry();
        hitGeometry.setAttribute('position', new THREE.BufferAttribute(hitPositions, 3));
        hitGeometry.setDrawRange(0, 0);
        const hits = new THREE.Points(
            hitGeometry,
            new THREE.PointsMaterial({
                color: new THREE.Color(0xdfe9ff),
                map: glowTexture,
                size: 0.26,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false,
            })
        );
        hits.frustumCulled = false;
        screen.add(hits);
        let hitsKey = '';
        let hitsStart = 0;

        screen.position.y = AXIS_Y;
        scene.add(screen);
        const screenCarrier = createCarrier(AXIS_Y - SCREEN_HEIGHT / 2 - 0.5);

        // Scale under the screen, ticks pointing down; rebuilt when the window changes.
        let ruler: THREE.Group | null = null;
        let rulerHalf = -1;
        const setRuler = (halfMm: number) => {
            if (Math.abs(halfMm - rulerHalf) <= halfMm * 1e-6) return;
            rulerHalf = halfMm;
            if (ruler) {
                screen.remove(ruler);
                disposeObject3D(ruler);
                ruler = null;
            }
            if (halfMm <= 0) return;
            const { unit, perMm } = screenUnitFor(halfMm);
            const half = halfMm * perMm;
            const majorStep = niceStep(2 * half, 6);
            ruler = createRuler({
                min: -half,
                max: half,
                scale: SCREEN_WIDTH / (2 * half),
                minorStep: majorStep / 5,
                majorStep,
                labelStep: majorStep,
                format: (v) => `${Number(v.toPrecision(3))} ${unit}`,
                tickSize: 0.8,
                labelHeight: 0.8,
            });
            ruler.quaternion.setFromRotationMatrix(
                new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0))
            );
            ruler.position.set(-0.5, -SCREEN_HEIGHT / 2 - 0.7, 0);
            screen.add(ruler);
        };

        let source: DoubleSlitSource = 'light';
        let running = false;

        const apply = () => {
            const params = paramsRef.current;
            const data = dataRef.current;
            const pattern = Array.isArray(data?.pattern) ? (data.pattern as DoubleSlitPoint[]) : null;
            // The source, colour and slits follow the parameters the pattern was computed with.
            const used = (pattern ? (data?.parameters as ParameterValues | undefined) : params) ?? params;
            const engineParams = (used ?? {}) as EngineParameters;
            source = readSource(engineParams);
            running = !!pattern && pattern.length > 1;

            const offset = screenOffsetFor(readNumber(used, 'screen_distance'));
            const screenX = SLIT_X + offset;
            screen.position.x = screenX;
            screenCarrier.position.x = screenX;
            field.scale.set(offset, SCREEN_WIDTH, 1);
            field.position.set(SLIT_X + offset / 2, AXIS_Y, 0);
            fieldUniforms.uLength.value = offset;

            const spacing = readNumber(used, 'slit_spacing');
            const gap = slitGapFor(spacing);
            const opening = slitOpeningFor(gap, spacing, readNumber(used, 'slit_width'));
            const key = `${gap.toFixed(4)}:${opening.toFixed(4)}`;
            if (key !== plateKey) {
                if (plate) {
                    scene.remove(plate);
                    plate.traverse((node) => {
                        if (node instanceof THREE.Mesh) node.geometry.dispose();
                    });
                }
                plate = createSlitPlate(gap, opening, plateMaterial).group;
                plate.position.set(SLIT_X, AXIS_Y, 0);
                scene.add(plate);
                plateKey = key;
            }

            const lambda = sourceWavelength(engineParams);
            const isElectron = source === 'electron';
            // While λ is the student's unknown the readout must not print it.
            setWavelengthLabel(hideWavelengthRef.current && !isElectron ? 'λ = ?' : formatWavelength(lambda));
            laser.visible = !isElectron;
            gun.visible = isElectron;
            const color = isElectron ? ELECTRON_COLOR : lightColor(lambda * 1e9);
            fieldUniforms.uColor.value.copy(color);
            apertureMaterial.emissive.copy(color);
            beamCoreMaterial.color.copy(color);
            beamSheathMaterial.color.copy(color);
            beamSheathMaterial.opacity = isElectron ? 0.1 : 0.22;
            if (beamSpot) beamSpot.material.color.copy(color);

            fillPatternData(patternData, pattern);
            patternTexture.needsUpdate = true;
            const half = patternHalfWidth(pattern);
            setRuler(half);

            fieldUniforms.uStrength.value = running ? (isElectron ? 0.22 : 0.5) : 0;
            screenUniforms.uFringes.value = running && !isElectron ? 1 : 0;
            beamCore.visible = running && !isElectron;
            beamSheath.visible = running;
            if (beamSpot) beamSpot.visible = running;
            apertureMaterial.emissiveIntensity = running ? 2.5 : 0.2;

            // New electrons for every new setup; the same setup keeps the screen it has built.
            hits.visible = running && isElectron;
            const nextHitsKey = running && isElectron && pattern ? `${half}:${JSON.stringify(used)}` : '';
            if (nextHitsKey !== hitsKey) {
                hitsKey = nextHitsKey;
                hitGeometry.setDrawRange(0, 0);
                hitsStart = performance.now();
                if (nextHitsKey && pattern && half > 0) {
                    const random = mulberry32(pattern.length + Math.round(half * 1e6));
                    const xs = sampleDetections(pattern, MAX_DETECTIONS, random);
                    const toScreen = SCREEN_WIDTH / (2 * half);
                    xs.forEach((x, i) => {
                        hitPositions[i * 3] = -0.36;
                        hitPositions[i * 3 + 1] = (random() - 0.5) * SCREEN_HEIGHT * HIT_BAND;
                        hitPositions[i * 3 + 2] = x * toScreen;
                    });
                    hitGeometry.attributes.position.needsUpdate = true;
                }
            }
        };
        applyRef.current = apply;
        apply();

        start((time) => {
            const seconds = time / 1000;
            fieldUniforms.uTime.value = seconds;

            const showPulses = running && source === 'electron';
            pulses.forEach((pulse, i) => {
                pulse.visible = showPulses;
                if (!showPulses) return;
                const phase = (seconds * 0.9 + i / pulses.length) % 1;
                pulse.position.x = APERTURE_X + phase * (SLIT_X - APERTURE_X);
            });

            if (hits.visible) {
                hitGeometry.setDrawRange(0, detectionsAt((performance.now() - hitsStart) / 1000));
            }
        });

        return () => {
            applyRef.current = null;
            // Uniform textures are not material properties, so the scene sweep misses this one.
            patternTexture.dispose();
            // Disposes the loop, observer, controls, every geometry/material/texture still in the
            // scene (the hidden source, plate, ruler and label included), the renderer, and
            // removes the canvas.
            dispose();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
};

export default memo(DoubleSlitScene);
