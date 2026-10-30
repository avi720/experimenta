import { useEffect, useRef } from "react";

/**
 * A decorative black hole for dark backgrounds (the lab workspace behind its 3D scenes).
 *
 * Unlike the homepage BlackHoleField this is an animation, not a simulation: the stars and three
 * disk annuli are painted once into offscreen sprites, and each frame only rotates the annuli at
 * different speeds (inner faster, so the disk shears like real orbital gas), squashes them into
 * the inclined disk, and composites back half → shadow → front half. That is a handful of
 * drawImage calls at ≤30 fps, paused while the tab is hidden and frozen under reduced motion.
 */

const COS_I = 0.3; // disk inclination: 1 = face-on, 0 = edge-on
const FRAME_MS = 1000 / 30;
const MAX_DPR = 1.5;

/** Annuli as fractions of the shadow radius, with angular speed in rad/s. */
const ANNULI = [
    { inner: 1.45, outer: 2.3, speed: 0.11, streaks: 520, hot: 1 },
    { inner: 2.2, outer: 3.4, speed: 0.06, streaks: 640, hot: 0.65 },
    { inner: 3.3, outer: 5.2, speed: 0.032, streaks: 760, hot: 0.35 },
] as const;

// Brand colours as RGB (docs/BRAND.md).
const PLASMA_HI: Rgb = [255, 226, 184];
const PLASMA: Rgb = [255, 178, 94];
const HORIZON: Rgb = [180, 140, 255];
const STAR: Rgb = [241, 236, 247];

type Rgb = [number, number, number];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgba([r, g, b]: Rgb, alpha: number): string {
    return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
}

/** Small seeded PRNG so the sprites look the same on every visit. */
function mulberry32(seed: number) {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function makeCanvas(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
}

/** Face-on annulus of streaky gas, centred in a square sprite of side 2·outer·R. */
function paintAnnulus(radius: number, annulus: (typeof ANNULI)[number], seed: number) {
    const outerPx = annulus.outer * radius;
    const size = outerPx * 2;
    const canvas = makeCanvas(size, size);
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    const rand = mulberry32(seed);
    const c = size / 2;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < annulus.streaks; i++) {
        const u = rand();
        const r = (annulus.inner + (annulus.outer - annulus.inner) * u) * radius;
        // Bright near the inner edge of the whole disk, fading outward.
        const heat = annulus.hot * (1 - u * 0.7);
        const color = heat > 0.6 ? mix(PLASMA, PLASMA_HI, (heat - 0.6) / 0.4) : mix(HORIZON, PLASMA, heat / 0.6);
        const start = rand() * Math.PI * 2;
        const length = 0.25 + rand() * 0.9;
        ctx.strokeStyle = rgba(color, 0.05 + 0.13 * heat * rand());
        ctx.lineWidth = (0.6 + rand() * 2.4) * (radius / 40);
        ctx.beginPath();
        ctx.arc(c, c, r, start, start + length);
        ctx.stroke();
    }
    // Soft edges so the annuli overlap without seams.
    ctx.globalCompositeOperation = "destination-in";
    const fade = ctx.createRadialGradient(c, c, annulus.inner * radius, c, c, outerPx);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.18, "rgba(0,0,0,1)");
    fade.addColorStop(0.75, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, size, size);
    return canvas;
}

function paintStars(width: number, height: number, seed: number) {
    const canvas = makeCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    const rand = mulberry32(seed);
    const count = Math.round((width * height) / 5200);
    for (let i = 0; i < count; i++) {
        const bright = rand() ** 6;
        ctx.fillStyle = rgba(mix(STAR, rand() > 0.8 ? HORIZON : PLASMA_HI, rand() * 0.4), 0.18 + bright * 0.7);
        const s = 0.5 + bright * 1.4;
        ctx.fillRect(rand() * width, rand() * height, s, s);
    }
    return canvas;
}

type BlackHoleBackdropProps = {
    /** The hole sits on the start side, away from end-side panels. */
    dir?: "rtl" | "ltr";
    className?: string;
};

