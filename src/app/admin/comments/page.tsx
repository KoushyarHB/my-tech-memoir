import { getModerationPage, getModerationStats } from "@/features/comments/server/comment-service";
import { AdminCommentsView } from "@/features/comments/components/admin-comments-view";
import { MODERATION_PAGE_SIZE } from "@/features/comments/constants/comment";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const [comments, stats] = await Promise.all([
    getModerationPage({ page: 1, pageSize: MODERATION_PAGE_SIZE }),
    getModerationStats(),
  ]);

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
          Community
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink-primary">
          Comments
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-secondary">
          Review, approve and reply to reader comments. New comments are scored
          automatically — only the suspicious ones wait for you.
        </p>
      </div>

      <AdminCommentsView comments={comments.items} stats={stats} />
    </div>
  );
}
