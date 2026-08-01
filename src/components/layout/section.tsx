import { cn } from "@/lib/utils";

export function Section({
  className,
  "aria-label": ariaLabel,
  children,
}: {
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={ariaLabel} className={cn(className)}>
      {children}
    </section>
  );
}
