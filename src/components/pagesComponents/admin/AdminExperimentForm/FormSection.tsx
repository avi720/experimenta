import type { ReactNode } from 'react';

type FormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Optional element shown at the end of the heading row (e.g. a count or an action). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * One group of form fields: a light heading over a hairline, no boxed card (docs/BRAND.md, Layout).
 * On wide screens the heading sits in a narrow start column beside its fields.
 */
export default function FormSection({ title, description, aside, children, className = '' }: FormSectionProps) {
  return (
    <section className={`grid gap-6 border-t border-line pt-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[20px] font-light leading-snug text-star">{title}</h2>
          {aside}
        </div>
        {description && <p className="mt-2 text-sm leading-relaxed text-dust">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
