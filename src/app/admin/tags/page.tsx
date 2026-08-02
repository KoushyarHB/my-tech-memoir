import { requireAdmin } from "@/lib/auth-guard";
import { listTags } from "@/features/admin/server/tag-service";
import { AdminTagsManager } from "@/features/admin/components/admin-tags-manager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin();
  const tags = await listTags();

  const usedCount = tags.filter((tag) => tag.postCount > 0).length;
  const totalAssignments = tags.reduce((sum, tag) => sum + tag.postCount, 0);

  const metrics = [
    { label: "Tags", value: tags.length },
    { label: "In use", value: usedCount },
    { label: "Unused", value: tags.length - usedCount },
    { label: "Assignments", value: totalAssignments },
  ];

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

      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-(--bg-elevated) px-4 py-4 sm:px-5"
          >
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-tertiary">
              {metric.label}
            </dt>
            <dd className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink-primary">
              {metric.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      <AdminTagsManager tags={tableTags} />
    </div>
  );
}
