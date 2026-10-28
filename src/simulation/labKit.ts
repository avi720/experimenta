import * as THREE from 'three';

/**
 * Shared building blocks for the experiment scenes, so every apparatus reads as one lab:
 * the brand palette, a small set of physically based materials, the lab floor, measuring
 * scales and glow sprites. Everything here allocates plain three.js objects that the scene
 * owns; `disposeObject3D` (sceneUtils) releases them with the rest of the scene.
 */

/** Brand colours as hex (docs/BRAND.md). */
export const LAB_COLORS = Object.freeze({
    plasma: 0xffb25e,
    plasmaHi: 0xffe2b8,
    blueshift: 0x9dbbff,
    horizon: 0xb48cff,
    star: 0xf1ecf7,
    dust: 0xa39bb5,
    line: 0x2a2439,
    emerald: 0x6ee7b7,
});

/** Material factories. Each call returns a new material, so callers decide what to share. */
export const labMaterials = {
    /** Brushed aluminium / steel for frames, rails and posts. */
    steel: () => new THREE.MeshStandardMaterial({ color: 0xc4c7d2, metalness: 1, roughness: 0.32 }),
    /** Mirror-like finish for the objects the experiment is about (balls, gliders). */
    polished: () => new THREE.MeshStandardMaterial({ color: 0xeceef4, metalness: 1, roughness: 0.1 }),
    /** Dark anodized housings. */
    anodized: () => new THREE.MeshStandardMaterial({ color: 0x1f1b2b, metalness: 0.65, roughness: 0.42 }),
    /** Matte graphite for bases and stands. */
    graphite: () => new THREE.MeshStandardMaterial({ color: 0x2b2738, metalness: 0.25, roughness: 0.78 }),
    /** Self-lit indicator surfaces (apertures, sensor rings, status lights). */
    glow: (color: number, intensity = 1.6) =>
        new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity }),
};

/** False in non-DOM environments (unit tests), where canvas-backed textures are skipped. */
const canDraw = () => typeof document !== 'undefined';

function drawTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    if (!canDraw()) return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    paint(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export type LabFloorOptions = {
    size: number;
    divisions?: number;
    y?: number;
};

/**
 * A dark lab floor with a fine grid; with scene fog its edges dissolve into space.
 */
export function createLabFloor({ size, divisions = Math.round(size / 5), y = 0 }: LabFloorOptions): THREE.Group {
    const group = new THREE.Group();
    group.name = 'lab-floor';

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({ color: 0x110e1a, metalness: 0.2, roughness: 0.88 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = y;
    floor.receiveShadow = true;
    group.add(floor);

    const grid = new THREE.GridHelper(size, divisions, 0x3a3152, 0x231e31);
    grid.position.y = y + 0.02;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
        material.transparent = true;
        material.opacity = 0.6;
        material.depthWrite = false;
    });
    group.add(grid);

    return group;
}

/**
 * A soft radial glow sprite texture, or null outside the browser.
 */
export function createGlowTexture(): THREE.Texture | null {
    return drawTexture(64, 64, (ctx) => {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
    });
}

/**
 * An additive glow sprite of `size` scene units, or null when no texture can be drawn.
 * Pass a shared texture to avoid one canvas per sprite.
 */
export function createGlowSprite(color: number, size: number, texture: THREE.Texture | null): THREE.Sprite | null {
    if (!texture) return null;
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: texture,
            color,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        })
    );
    sprite.scale.set(size, size, 1);
    return sprite;
}

export type TextSpriteOptions = {
    /** Glyph height in scene units. */
    height: number;
    color?: string;
    /** Which point of the label sits at its position: 0 = left/bottom, 0.5 = centre. */
    anchorX?: number;
};

/**
 * A camera-facing text label (monospace, for scale numbers and units), or null outside the browser.
 */
