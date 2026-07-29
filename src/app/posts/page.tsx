import type { Metadata } from "next";

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
    <div className="max-w-2xl mx-auto px-5 py-12 sm:py-16">
      <h1
        className="text-3xl font-serif font-bold mb-10"
        style={{ color: "var(--text-primary)" }}
      >
        Posts
      </h1>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group block py-8 first:pt-0 last:pb-0 transition-opacity duration-200"
            style={{ textDecoration: "none" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <time
                className="text-xs font-medium tracking-wider uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                {post.date}
              </time>
            </div>

            <h2
              className="text-xl sm:text-2xl font-serif font-semibold leading-snug transition-colors duration-200"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="border-b border-transparent group-hover:border-current pb-0.5 transition-all duration-200">
                {post.title}
              </span>
            </h2>

            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {post.excerpt}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-md"
                  style={{
                    color: "var(--text-tertiary)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
