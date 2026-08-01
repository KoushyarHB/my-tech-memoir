import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-8", className)}>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-ink-primary">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-base text-ink-secondary">{description}</p>
      )}
    </header>
  );
}