export function createTextSprite(text: string, { height, color = '#a39bb5', anchorX = 0.5 }: TextSpriteOptions): THREE.Sprite | null {
    if (!canDraw()) return null;
    const fontPx = 48;
    const lineHeight = Math.round(fontPx * 1.3);
    const font = `500 ${fontPx}px "IBM Plex Mono", ui-monospace, monospace`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.font = font;
    const width = Math.ceil(probe.measureText(text).width) + 8;
    const texture = drawTexture(width, lineHeight, (ctx) => {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 4, lineHeight / 2);
    });
    if (!texture) return null;
    texture.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
    const aspect = width / lineHeight;
    sprite.scale.set(height * 1.3 * aspect, height * 1.3, 1);
    sprite.center.set(anchorX, 0.5);
    return sprite;
}

/** Picks a 1-2-5 step that splits `range` into roughly `targetCount` intervals. */
export function niceStep(range: number, targetCount: number): number {
    if (!(range > 0) || !(targetCount > 0)) return 1;
    const raw = range / targetCount;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const residual = raw / magnitude;
    const nice = residual >= 5 ? 5 : residual >= 2 ? 2 : 1;
    return nice * magnitude;
}

export type RulerOptions = {
    /** Value range covered by the scale. */
    min: number;
    max: number;
    /** Scene units per value unit; value `v` sits at local y = v * scale. */
    scale: number;
    minorStep: number;
    majorStep: number;
    labelStep: number;
    format: (value: number) => string;
    /** Length of a major tick in scene units; minor ticks are half of it. */
    tickSize: number;
    thickness?: number;
    labelHeight?: number;
    color?: number;
};

const EPSILON = 1e-6;

function isMultiple(value: number, step: number) {
    const ratio = value / step;
    return Math.abs(ratio - Math.round(ratio)) < EPSILON;
}

/**
 * A measuring scale along local +Y with ticks pointing to +X and numeric labels beyond them.
 * Rotate the returned group to lay it along another axis. Ticks are one InstancedMesh, so the
 * draw cost does not grow with the range.
 */
export function createRuler({
    min,
    max,
    scale,
    minorStep,
    majorStep,
    labelStep,
    format,
    tickSize,
    thickness = tickSize * 0.08,
    labelHeight = tickSize * 0.9,
    color = LAB_COLORS.dust,
}: RulerOptions): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ruler';
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false });

    const length = (max - min) * scale;
    const spine = new THREE.Mesh(new THREE.BoxGeometry(thickness, length, thickness), material);
    spine.position.y = ((min + max) / 2) * scale;
    group.add(spine);

    const first = Math.ceil(min / minorStep - EPSILON);
    const last = Math.floor(max / minorStep + EPSILON);
    const count = Math.max(0, last - first + 1);
    const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, thickness, thickness), material, count);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const size = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
        const value = (first + i) * minorStep;
        const tick = isMultiple(value, majorStep) ? tickSize : tickSize * 0.5;
        position.set(tick / 2, value * scale, 0);
        size.set(tick, 1, 1);
        ticks.setMatrixAt(i, matrix.compose(position, quaternion, size));

        if (isMultiple(value, labelStep)) {
            const label = createTextSprite(format(value), { height: labelHeight, anchorX: 0 });
            if (label) {
                label.position.set(tickSize + labelHeight * 0.4, value * scale, 0);
                group.add(label);
            }
        }
    }
    ticks.instanceMatrix.needsUpdate = true;
    group.add(ticks);
    return group;
}

/**
 * Converts a visible wavelength (nm) to an sRGB colour (0..1 per channel), black outside
 * 380–780 nm. Piecewise-linear approximation of the spectral colours.
 */
export function wavelengthToRgb(wavelength: number): [number, number, number] {
    let r = 0;
    let g = 0;
    let b = 0;
    if (wavelength >= 380 && wavelength < 440) {
        r = -(wavelength - 440) / (440 - 380);
        b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
        g = (wavelength - 440) / (490 - 440);
        b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
        g = 1;
        b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1;
    } else if (wavelength >= 580 && wavelength < 645) {
        r = 1;
        g = -(wavelength - 645) / (645 - 580);
    } else if (wavelength >= 645 && wavelength <= 780) {
        r = 1;
    }
    return [r, g, b];
}
