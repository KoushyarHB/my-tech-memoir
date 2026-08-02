import { db } from "@/lib/db";
import { PostEditorPage } from "@/features/admin/components";

export default async function NewPostPage() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <PostEditorPage
      availableTags={tags}
      initialTitle=""
      initialSlug=""
      initialExcerpt=""
      initialContent=""
      initialPublished={false}
      initialTagIds={[]}
    />
  );
}
