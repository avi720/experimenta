import { useEffect, useRef } from 'react';

type BlackHoleFieldProps = {
    dir: 'rtl' | 'ltr';
    label: string;
    /** Called about four times a second with the parcels in the disk and the total that crossed the horizon. */
    onMeters?: (inDisk: number, crossed: number) => void;
    className?: string;
};

const COS_I = 0.36; // cos of the disk inclination (about 69° from face-on)
const SIN_I = Math.sqrt(1 - COS_I * COS_I);
const BUFFER_SCALE = 0.5; // gas is drawn at half resolution, then smoothed up
const MAX = 4000;
const BUCKETS = 16;
const SPRITE = 64;
const PREWARM_FRAMES = 1400;
// Blackbody-ish ramp: cool outer gas is deep red, the inner disk white, blueshifted gas pale blue.
const RAMP = [[120, 22, 12], [214, 74, 30], [255, 146, 62], [255, 200, 132], [255, 236, 214], [200, 218, 255]];

function makeSprites() {
    return Array.from({ length: BUCKETS }, (_, b) => {
        const t = (b / (BUCKETS - 1)) * (RAMP.length - 1);
        const i = Math.min(RAMP.length - 2, Math.floor(t));
        const f = t - i;
        const c = RAMP[i].map((v, k) => Math.round(v + (RAMP[i + 1][k] - v) * f)).join(',');
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = SPRITE;
        const g = sprite.getContext('2d');
        if (!g) return sprite;
        const grad = g.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
        // Gaussian-like falloff so overlapping puffs blend with no visible edge.
        for (let k = 0; k <= 6; k++) {
            const x = k / 6;
            grad.addColorStop(x, `rgba(${c},${Math.exp(-x * x * 4.5).toFixed(3)})`);
        }
        g.fillStyle = grad;
        g.fillRect(0, 0, SPRITE, SPRITE);
        return sprite;
    });
}

/**
 * The home hero: a black hole with an accretion disk, fed by the pointer.
 *
 * Gas moves under Newtonian gravity in the disk plane; viscosity bleeds angular momentum so it
 * spirals in, and inside the innermost stable orbit (3 horizon radii) it plunges. Each particle is a
 * soft parcel of gas drawn as a faint gaussian puff into half-resolution buffers, where the puffs
 * overlap into a cloud; puffs shear along their motion and stretch harder near the hole. The disk
 * is inclined, so gas behind the hole is hidden by its shadow and gas moving toward the viewer is
 * brighter and bluer. Pointer gas starts as fine wisps that swell, heat and scatter as they fall.
 *
 * Both canvases fill the parent element, which also receives the pointer listeners.
 */
