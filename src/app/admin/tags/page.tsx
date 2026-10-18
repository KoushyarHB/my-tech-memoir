import { requireAdmin } from "@/lib/auth-guard";
import { listTags } from "@/features/admin/server/tag-service";
import { AdminTagsManager } from "@/features/admin/components/admin-tags-manager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin();
  const tags = await listTags();

  const tableTags = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag.postCount,
    createdAt: tag.createdAt.toISOString(),
  }));

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
          Taxonomy
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink-primary">
          Tags
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-secondary">
          Manage the labels available when writing posts. Only admins can add
          tags here.
        </p>
      </div>

      <AdminTagsManager tags={tableTags} />
    </div>
  );
}
