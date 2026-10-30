// Shared looks for the Results page (docs/BRAND.md): hairline panels on space, no card kit.
import type { CSSProperties } from "react";

/** A flat surface grouped by a single hairline; radius 0 per the brand. */
export const panelClass = "border border-line bg-space-raised/40";

/** Panel section heading: small, medium weight, star. */
export const panelTitleClass = "text-[15px] font-medium text-star";

/** Small field label above a value or control. */
export const fieldLabelClass = "text-[13px] text-dust";

/** Measured values: mono with aligned digits. */
export const valueClass = "font-mono tabular-nums text-star";

export const secondaryButtonClass =
  "focus-ring inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-line bg-space/50 text-star text-sm transition-colors hover:border-blueshift hover:text-blueshift disabled:pointer-events-none disabled:opacity-50";

export const primaryButtonClass =
  "focus-ring inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-plasma text-[#1C0F04] text-sm font-medium transition-colors hover:bg-plasma-hi disabled:pointer-events-none disabled:opacity-50";

/** Inline status banners that stay legible on dark. */
export const errorBannerClass = "border border-red-400/30 bg-red-500/10 text-red-300";

// Recharts takes raw colour strings; read them from the brand's CSS variables.
export const chartColors = {
  grid: "rgb(var(--line))",
  tick: "rgb(var(--dust))",
  experimental: "rgb(var(--blueshift))",
  theoretical: "rgb(var(--plasma))",
} as const;

export const chartTick = { fill: chartColors.tick, fontSize: 12, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' };

export const chartAxisLabelStyle = { fill: chartColors.tick, fontSize: 12 };

export const chartTooltipProps = {
  contentStyle: {
    background: "rgb(var(--space-raised))",
    border: "1px solid rgb(var(--line))",
    borderRadius: 6,
    color: "rgb(var(--star))",
    fontSize: 12,
  } satisfies CSSProperties,
  labelStyle: { color: "rgb(var(--dust))" } satisfies CSSProperties,
  itemStyle: { color: "rgb(var(--star))", fontFamily: '"IBM Plex Mono", ui-monospace, monospace' } satisfies CSSProperties,
  cursor: { stroke: "rgb(var(--line))" },
};

/** shadcn Select trigger on the brand surfaces. */
export const selectTriggerClass = "h-10 rounded-md border-line bg-space-raised/40 text-star focus:ring-blueshift";
