import { requireAdmin } from "@/lib/auth-guard";
import {
  findTagsPage,
  getTagStats,
} from "@/features/tags/server/tag-repository";
import { TAG_PAGE_SIZE } from "@/features/tags/constants/tag";
import { AdminTagsManager } from "@/features/admin/components/admin-tags-manager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin();

  const [tags, stats] = await Promise.all([
    findTagsPage({ page: 1, pageSize: TAG_PAGE_SIZE }),
    getTagStats(),
  ]);

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

      <AdminTagsManager tags={tags.items} stats={stats} />
    </div>
  );
}
