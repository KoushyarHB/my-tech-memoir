import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPostBySlug, getPublishedPosts } from "@/features/blog/server/post-service";
import { PostHeader, ViewTracker } from "@/features/blog/components";
import { CommentSection } from "@/features/comments/components";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title,
    description: post.excerpt ?? `Read ${post.title}.`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <ViewTracker postId={post.id} />
      <PostHeader post={post} />
      <div
        className="prose-memoir"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <CommentSection postId={post.id} />
    </article>
  );
}
