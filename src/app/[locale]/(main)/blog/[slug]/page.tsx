import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  getPostBySlug,
  getPublishedSlugs,
} from "@/features/blog/server/post-service";
import { Lighthouse, PostHeader } from "@/features/blog/components";
import { CommentSection } from "@/features/comments/components";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return getPublishedSlugs();
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
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
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
    <article className="mx-auto w-full max-w-(--reading-max-width) px-4 py-8 sm:px-5 sm:py-14">
      <PostHeader post={post} />
      <Lighthouse html={post.content} document={post.contentJson} />
      <CommentSection postId={post.id} />
    </article>
  );
}
