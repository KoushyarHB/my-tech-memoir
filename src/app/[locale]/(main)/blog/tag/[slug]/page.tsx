import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPostsPage } from "@/features/blog/server/post-service";
import { findTagBySlug } from "@/features/tags/server/tag-repository";
import { PostCard } from "@/features/blog/components";
import { PaginationLinks } from "@/components/pagination/pagination-links";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await findTagBySlug(slug);

  if (!tag) {
    return { title: "Tag Not Found" };
  }

  return {
    title: `Tagged: ${tag.name}`,
    description: `Posts tagged with "${tag.name}".`,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const tag = await findTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const page = Math.max(1, Number(pageParam) || 1);

  const {
    items: posts,
    totalItems,
    totalPages,
    page: currentPage,
  } = await getPostsPage(
    { page, pageSize: DEFAULT_PAGE_SIZE },
    { tagSlug: slug }
  );

  const hrefForPage = (target: number) =>
    target === 1
      ? `/blog/tag/${slug}`
      : `/blog/tag/${slug}?page=${target}`;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="mb-2 font-serif text-3xl font-bold text-ink-primary">
        Tagged: {tag.name}
      </h1>
      <p className="mb-8 text-base text-ink-secondary">
        {totalItems} post{totalItems !== 1 ? "s" : ""}
      </p>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <PaginationLinks
        page={currentPage}
        totalPages={totalPages}
        hrefForPage={hrefForPage}
      />
    </div>
  );
}
