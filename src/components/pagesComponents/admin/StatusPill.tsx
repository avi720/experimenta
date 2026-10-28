import type { ReactNode } from 'react';
import { pillToneClass, type PillTone } from './adminStyles';

type StatusPillProps = {
  tone: PillTone;
  children: ReactNode;
  /** Draws a small dot before the label, for on/off states. */
  dot?: boolean;
  className?: string;
};

export default function StatusPill({ tone, children, dot = false, className = '' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${pillToneClass[tone]} ${className}`}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
