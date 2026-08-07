import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/features/bookmarks/components";
import type { PostWithTags } from "../types";
import { PostViewCount } from "./post-view-count";

type PostHeaderProps = {
  post: PostWithTags;
};

export function PostHeader({ post }: PostHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.createdAt));

  return (
    <header
      className="mb-8 pb-6"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {post.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
              <Badge variant="secondary">{tag.name}</Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-3">
        <h1 className="min-w-0 flex-1 font-serif text-[1.65rem] font-bold leading-tight tracking-tight text-ink-primary sm:text-4xl">
          {post.title}
        </h1>
        <BookmarkButton postId={post.id} />
      </div>

      {post.excerpt && (
        <p className="mb-4 text-base leading-relaxed text-ink-secondary sm:text-lg">
          {post.excerpt}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-tertiary">
        <time dateTime={post.createdAt.toISOString()}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime}</span>
        <span aria-hidden="true">·</span>
        <PostViewCount postId={post.id} initialCount={post.viewCount} />
      </div>
    </header>
  );
}
