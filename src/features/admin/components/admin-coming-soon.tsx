import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type AdminComingSoonProps = {
  title: string;
  description?: string;
};

export function AdminComingSoon({
  title,
  description = "This section is planned for a later release.",
}: AdminComingSoonProps) {
  return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
        Coming soon
      </p>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-primary">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{description}</p>
      <Link
        href="/admin"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-8")}
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
