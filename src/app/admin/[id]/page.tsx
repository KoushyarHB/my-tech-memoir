import { notFound } from "next/navigation";
import { PostEditorPage } from "@/features/admin/components";
import { getPostById } from "@/features/blog/server/post-service";
import { findAllTags } from "@/features/tags/server/tag-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const [post, tags] = await Promise.all([getPostById(id), findAllTags()]);

  if (!post) {
    notFound();
  }

  return (
    <PostEditorPage
      postId={post.id}
      availableTags={tags}
      initialTitle={post.title}
      initialSlug={post.slug}
      initialExcerpt={post.excerpt ?? ""}
      initialContent={post.content}
      initialContentJson={post.contentJson}
      initialPublished={post.published}
      initialTagIds={post.tags.map((tag) => tag.id)}
    />
  );
}
