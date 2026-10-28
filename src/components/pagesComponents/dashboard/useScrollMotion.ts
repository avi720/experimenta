import { useEffect, type RefObject } from 'react';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Scroll-linked motion for the home page. Each piece's progress (0..1) follows its position in
 * the viewport, so it also runs backwards when scrolling up. The values land in CSS variables
 * read by the `motion-*` classes and `[data-reveal]` in index.css:
 * --hp on [data-scroll="hero"], --p on each [data-reveal], --sp on [data-scroll="steps"] (with --lit
 * on each [data-step]), --cp on [data-scroll="cta"]. Skipped entirely under reduced motion, where
 * the CSS falls back to the finished state.
 */
export function useScrollMotion(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
    useEffect(() => {
        const root = rootRef.current;
        if (!enabled || !root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const hero = root.querySelector<HTMLElement>('[data-scroll="hero"]');
        const steps = root.querySelector<HTMLElement>('[data-scroll="steps"]');
        const stepItems = steps ? [...steps.querySelectorAll<HTMLElement>('[data-step]')] : [];
        const cta = root.querySelector<HTMLElement>('[data-scroll="cta"]');
        const reveals = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];

        let frame = 0;
        const update = () => {
            frame = 0;
            const vh = window.innerHeight;
            if (hero) {
                const rect = hero.getBoundingClientRect();
                hero.style.setProperty('--hp', clamp01(-rect.top / rect.height).toFixed(3));
            }
            for (const el of reveals) {
                el.style.setProperty('--p', clamp01((vh - el.getBoundingClientRect().top) / (vh * 0.3)).toFixed(3));
            }
            if (steps) {
                // The infall path draws across the steps; each node lights as the path reaches it.
                const sp = clamp01((vh * 0.8 - steps.getBoundingClientRect().top) / (vh * 0.45));
                steps.style.setProperty('--sp', sp.toFixed(3));
                stepItems.forEach((item, index) => {
                    item.style.setProperty('--lit', clamp01((sp - index / stepItems.length) * stepItems.length).toFixed(3));
                });
            }
            if (cta) {
                // Complete exactly when the section's bottom reaches the viewport's, i.e. as the footer arrives.
                const rect = cta.getBoundingClientRect();
                cta.style.setProperty('--cp', clamp01((vh - rect.top) / rect.height).toFixed(3));
            }
        };
        const queue = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', queue);
        update();
        return () => {
            window.removeEventListener('scroll', queue);
            window.removeEventListener('resize', queue);
            cancelAnimationFrame(frame);
        };
    }, [rootRef, enabled]);
}
