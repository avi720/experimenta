// Shared looks for the workspace chrome (docs/BRAND.md): translucent dark surfaces over the
// scene, 1px `line` hairlines, plasma only for the one main action, blueshift on hover/focus.

/** A floating surface over the scene (side panel, floating windows, charts drawer). */
export const instrumentSurfaceClass = 'bg-space/85 backdrop-blur-md border-line text-star';

/** Quiet icon/text button: dust text and a hairline, turning blueshift on hover. */
export const quietButtonClass =
    'focus-ring border border-line bg-space/40 text-dust shadow-none hover:bg-space-raised hover:text-star hover:border-blueshift/60';

/** Borderless quiet icon button for dense toolbars (window controls, step buttons). */
export const ghostIconButtonClass =
    'focus-ring text-dust hover:bg-space-raised hover:text-star';

/** The one primary action of a view. */
export const plasmaButtonClass =
    'focus-ring bg-plasma text-primary-foreground font-medium shadow-none hover:bg-plasma-hi';

/** A section title inside an instrument panel. */
export const panelHeadingClass = 'text-[13px] font-medium text-dust';

/** A toggle chip (pressed = horizon), e.g. chart series and unknown pickers. */
export const toggleChipClass =
    'focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] text-dust transition-colors hover:border-blueshift/60 hover:text-star aria-pressed:border-horizon aria-pressed:bg-horizon/10 aria-pressed:text-star disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:text-dust';
