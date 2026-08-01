import type { Metadata } from "next";
import Link from "next/link";
import { PostDate } from "@/components/post-date";
import { PostTag } from "@/components/post-tag";

export const metadata: Metadata = {
  title: "Posts",
  description: "All posts, sorted by most recent.",
};

const posts = [
  {
    slug: "understanding-reacts-state-tree-and-closures",
    title: "Understanding React's State Tree and Closures",
    date: "July 28, 2026",
    excerpt:
      "A deep dive into how React tracks state internally — the flat array behind useState, slot-based indexing, and why closures create snapshots that can go stale.",
    tags: ["React", "Hooks", "Fundamentals"],
  },
  {
    slug: "why-you-cant-call-usestate-inside-useeffect",
    title: "Why You Can't Call useState Inside useEffect",
    date: "July 25, 2026",
    excerpt:
      "React's Rules of Hooks exist for a reason. Here's what happens when you break them — and the one fix that makes it all click.",
    tags: ["React", "Hooks", "Gotchas"],
  },
  {
    slug: "networking-101",
    title: "Networking 101",
    date: "July 20, 2026",
    excerpt:
      "A complete breakdown of how the internet works — from IPv4 addresses and binary logic to public vs private classes.",
    tags: ["Networking", "Fundamentals"],
  },
];

export default function PostsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="mb-10 font-serif text-3xl font-bold text-ink-primary">
        Posts
      </h1>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group block py-8 first:pt-0 last:pb-0 no-underline transition-opacity duration-200"
          >
            <div className="mb-3 flex items-center gap-3">
              <PostDate>{post.date}</PostDate>
            </div>

            <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ink-primary transition-colors duration-200 sm:text-2xl">
              <span className="border-b border-transparent pb-0.5 transition-all duration-200 group-hover:border-current">
                {post.title}
              </span>
            </h2>

            <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
              {post.excerpt}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <PostTag key={tag}>{tag}</PostTag>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
