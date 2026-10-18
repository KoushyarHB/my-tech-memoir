import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppearanceSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** Card shell shared by every Appearance section. */
export function AppearanceSection({
  title,
  description,
  children,
  className,
}: AppearanceSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-(--bg-elevated)",
        className
      )}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-ink-primary">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-tertiary">
            {description}
          </p>
        ) : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
