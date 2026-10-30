/** Shared look of a top-level header item; the active one carries a plasma line underneath. */
export const headerItemClass = (isActive = false) =>
    `focus-ring relative inline-flex items-center gap-1.5 h-16 px-3 text-[15px] font-normal rounded-none transition-colors hover:bg-transparent ${
        isActive
            ? 'text-star after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-plasma'
            : 'text-dust hover:text-star'
    }`;