export default function BlackHoleField({ dir, label, onMeters, className = '' }: BlackHoleFieldProps) {
    const starRef = useRef<HTMLCanvasElement>(null);
    const diskRef = useRef<HTMLCanvasElement>(null);
    const onMetersRef = useRef(onMeters);
    useEffect(() => {
        onMetersRef.current = onMeters;
    }, [onMeters]);

    useEffect(() => {
        const starCanvas = starRef.current;
        const canvas = diskRef.current;
        const host = canvas?.parentElement;
        const sctx = starCanvas?.getContext('2d');
        const ctx = canvas?.getContext('2d');
        const back = document.createElement('canvas');
        const front = document.createElement('canvas');
        const bctx = back.getContext('2d');
        const fctx = front.getContext('2d');
        if (!starCanvas || !canvas || !host || !sctx || !ctx || !bctx || !fctx) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const sprites = makeSprites();
        const X = new Float32Array(MAX), Z = new Float32Array(MAX);
        const VX = new Float32Array(MAX), VZ = new Float32Array(MAX);
        const VISC = new Float32Array(MAX), SIZE = new Float32Array(MAX), AGE = new Float32Array(MAX);
        // Pointer gas: STREAM marks a parcel as released by the pointer, R0 is the radius it started at.
        const STREAM = new Uint8Array(MAX), R0 = new Float32Array(MAX);
        let n = 0, swallowed = 0, flare = 0, feedDebt = 0;
        let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0, GM = 0;

        function layout() {
            const rect = host!.getBoundingClientRect();
            W = rect.width; H = rect.height;
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            for (const c of [starCanvas!, canvas!]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
            for (const c of [back, front]) { c.width = Math.ceil(W * BUFFER_SCALE); c.height = Math.ceil(H * BUFFER_SCALE); }
            const wide = W >= 768;
            // The hole sits on the side away from the headline.
            cx = wide ? W * (dir === 'rtl' ? 0.26 : 0.74) : W * 0.5;
            cy = wide ? H * 0.46 : H * 0.72;
            R = wide ? Math.min(W * 0.5, H) * 0.066 : Math.min(W, H) * 0.08;
            // Orbital period of 9 s at six horizon radii; everything else follows Kepler.
            const v6 = (2 * Math.PI * 6 * R) / 540;
            GM = v6 * v6 * 6 * R;
            drawStars();
        }

        function drawStars() {
            sctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            sctx!.clearRect(0, 0, W, H);
            const haze = sctx!.createRadialGradient(cx, cy, R, cx, cy, R * 16);
            haze.addColorStop(0, 'rgba(255,140,70,0.10)');
            haze.addColorStop(1, 'rgba(255,140,70,0)');
            sctx!.fillStyle = haze;
            sctx!.fillRect(0, 0, W, H);
            let seed = 20261028;
            const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            const thetaE = R * 3.4; // Einstein radius: each star is drawn at its lensed image position
            const count = Math.round((W * H) / 2400);
            for (let i = 0; i < count; i++) {
                let x = rnd() * W, y = rnd() * H;
                const a = 0.12 + rnd() * 0.6, size = rnd() < 0.07 ? 1.4 : 0.8;
                const dx = x - cx, dy = y - cy, beta = Math.hypot(dx, dy);
                if (beta > 0) {
                    const theta = (beta + Math.sqrt(beta * beta + 4 * thetaE * thetaE)) / 2;
                    x = cx + (dx / beta) * theta; y = cy + (dy / beta) * theta;
                }
                sctx!.fillStyle = `rgba(228,224,255,${a.toFixed(2)})`;
                sctx!.fillRect(x, y, size, size);
            }
        }

        function add(x: number, z: number, vx: number, vz: number, visc: number, size: number, stream = 0) {
            const i = n < MAX ? n++ : (Math.random() * MAX) | 0;
            X[i] = x; Z[i] = z; VX[i] = vx; VZ[i] = vz; VISC[i] = visc; SIZE[i] = size; AGE[i] = 0;
            STREAM[i] = stream; R0[i] = Math.hypot(x, z);
        }

        function remove(i: number) {
            n--;
            X[i] = X[n]; Z[i] = Z[n]; VX[i] = VX[n]; VZ[i] = VZ[n];
            VISC[i] = VISC[n]; SIZE[i] = SIZE[n]; AGE[i] = AGE[n]; STREAM[i] = STREAM[n]; R0[i] = R0[n];
        }

        // Steady supply on near-circular orbits keeps a disk visible with no input.
        function feed(count: number) {
            for (let k = 0; k < count; k++) {
                const r = R * (3.4 + Math.pow(Math.random(), 1.4) * 9), a = Math.random() * Math.PI * 2;
                const v = Math.sqrt(GM / r) * (0.95 + Math.random() * 0.05);
                add(Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * v, Math.cos(a) * v,
                    0.3 + Math.random() * 1.1, 0.7 + Math.random() * 0.6);
            }
        }

        // A wisp of gas where the pointer passes. One gesture shares a sub-orbital spin, so the wisp
        // falls inward on a tightening spiral: it speeds up and heats as it goes, and swells and
        // scatters near the hole until it blends into the disk.
        let gestureSpin = 0.55;
        function release(sx: number, sy: number, dx: number, dy: number, count: number) {
            for (let k = 0; k < count; k++) {
                const t = k / count;
                const x = sx - dx * t - cx + (Math.random() - 0.5) * R * 0.35;
                const z = (sy - dy * t - cy + (Math.random() - 0.5) * R * 0.35) / COS_I;
                const r = Math.max(R * 1.5, Math.hypot(x, z));
                const vc = Math.sqrt(GM / r), spin = gestureSpin + (Math.random() - 0.5) * 0.08;
                add(x, z,
                    (-z / r) * vc * spin - (x / r) * vc * 0.05 + dx * 0.012,
                    (x / r) * vc * spin - (z / r) * vc * 0.05 + (dy / COS_I) * 0.012,
                    0.6 + Math.random() * 0.8, 0.45 + Math.random() * 0.3, 1);
            }
        }

        function step(dt: number) {
            const SUB = 2, h = dt / SUB, isco = 3 * R, far = 48 * R;
            for (let s = 0; s < SUB; s++) {
                for (let i = n - 1; i >= 0; i--) {
                    const x = X[i], z = Z[i];
                    const r2 = x * x + z * z, r = Math.sqrt(r2);
                    if (r < R * 1.02) { remove(i); swallowed++; flare = Math.min(0.5, flare + 0.008); continue; }
                    if (r > far) { remove(i); continue; }
                    const g = GM / (r2 * r);
                    let vx = VX[i] - g * x * h, vz = VZ[i] - g * z * h;
                    const ux = x / r, uz = z / r;
                    let vr = vx * ux + vz * uz, vt = -vx * uz + vz * ux;
                    vr *= 1 - 0.01 * h;
                    vt *= 1 - VISC[i] * (r < isco ? 0.02 : 0.0008) * h;
                    vx = vr * ux - vt * uz; vz = vr * uz + vt * ux;
                    if (STREAM[i]) {
                        // Turbulent scatter grows toward the hole, so pointer gas disperses as it falls.
                        const kick = 0.05 * Math.sqrt(GM / r) * Math.min(1, (2.5 * R / r) ** 2) * h;
                        vx += (Math.random() - 0.5) * kick; vz += (Math.random() - 0.5) * kick;
                    }
                    VX[i] = vx; VZ[i] = vz; X[i] = x + vx * h; Z[i] = z + vz * h;
                    AGE[i] += h;
                }
            }
        }

        function drawGas() {
            for (const c of [bctx!, fctx!]) {
                c.setTransform(1, 0, 0, 1, 0, 0);
                c.globalCompositeOperation = 'source-over';
                c.clearRect(0, 0, back.width, back.height);
                c.globalCompositeOperation = 'lighter';
            }
            let inner = 0;
            const k = BUFFER_SCALE;
            for (let i = 0; i < n; i++) {
                const x = X[i], z = Z[i], r = Math.hypot(x, z);
                if (r < 5 * R) inner++;
                const vx = VX[i], vz = VZ[i], speed = Math.hypot(vx, vz) || 1;
                const vc = Math.sqrt(GM / r);
                const approach = Math.max(-1, Math.min(1, (vz * SIN_I) / vc));
                const temp = Math.min(1, Math.pow((2.4 * R) / r, 0.8));
                const b = Math.max(0, Math.min(BUCKETS - 1, Math.round((temp * 0.82 + approach * 0.18 + 0.04) * (BUCKETS - 1))));

                // Puffs grow outward (the outer disk is thicker and more diffuse) and stretch along
                // their motion, harder near the hole. Pointer gas starts fine and swells as it falls.
                const fall = STREAM[i] ? Math.max(0, Math.min(1, (R0[i] - r) / Math.max(R, R0[i] - 2 * R))) : 1;
                const base = R * SIZE[i] * (0.55 + (0.11 * r) / R) * (STREAM[i] ? 0.45 + 0.55 * fall : 1);
                const along = base * (1.8 + 3 * Math.min(1, Math.pow((1.5 * R) / r, 3)));
                const across = base * (0.9 - 0.3 * Math.min(1, Math.pow((1.6 * R) / r, 2)));
                // Direction of motion on screen (the disk plane is foreshortened vertically).
                const mx = vx / speed, my = (vz * COS_I) / speed, ml = Math.hypot(mx, my) || 1;
                const ex = mx / ml, ey = my / ml;
                // A fresh puff fades in, gas dims as it crosses into the shadow, and brightness follows Doppler beaming.
                const alpha = Math.min(1, AGE[i] / (STREAM[i] ? 10 : 40)) * (STREAM[i] ? 1.5 - 0.5 * fall : 1)
                    * Math.min(1, (r - R) / (0.7 * R)) * (0.045 + 0.055 * temp) * (1 + 0.35 * approach);
                if (alpha <= 0.004) continue;
                const c = z < 0 ? bctx! : fctx!;
                c.globalAlpha = alpha;
                c.setTransform(ex * along * k, ey * along * k, -ey * across * k, ex * across * k,
                    (cx + x) * k, (cy + z * COS_I) * k);
                c.drawImage(sprites[b], -0.5, -0.5, 1, 1);
            }
            bctx!.globalAlpha = fctx!.globalAlpha = 1;
            return inner;
        }

        function render() {
            const inner = drawGas();
            const c = ctx!;
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, W, H);
            c.imageSmoothingEnabled = true;
            c.imageSmoothingQuality = 'high';
            c.drawImage(back, 0, 0, W, H);

            // The shadow hides gas behind it; the photon ring flares as matter crosses the horizon.
            c.fillStyle = '#000';
            c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
            c.globalCompositeOperation = 'lighter';
            const glow = Math.min(1, 0.3 + inner / 700 + flare);
            const halo = c.createRadialGradient(cx, cy, R, cx, cy, R * 1.8);
            halo.addColorStop(0, `rgba(255,170,90,${(glow * 0.35).toFixed(3)})`);
            halo.addColorStop(1, 'rgba(255,170,90,0)');
            c.fillStyle = halo;
            c.beginPath(); c.arc(cx, cy, R * 1.8, 0, Math.PI * 2); c.arc(cx, cy, R, 0, Math.PI * 2, true); c.fill();
            c.strokeStyle = `rgba(255,226,184,${glow.toFixed(3)})`;
            c.lineWidth = 1.4;
            c.beginPath(); c.arc(cx, cy, R * 1.04, 0, Math.PI * 2); c.stroke();

            c.drawImage(front, 0, 0, W, H);
            c.globalCompositeOperation = 'source-over';
            flare *= 0.97;
        }

        const report = () => onMetersRef.current?.(n, swallowed);

        function prewarm() {
            n = 0;
            for (let f = 0; f < PREWARM_FRAMES; f++) { feed(2); step(1); }
            for (let i = 0; i < n; i++) AGE[i] = 100;
            swallowed = 0;
        }

        layout();
        prewarm();

        if (reduceMotion) {
            render();
            report();
            return;
        }

        let last: { x: number; y: number } | null = null;
        const onPointerMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
            if (last) {
                const dx = sx - last.x, dy = sy - last.y;
                release(sx, sy, dx, dy, Math.min(14, Math.floor(Math.hypot(dx, dy) / 5)));
            } else {
                gestureSpin = 0.55 + Math.random() * 0.3;
            }
            last = { x: sx, y: sy };
        };
        const onPointerLeave = () => { last = null; };
        const onPointerDown = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            release(e.clientX - rect.left, e.clientY - rect.top, 0, 0, 24);
        };
        host.addEventListener('pointermove', onPointerMove);
        host.addEventListener('pointerleave', onPointerLeave);
        host.addEventListener('pointerdown', onPointerDown);

        let raf = 0, lastT = 0, lastMeters = 0, onScreen = true;
        const frame = (t: number) => {
            const dt = lastT ? Math.min(2.5, (t - lastT) / 16.67) : 1;
            lastT = t;
            feedDebt += 2 * dt;
            const whole = Math.floor(feedDebt);
            feedDebt -= whole;
            feed(whole);
            step(dt);
            render();
            if (t - lastMeters > 250) { report(); lastMeters = t; }
            raf = requestAnimationFrame(frame);
        };
        const start = () => {
            if (!raf && onScreen && !document.hidden) { lastT = 0; raf = requestAnimationFrame(frame); }
        };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };
        // Nothing runs while the hero is off screen or the tab is hidden.
        const visibility = new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            if (onScreen) start(); else stop();
        });
        visibility.observe(host);
        const onVisibilityChange = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVisibilityChange);
        let resizeTimer = 0;
        let observedOnce = false;
        const resize = new ResizeObserver(() => {
            // The first callback reports the size layout() already used.
            if (!observedOnce) { observedOnce = true; return; }
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => { layout(); prewarm(); }, 150);
        });
        resize.observe(host);
        start();

        return () => {
            stop();
            visibility.disconnect();
            resize.disconnect();
            window.clearTimeout(resizeTimer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            host.removeEventListener('pointermove', onPointerMove);
            host.removeEventListener('pointerleave', onPointerLeave);
            host.removeEventListener('pointerdown', onPointerDown);
        };
    }, [dir]);

    return (
        <>
            <canvas ref={starRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} />
            <canvas ref={diskRef} role="img" aria-label={label} className={`absolute inset-0 h-full w-full ${className}`} />
        </>
    );
}
