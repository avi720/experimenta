// Shared class strings for the admin console (docs/BRAND.md): plasma for the one primary action,
// hairline-bordered secondaries, dark-legible status colours.

export const primaryButtonClass =
  'focus-ring h-10 gap-2 rounded-md bg-plasma px-4 font-medium text-[#1C0F04] shadow-none hover:bg-plasma-hi disabled:opacity-40';

export const secondaryButtonClass =
  'focus-ring h-10 gap-2 rounded-md border border-line bg-transparent px-4 font-normal text-star shadow-none hover:border-blueshift hover:bg-transparent hover:text-star';

export const iconButtonClass =
  'focus-ring h-9 w-9 rounded-md text-dust hover:bg-space-raised hover:text-star';

export const dangerIconButtonClass =
  'focus-ring h-9 w-9 rounded-md text-red-300 hover:bg-red-500/10 hover:text-red-200';

export const panelClass = 'rounded-md border border-line bg-space-raised/50';

export const fieldLabelClass = 'mb-2 block text-sm font-medium text-star';
export const fieldHintClass = 'mt-1.5 text-xs leading-relaxed text-dust';
export const fieldErrorClass = 'mt-1.5 text-xs text-red-300';
export const inputErrorClass = 'border-red-400/70 focus-visible:ring-red-400/60';

export type PillTone = 'success' | 'warning' | 'neutral' | 'info' | 'premium';

export const pillToneClass: Record<PillTone, string> = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  neutral: 'border-line bg-space-raised text-dust',
  info: 'border-blueshift/30 bg-blueshift/10 text-blueshift',
  premium: 'border-plasma/30 bg-plasma/10 text-plasma',
};
