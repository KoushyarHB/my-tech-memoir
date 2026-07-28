import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts | My Tech Memoir",
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
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <header className="mb-10">
        <h1 className="text-3xl font-serif font-bold">Posts</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          All articles, newest first.
        </p>
      </header>

      <div className="space-y-6">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="block group rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors no-underline"
          >
            <time className="text-xs font-medium tracking-wide uppercase text-neutral-400 dark:text-neutral-500">
              {post.date}
            </time>

            <h2 className="text-xl font-serif font-semibold mt-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
              {post.title}
            </h2>

            <p className="text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
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