export default function BlackHoleBackdrop({ dir = "ltr", className = "" }: BlackHoleBackdropProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !parent || !ctx) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let width = 0;
        let height = 0;
        let radius = 0;
        let cx = 0;
        let cy = 0;
        let stars: HTMLCanvasElement | null = null;
        let annuli: HTMLCanvasElement[] = [];
        let frame: HTMLCanvasElement | null = null;
        let frameCtx: CanvasRenderingContext2D | null = null;

        const layout = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
            width = Math.max(1, Math.round(parent.clientWidth * dpr));
            height = Math.max(1, Math.round(parent.clientHeight * dpr));
            canvas.width = width;
            canvas.height = height;
            radius = Math.max(14, Math.min(width, height) * 0.055);
            cx = (dir === "rtl" ? 0.76 : 0.24) * width;
            cy = 0.24 * height;
            stars = paintStars(width, height, 7);
            annuli = ANNULI.map((a, i) => paintAnnulus(radius, a, 11 + i));
            const outer = ANNULI[ANNULI.length - 1].outer * radius;
            frame = makeCanvas(outer * 2, outer * 2);
            frameCtx = frame.getContext("2d");
        };

        /** Draws the half of the disk above (back) or below (front) the hole's centre line. */
        const drawDiskHalf = (target: CanvasRenderingContext2D, c: number, half: "back" | "front", seconds: number) => {
            target.save();
            target.beginPath();
            if (half === "back") target.rect(0, 0, c * 2, c);
            else target.rect(0, c, c * 2, c);
            target.clip();
            target.translate(c, c);
            target.scale(1, COS_I);
            annuli.forEach((sprite, i) => {
                target.save();
                target.rotate(seconds * ANNULI[i].speed);
                target.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                target.restore();
            });
            target.restore();
        };

        const draw = (seconds: number) => {
            if (!stars || !frame || !frameCtx) return;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(stars, 0, 0);

            const f = frameCtx;
            const c = frame.width / 2;
            f.clearRect(0, 0, frame.width, frame.height);
            f.globalCompositeOperation = "lighter";
            drawDiskHalf(f, c, "back", seconds);

            // Lensed image of the far disk, bent up and over the shadow.
            f.globalCompositeOperation = "lighter";
            const arc = f.createRadialGradient(c, c, radius * 1.05, c, c, radius * 1.9);
            arc.addColorStop(0, rgba(PLASMA_HI, 0.55));
            arc.addColorStop(0.35, rgba(PLASMA, 0.22));
            arc.addColorStop(1, rgba(HORIZON, 0));
            f.fillStyle = arc;
            f.beginPath();
            f.ellipse(c, c - radius * 0.12, radius * 1.9, radius * 1.55, 0, Math.PI, 0);
            f.ellipse(c, c - radius * 0.12, radius * 1.05, radius * 1.02, 0, 0, Math.PI, true);
            f.fill();

            // Shadow with the photon ring at its edge.
            f.globalCompositeOperation = "source-over";
            f.fillStyle = "#000";
            f.beginPath();
            f.arc(c, c, radius, 0, Math.PI * 2);
            f.fill();
            f.strokeStyle = rgba(PLASMA_HI, 0.5);
            f.lineWidth = Math.max(1, radius * 0.045);
            f.stroke();

            f.globalCompositeOperation = "lighter";
            drawDiskHalf(f, c, "front", seconds);

            // Doppler beaming: the approaching side (left here) is brighter than the receding one.
            f.globalCompositeOperation = "source-atop";
            const beam = f.createLinearGradient(0, 0, frame.width, 0);
            beam.addColorStop(0, "rgba(255, 236, 210, 0.22)");
            beam.addColorStop(0.5, "rgba(0, 0, 0, 0)");
            beam.addColorStop(1, "rgba(11, 9, 18, 0.45)");
            f.fillStyle = beam;
            f.fillRect(0, 0, frame.width, frame.height);
            f.globalCompositeOperation = "source-over";

            ctx.drawImage(frame, cx - c, cy - c);
        };

        layout();

        let rafId = 0;
        let last = 0;
        const loop = (time: number) => {
            rafId = requestAnimationFrame(loop);
            if (time - last < FRAME_MS) return;
            last = time;
            draw(time / 1000);
        };
        const play = () => {
            if (reducedMotion || rafId || document.hidden) return;
            rafId = requestAnimationFrame(loop);
        };
        const pause = () => {
            cancelAnimationFrame(rafId);
            rafId = 0;
        };
        const onVisibility = () => (document.hidden ? pause() : play());

        draw(0);
        play();
        document.addEventListener("visibilitychange", onVisibility);

        // Repainting the sprites is the expensive part, so wait for the size to settle
        // (the side panel animates open and closed).
        // The parent can still be unsized at mount (the page is laid out after this effect),
        // so compare against the size last painted instead of skipping the first callback.
        let resizeTimer = 0;
        let paintedSize = `${parent.clientWidth}x${parent.clientHeight}`;
        const resizeObserver = new ResizeObserver(() => {
            const size = `${parent.clientWidth}x${parent.clientHeight}`;
            if (size === paintedSize) return;
            paintedSize = size;
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                layout();
                draw(last / 1000);
            }, 150);
        });
        resizeObserver.observe(parent);

        return () => {
            pause();
            window.clearTimeout(resizeTimer);
            document.removeEventListener("visibilitychange", onVisibility);
            resizeObserver.disconnect();
        };
    }, [dir]);

    return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}
