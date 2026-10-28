import { useId } from 'react';

/**
 * The brand mark: a shadow inside its photon ring, with the accretion disk passing behind and
 * in front of it. The disk is bluer on the approaching side (Doppler), as in the hero.
 */
export default function BlackHoleMark({ className = 'h-8 w-8' }: { className?: string }) {
    const gradientId = useId();
    return (
        <svg viewBox="0 0 34 34" className={className} aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id={gradientId} x1="0" x2="1">
                    <stop offset="0" stopColor="#C9DAFF" />
                    <stop offset=".45" stopColor="rgb(var(--plasma))" />
                    <stop offset="1" stopColor="#B9431C" />
                </linearGradient>
            </defs>
            <g transform="rotate(-14 17 17)">
                <path d="M3 17 A14 4.2 0 0 1 31 17" stroke={`url(#${gradientId})`} strokeWidth="1.6" fill="none" opacity=".6" />
                <circle cx="17" cy="17" r="7.2" fill="rgb(var(--hole))" stroke="rgb(var(--plasma-hi))" strokeWidth="1.3" />
                <path d="M3 17 A14 4.2 0 0 0 31 17" stroke={`url(#${gradientId})`} strokeWidth="2.4" fill="none" />
            </g>
        </svg>
    );
}
