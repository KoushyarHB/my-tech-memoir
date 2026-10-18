import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPostsPage } from "@/features/blog/server/post-service";
import { PostCard } from "@/features/blog/components";
import { PaginationLinks } from "@/components/pagination/pagination-links";
import { Link } from "@/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "posts" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const page = Math.max(1, Number(pageParam) || 1);

  const { items: posts, totalItems, totalPages, page: currentPage } =
    await getPostsPage({ page, pageSize: DEFAULT_PAGE_SIZE });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-5 sm:py-16">
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.length === 0 ? (
          <p className="py-12 text-center text-ink-tertiary">
            No posts yet. Check back soon.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {totalItems > 0 ? (
        <p className="mt-6 text-center text-xs tabular-nums text-ink-tertiary">
          {totalItems} {totalItems === 1 ? "post" : "posts"}
        </p>
      ) : null}

      <PaginationLinks
        page={currentPage}
        totalPages={totalPages}
        hrefForPage={(target) => (target === 1 ? "/blog" : `/blog?page=${target}`)}
      />
    </div>
  );
}
