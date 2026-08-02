import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/features/bookmarks/components";
import type { PostWithTags } from "../types";

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
        <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-ink-primary sm:text-4xl">
          {post.title}
        </h1>
        <BookmarkButton postId={post.id} />
      </div>

      {post.excerpt && (
        <p className="mb-4 text-lg leading-relaxed text-ink-secondary">
          {post.excerpt}
        </p>
      )}

      <div className="flex items-center gap-3 text-sm text-ink-tertiary">
        <time dateTime={post.createdAt.toISOString()}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime}</span>
        <span aria-hidden="true">·</span>
        <span>
          {post.viewCount.toLocaleString()}{" "}
          {post.viewCount === 1 ? "view" : "views"}
        </span>
      </div>
    </header>
  );
}
