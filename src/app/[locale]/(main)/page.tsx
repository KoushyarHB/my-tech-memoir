import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getPublishedPosts } from "@/features/blog/server/post-service";
import { PostCard } from "@/features/blog/components";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const allPosts = await getPublishedPosts();
  const recentPosts = allPosts.slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-5 sm:py-16">
      <section aria-label="Recent posts">
        {recentPosts.length === 0 ? (
          <p className="py-12 text-center text-ink-tertiary">
            No posts published yet. Check back soon.
          </p>
        ) : (
          <>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {allPosts.length > 5 && (
              <div className="mt-8 text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 transition-opacity hover:opacity-80"
                >
                  View All Posts →
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
