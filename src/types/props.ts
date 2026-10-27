import type { ReactNode } from 'react';

/** Props shared by many components. */

export type ChildrenProps = { children?: ReactNode };

/** Components that still take the legacy locale flag (true = Hebrew / RTL). */
export type IsRTLProps = { isRTL?: boolean };

/** `className` passthrough for components that forward it to their root element. */
export type ClassNameProps = { className?: string };

/** Props passed to an error-boundary fallback renderer. */
export type ErrorFallbackProps = { error?: unknown; reset: () => void };
