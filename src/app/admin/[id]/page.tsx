import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostEditorPage } from "@/features/admin/components";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      published: true,
      tags: {
        select: {
          tag: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <PostEditorPage
      postId={post.id}
      availableTags={tags}
      initialTitle={post.title}
      initialSlug={post.slug}
      initialExcerpt={post.excerpt ?? ""}
      initialContent={post.content}
      initialPublished={post.published}
      initialTagIds={post.tags.map((pt) => pt.tag.id)}
    />
  );
}
