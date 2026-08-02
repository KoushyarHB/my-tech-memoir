import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <h1 className="font-serif text-7xl font-bold tracking-tight text-ink-tertiary">
        404
      </h1>
      <p className="mt-4 text-lg text-ink-secondary">
        This page could not be found.
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "link" }),
          "mt-8 gap-1.5 text-sm font-medium"
        )}
      >
        ← Return home
      </Link>
    </div>
  );
}
