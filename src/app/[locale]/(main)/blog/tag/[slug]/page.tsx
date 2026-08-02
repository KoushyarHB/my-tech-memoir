import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getPostsByTag } from "@/features/blog/server/post-service";
import { PostCard } from "@/features/blog/components";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.tag.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!tag) {
    return { title: "Tag Not Found" };
  }

  return {
    title: `Tagged: ${tag.name}`,
    description: `Posts tagged with "${tag.name}".`,
  };
}

export default async function TagPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tag = await db.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!tag) {
    notFound();
  }

  const posts = await getPostsByTag(slug);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="mb-2 font-serif text-3xl font-bold text-ink-primary">
        Tagged: {tag.name}
      </h1>
      <p className="mb-8 text-base text-ink-secondary">
        {posts.length} post{posts.length !== 1 ? "s" : ""}
      </p>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
