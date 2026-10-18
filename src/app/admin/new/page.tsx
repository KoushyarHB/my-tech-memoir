import { PostEditorPage } from "@/features/admin/components";
import { findAllTags } from "@/features/tags/server/tag-repository";

export default async function NewPostPage() {
  const tags = await findAllTags();

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
