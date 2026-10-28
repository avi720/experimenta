import { memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { ParameterValues } from '@/types/experiment';
import type { SimulationSceneProps } from '@/types/simulation';
import { setupScene } from '@/simulation/sceneUtils';
import {
    createGlowSprite,
    createGlowTexture,
    createLabFloor,
    createRuler,
    LAB_COLORS,
    labMaterials,
    wavelengthToRgb,
} from '@/simulation/labKit';

/*
 * Double-slit apparatus on an optical bench: laser → plate with two slits → screen.
 * The fringes on the screen and the light field between plate and screen are drawn from the
 * engine's own `pattern` (intensity vs. screen position), sampled from one data texture, so the
 * scene never computes physics of its own. Distances are not to scale (the slits are µm apart);
 * the screen distance and slit separation still move the screen and widen the slit gap.
 */

const AXIS_Y = 14;
const BENCH_TOP = 3;
const LASER_X = -34;
const LASER_LENGTH = 10;
const APERTURE_X = LASER_X + LASER_LENGTH / 2;
const SLIT_X = -12;
const SCREEN_WIDTH = 30;
const SCREEN_HEIGHT = 14;
/** The engine samples a 5 cm wide screen: -25..25 mm. */
const PATTERN_HALF_MM = 25;
const PLATE_WIDTH = 14;
const PLATE_HEIGHT = 12;
const SLIT_HEIGHT = 4;
const SLIT_WIDTH = 0.22;
const PATTERN_SAMPLES = 512;

const DEFAULTS = { wavelength: 500, slit_separation: 2000, screen_distance: 1 };

function readNumber(values: ParameterValues | undefined | null, key: keyof typeof DEFAULTS) {
    const parsed = parseFloat(String(values?.[key]));
    return Number.isFinite(parsed) ? parsed : DEFAULTS[key];
}

/** Scene distance from the slit plate to the screen for a screen distance of `meters` (0.1–5 m). */
export function screenOffsetFor(meters: number): number {
    return 14 + 9 * Math.min(Math.max(meters, 0), 5);
}

/** Visual gap between the slit centres for a separation of `nm` (500–10000 nm). */
export function slitGapFor(nm: number): number {
    const t = (Math.min(Math.max(nm, 500), 10000) - 500) / 9500;
    return 0.6 + 2.4 * t;
}

/**
 * A plate with two vertical slits `gap` apart (centre to centre), in the YZ plane, built from
 * five blocks around the openings. Returns the group and the slit centres (Z) for checks.
 */
export function createSlitPlate(gap: number, material: THREE.Material) {
    const group = new THREE.Group();
    group.name = 'slit-plate';
    const thickness = 0.3;
    const halfW = PLATE_WIDTH / 2;
    const bandHeight = (PLATE_HEIGHT - SLIT_HEIGHT) / 2;
    const inner = gap / 2 - SLIT_WIDTH / 2;
    const outer = gap / 2 + SLIT_WIDTH / 2;

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

/**
 * Writes the engine pattern into `data` (RGBA, one texel per screen sample), normalized to the
 * brightest point. Positions are in mm across -25..25; samples outside it stay dark.
 */
export function fillPatternData(
    data: Uint8Array,
    pattern: ReadonlyArray<{ position?: unknown; intensity?: unknown }> | null | undefined
) {
    data.fill(0);
    if (!pattern || pattern.length === 0) return data;
    const points = pattern
        .map((p) => ({ x: Number(p.position), i: Number(p.intensity) }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.i))
        .sort((a, b) => a.x - b.x);
    const max = points.reduce((m, p) => Math.max(m, p.i), 0);
    if (points.length === 0 || max <= 0) return data;

    const samples = data.length / 4;
    let j = 0;
    for (let s = 0; s < samples; s++) {
        const x = -PATTERN_HALF_MM + (2 * PATTERN_HALF_MM * (s + 0.5)) / samples;
        if (x < points[0].x || x > points[points.length - 1].x) continue;
        while (j < points.length - 2 && points[j + 1].x < x) j++;
        const a = points[j];
        const b = points[Math.min(j + 1, points.length - 1)];
        const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
        const value = Math.round((255 * (a.i + (b.i - a.i) * t)) / max);
        data.set([value, value, value, 255], s * 4);
    }
    return data;
}

const FIELD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Light between the plate and the screen. A point a fraction f of the way to the screen, at a
// lateral offset z, lies on the ray that lands at z / f on the screen, so it takes that screen
// point's intensity. Travelling wavefronts from the slits are decoration on top.
const FIELD_FRAGMENT = /* glsl */ `
uniform sampler2D uPattern;
uniform vec3 uColor;
uniform float uTime;
uniform float uLength;
uniform float uOn;
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
    float a = intensity * inside * wave * fadeIn * 0.5 * uOn;
    gl_FragColor = vec4(uColor, a);
}`;

const SCREEN_FRAGMENT = /* glsl */ `
uniform sampler2D uPattern;
uniform vec3 uColor;
uniform float uOn;
varying vec2 vUv;
void main() {
    float intensity = texture2D(uPattern, vec2(vUv.x, 0.5)).r;
    float band = 1.0 - smoothstep(0.22, 0.42, abs(vUv.y - 0.5));
    vec3 lit = uColor * pow(intensity, 0.8) * 1.5 * band * uOn;
    gl_FragColor = vec4(vec3(0.035, 0.03, 0.05) + lit, 1.0);
}`;

/** sRGB colour (0..1) of light at `nm`. */
function lightColor(nm: number): THREE.Vector3 {
    return new THREE.Vector3(...wavelengthToRgb(nm));
}

const DoubleSlitScene = ({ paramValues, dataPointToRender }: SimulationSceneProps) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const paramsRef = useRef(paramValues);
    const dataRef = useRef(dataPointToRender);
    const applyRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        paramsRef.current = paramValues;
        dataRef.current = dataPointToRender;
        applyRef.current?.();
    }, [paramValues, dataPointToRender]);

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

        // Laser head.
        const laser = new THREE.Group();
        laser.position.set(LASER_X, AXIS_Y, 0);
        const housing = new THREE.Mesh(new THREE.BoxGeometry(LASER_LENGTH, 2.6, 2.6), anodized);
        housing.castShadow = true;
        laser.add(housing);
        const capGeometry = new THREE.BoxGeometry(0.5, 2.9, 2.9);
        [-LASER_LENGTH / 2, LASER_LENGTH / 2].forEach((x) => {
            const cap = new THREE.Mesh(capGeometry, steel);
            cap.position.x = x;
            laser.add(cap);
        });
        const apertureMaterial = labMaterials.glow(0xffffff, 2.5);
        const aperture = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), apertureMaterial);
        aperture.rotation.y = Math.PI / 2;
        aperture.position.x = LASER_LENGTH / 2 + 0.26;
        laser.add(aperture);
        const powerLed = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), labMaterials.glow(LAB_COLORS.plasma, 2));
        powerLed.position.set(-LASER_LENGTH / 2 + 1.4, 1.32, 0.8);
        laser.add(powerLed);
        scene.add(laser);
        createCarrier(AXIS_Y - 1.3).position.x = LASER_X;

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

        // Slit plate holder; the plate itself is rebuilt when the separation changes.
        createCarrier(AXIS_Y - PLATE_HEIGHT / 2).position.x = SLIT_X;
        const plateMaterial = labMaterials.steel();
        let plate: THREE.Group | null = null;
        let plateGap = -1;

        // Shared pattern texture, read by both the light field and the screen.
        const patternData = new Uint8Array(PATTERN_SAMPLES * 4);
        const patternTexture = new THREE.DataTexture(patternData, PATTERN_SAMPLES, 1);
        patternTexture.magFilter = THREE.LinearFilter;
        patternTexture.minFilter = THREE.LinearFilter;
        patternTexture.needsUpdate = true;

        const fieldUniforms = {
            uPattern: { value: patternTexture },
            uColor: { value: new THREE.Vector3(1, 1, 1) },
            uTime: { value: 0 },
            uLength: { value: 20 },
            uOn: { value: 0 },
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
            uOn: fieldUniforms.uOn,
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

        // Millimetre scale under the screen, ticks pointing down.
        const ruler = createRuler({
            min: -PATTERN_HALF_MM,
            max: PATTERN_HALF_MM,
            scale: SCREEN_WIDTH / (2 * PATTERN_HALF_MM),
            minorStep: 1,
            majorStep: 5,
            labelStep: 10,
            format: (v) => `${v} mm`,
            tickSize: 0.8,
            labelHeight: 0.8,
        });
        ruler.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0))
        );
        ruler.position.set(-0.5, -SCREEN_HEIGHT / 2 - 0.7, 0);
        screen.add(ruler);
        screen.position.y = AXIS_Y;
        scene.add(screen);
        const screenCarrier = createCarrier(AXIS_Y - SCREEN_HEIGHT / 2 - 0.5);

        const apply = () => {
            const params = paramsRef.current;
            const data = dataRef.current;

            const offset = screenOffsetFor(readNumber(params, 'screen_distance'));
            const screenX = SLIT_X + offset;
            screen.position.x = screenX;
            screenCarrier.position.x = screenX;
            field.scale.set(offset, SCREEN_WIDTH, 1);
            field.position.set(SLIT_X + offset / 2, AXIS_Y, 0);
            fieldUniforms.uLength.value = offset;

            const gap = slitGapFor(readNumber(params, 'slit_separation'));
            if (Math.abs(gap - plateGap) > 1e-3) {
                if (plate) {
                    scene.remove(plate);
                    plate.traverse((node) => {
                        if (node instanceof THREE.Mesh) node.geometry.dispose();
                    });
                }
                plate = createSlitPlate(gap, plateMaterial).group;
                plate.position.set(SLIT_X, AXIS_Y, 0);
                scene.add(plate);
                plateGap = gap;
            }

            // Colour follows the wavelength the pattern was computed with, if there is one.
            const pattern = Array.isArray(data?.pattern) ? data.pattern : null;
            const wavelength = readNumber(pattern ? data?.parameters : params, 'wavelength');
            const color = lightColor(wavelength);
            fieldUniforms.uColor.value.copy(color);
            const threeColor = new THREE.Color().setRGB(color.x, color.y, color.z, THREE.SRGBColorSpace);
            apertureMaterial.emissive.copy(threeColor);
            beamCoreMaterial.color.copy(threeColor);
            beamSheathMaterial.color.copy(threeColor);
            if (beamSpot) beamSpot.material.color.copy(threeColor);

            fillPatternData(patternData, pattern);
            patternTexture.needsUpdate = true;
            const on = pattern && pattern.length > 0 ? 1 : 0;
            fieldUniforms.uOn.value = on;
            [beamCore, beamSheath].forEach((mesh) => {
                mesh.visible = on === 1;
            });
            if (beamSpot) beamSpot.visible = on === 1;
            apertureMaterial.emissiveIntensity = on ? 2.5 : 0.2;
        };
        applyRef.current = apply;
        apply();

        start((time) => {
            fieldUniforms.uTime.value = time / 1000;
        });

        return () => {
            applyRef.current = null;
            // Uniform textures are not material properties, so the scene sweep misses this one.
            patternTexture.dispose();
            // Disposes the loop, observer, controls, every geometry/material/texture still in the
            // scene, the renderer, and removes the canvas.
            dispose();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
};

export default memo(DoubleSlitScene);
