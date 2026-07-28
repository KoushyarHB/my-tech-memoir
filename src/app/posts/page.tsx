import type { Metadata } from "next";
import Link from "next/link";

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
      "A deep dive into how React tracks state internally and why closures matter for understanding hooks behavior.",
  },
  {
    slug: "why-you-cant-call-usestate-inside-useeffect",
    title: "Why You Can't Call useState Inside useEffect",
    date: "July 25, 2026",
    excerpt:
      "React's Rules of Hooks exist for a reason. Here's what happens when you break them — and how to fix it.",
  },
];

export default function PostsPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <h1 className="text-3xl font-serif font-bold mb-8">Posts</h1>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="group">
            <Link
              href={`/posts/${post.slug}`}
              className="block no-underline"
            >
              <time className="text-sm text-neutral-500 dark:text-neutral-400">
                {post.date}
              </time>
              <h2 className="text-xl font-serif font-semibold mt-1 group-hover:underline">
                {post.title}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                {post.excerpt}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
