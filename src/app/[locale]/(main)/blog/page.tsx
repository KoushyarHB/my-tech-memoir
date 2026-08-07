import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getPublishedPosts } from "@/features/blog/server/post-service";
import { PostCard } from "@/features/blog/components";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
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

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await getPublishedPosts();

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
    </div>
  );
}
