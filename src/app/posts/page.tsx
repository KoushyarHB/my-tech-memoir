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
        <h1 className="text-3xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
          All Posts
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          {posts.length} articles and counting.
        </p>
      </header>

      <div className="space-y-5">
        {posts.map((post, i) => (
          <a
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group block rounded-2xl border transition-all duration-300 no-underline
              bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50
              dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:shadow-neutral-900/50 dark:hover:shadow-xl"
          >
            <div className="p-6 sm:p-7">
              {/* Date + Reading time */}
              <div className="flex items-center gap-3 text-xs font-medium tracking-wide">
                <time className="text-neutral-400 dark:text-neutral-500 uppercase">
                  {post.date}
                </time>
                <span className="text-neutral-300 dark:text-neutral-600">
                  ·
                </span>
                <span className="text-neutral-400 dark:text-neutral-500">
                  {i === 0 ? "8 min read" : i === 1 ? "5 min read" : "12 min read"}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-serif font-bold mt-4 leading-snug text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-white transition-colors">
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed text-[15px]">
                {post.excerpt}
              </p>

              {/* Tags + Arrow */}
              <div className="flex items-center justify-between mt-5">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full
                        bg-neutral-100 text-neutral-600
                        dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <span className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-all group-hover:translate-x-1 duration-300 text-lg">
                  →
                </span>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out bg-gradient-to-r from-neutral-900 to-neutral-400 dark:from-white dark:to-neutral-600" />
          </a>
        ))}
      </div>
    </div>
  );
}
