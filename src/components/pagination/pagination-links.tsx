import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationLinksProps = {
  page: number;
  totalPages: number;
  /** Builds the href for a page; keeps existing filters intact. */
  hrefForPage: (page: number) => string;
  className?: string;
};

/**
 * Server-rendered pagination for public pages.
 *
 * Keeps page state in the URL (the Next.js App Router recommendation for
 * search/filter/pagination state) so results stay shareable and bookmarkable.
 * The admin tables use `DataTablePagination` instead, which drives TanStack
 * Query cache keys.
 */
export function PaginationLinks({
  page,
  totalPages,
  hrefForPage,
  className,
}: PaginationLinksProps) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-10 flex items-center justify-between gap-4", className)}
    >
      {hasPrevious ? (
        <Link
          href={hrefForPage(page - 1)}
          className="inline-flex items-center gap-1 text-sm text-ink-secondary transition-colors hover:text-ink-primary"
        >
          <ChevronLeft className="size-4" />
          Newer
        </Link>
      ) : (
        <span aria-hidden className="inline-flex items-center gap-1 text-sm text-ink-tertiary/50">
          <ChevronLeft className="size-4" />
          Newer
        </span>
      )}

      <span className="text-xs tabular-nums text-ink-tertiary">
        Page {page} of {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={hrefForPage(page + 1)}
          className="inline-flex items-center gap-1 text-sm text-ink-secondary transition-colors hover:text-ink-primary"
        >
          Older
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className="inline-flex items-center gap-1 text-sm text-ink-tertiary/50">
          Older
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
