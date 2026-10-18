import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getBookmarksPage } from "@/features/bookmarks/server/bookmark-service";
import { PostCard } from "@/features/blog/components";
import { PaginationLinks } from "@/components/pagination/pagination-links";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bookmarks" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function BookmarksPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/signin", locale });
    return;
  }

  const page = Math.max(1, Number(pageParam) || 1);

  const {
    items: bookmarks,
    totalItems,
    totalPages,
    page: currentPage,
  } = await getBookmarksPage(session.user.id, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="mb-8 font-serif text-3xl font-bold text-ink-primary">
        Bookmarks
      </h1>

      {bookmarks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-2 text-lg text-ink-secondary">No bookmarks yet</p>
          <p className="text-sm text-ink-tertiary">
            Bookmark posts to save them for later.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {bookmarks.map((bookmark) => (
              <PostCard key={bookmark.id} post={bookmark.post} />
            ))}
          </div>

          <p className="mt-6 text-center text-xs tabular-nums text-ink-tertiary">
            {totalItems} {totalItems === 1 ? "bookmark" : "bookmarks"}
          </p>

          <PaginationLinks
            page={currentPage}
            totalPages={totalPages}
            hrefForPage={(target) =>
              target === 1 ? "/bookmarks" : `/bookmarks?page=${target}`
            }
          />
        </>
      )}
    </div>
  );
}
