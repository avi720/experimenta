# Experimenta brand guidelines

The product line every page moves toward. The home page, header and footer are the first
surfaces built on it; Lab, Workspace, Results and the admin pages still use the older
slate/blue look and should be migrated page by page using the tokens below.
The approved prototype lives in `prototypes/home-blackhole.html`.

## Concept: an accretion disk seen from outside

Experimenta wants to hold every physics experiment there is, from free fall to thought
experiments nobody can run in a real lab. The identity is a black hole: the one object in
physics you can only study through experiments, real or imagined. Its colors are the
colors of the gas falling into it: hot plasma glowing amber and white, a blueshift on the
side moving toward you, and violet for what lies past the horizon.

The page should feel like an instrument pointed at the sky, not a marketing site: calm
surfaces, exact type, and one live, computed thing that proves the physics is real.

## Color

Tokens are CSS custom properties in `src/index.css` (`:root`) and Tailwind colors in
`tailwind.config.js`. Use the Tailwind names in components; never hard-code hex values.

| Token | Tailwind | Hex | Role |
| --- | --- | --- | --- |
| `--hole` | `hole` | `#000000` | The only true black: the hole's shadow, the CTA horizon, the footer inside it |
| `--space` | `space` | `#0B0912` | Page background, a shade lighter than the hole so the shadow reads |
| `--space-raised` | `space-raised` | `#13101D` | Raised surfaces, menus, hover wells |
| `--line` | `line` | `#2A2439` | Hairlines, borders |
| `--star` | `star` | `#F1ECF7` | Primary text |
| `--dust` | `dust` | `#A39BB5` | Secondary text |
| `--plasma` | `plasma` | `#FFB25E` | Hot disk gas. Primary action, active nav line, live readouts |
| `--plasma-hi` | `plasma-hi` | `#FFE2B8` | Photon ring; primary button hover |
| `--blueshift` | `blueshift` | `#9DBBFF` | The approaching side. Links, data traces, focus ring |
| `--horizon` | `horizon` | `#B48CFF` | Beyond the horizon. Reserved for thought experiments |

Rules:
- Color carries meaning. **Plasma** means "act here" (one primary per view). **Blueshift**
  is for links, data and focus. **Horizon** marks thought experiments only, so it stays rare.
- Body text is `star` or `dust` on `space`. Never put `dust` text on `line`.
- No gradient washes as decoration. A gradient is allowed only when it is a physical
  quantity (a field, a temperature, a glow) or a scrim that keeps text legible over one.

## The mark

The logo mark is a black shadow inside its photon ring, with the accretion disk passing
behind and in front of it; the disk runs from blueshifted white to deep red, the Doppler
asymmetry of a real disk (`src/components/brand/BlackHoleMark.tsx`). It sits before the
wordmark "Experimenta" in Plex Sans Hebrew, weight 500. Don't recolor or animate it.

## Typography

One family, three voices:

| Use | Face | Weight | Notes |
| --- | --- | --- | --- |
| Display (h1, h2) | IBM Plex Sans Hebrew | 300 | Large and light, tight leading (1.04–1.12) |
| Text and UI | IBM Plex Sans Hebrew | 400 / 500 | Covers Hebrew and Latin with one set of metrics |
| Measured values | IBM Plex Mono | 400 | Only for real numbers: counts, λ, t, units. Never for labels |

Scale (perfect fourth, 17 px base): 13 · 17 · 22.7 · 30.2 · 40.3 · 53.7 · 71.6. Hero
display may grow to ~85 px with `clamp()`. Body copy keeps lines under ~70 characters,
line-height 1.7 for Hebrew paragraphs.

Avoid: ALL-CAPS labels, eyebrow text above headings, accenting one word of a headline,
arrows appended to button text.

## Layout

- Content is start-aligned (right in Hebrew, left in English). The hero copy hugs the
  reading-start edge of the screen and leaves the rest to the hole. Only the final call
  to action centers.
- Sections use `max-w-6xl` with `px-4 sm:px-6` and breathe with `py-20 md:py-28`.
- No card kit. Group things with space and a single hairline (`border-line`), not with
  boxed, shadowed, rounded cards. Radius: 6 px for controls, full for pills, 0 for surfaces.
- Numbered markers only for real sequences (the "how it works" steps, drawn as bodies on
  one infall path that ends in a small horizon).
- Every layout must work in RTL; use logical utilities (`ms-`, `pe-`, `start-`).

## Motion

- One live element per page. On the home page it is the black hole in the hero
  (`BlackHoleField`): Newtonian gravity, disk viscosity, the innermost stable orbit,
  Doppler beaming and gravitational lensing of the stars, computed every frame. The
  pointer releases fine wisps of gas that heat, swell and scatter as they fall in.
- Scroll is the other driver, and it is always tied to position, never a one-shot
  trigger: the hero copy lifts away, headings and items rise in, the steps path draws
  itself, and the CTA's event horizon rises as its copy fades in
  (`useScrollMotion` + the `motion-*` classes in `src/index.css`).
- `prefers-reduced-motion`: the hero renders one still frame and all scroll motion is
  off; everything shows in its finished state.

## Components

- **Primary button**: `bg-plasma` with near-black text, weight 500, 6 px radius,
  `plasma-hi` on hover. One per view.
- **Secondary button**: text in `star` with a 1 px `line` border, turning `blueshift` on hover.
- **Links in text**: `text-blueshift` with underline offset 4.
- **Focus**: 2 px `blueshift` outline with 2 px offset everywhere (`.focus-ring`).
- **Thought experiments**: a `horizon` line marker and a `horizon` pill.
- **shadcn primitives**: the shadcn HSL tokens in `:root` (`src/index.css`) are mapped onto
  the brand, so every page, dialog and menu renders on `space` with no extra class. Prefer
  the brand utilities (`bg-space-raised`, `border-line`, `text-dust`) over raw `slate`/`white`.

## Voice

Plain, specific and curious. Name what the user does ("Open the lab", "Save the run"),
not what the system is. Prefer a concrete physics example over an adjective: "double
the height and see the fall time grow by √2" beats "powerful simulations".
Hebrew first; every string exists in both `src/i18n/he.ts` and `src/i18n/en.ts`.
