import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { PostDate } from "./post-date";
import type { PostSummary } from "../types";

type PostCardProps = {
  post: PostSummary;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block py-8 first:pt-0 last:pb-0 no-underline transition-opacity duration-200"
      style={{ textDecoration: "none" }}
    >
      <div className="mb-3 flex items-center gap-3">
        <PostDate>
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(post.createdAt))}
        </PostDate>
        <span className="text-xs text-ink-tertiary">·</span>
        <span className="text-xs text-ink-tertiary">{post.readingTime}</span>
      </div>

      <h2 className="font-serif text-lg font-semibold leading-snug tracking-tight text-ink-primary transition-colors duration-200 sm:text-2xl">
        <span className="border-b border-transparent pb-0.5 transition-all duration-200 group-hover:border-current">
          {post.title}
        </span>
      </h2>

      {post.excerpt && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          {post.excerpt}
        </p>
      )}

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
