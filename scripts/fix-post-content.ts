import "dotenv/config";
import { db } from "@/lib/db";
import { sanitizePostHtml } from "@/features/blog/lib/sanitize-post-html";

async function main() {
  const posts = await db.post.findMany({
    select: { id: true, slug: true, content: true },
  });

  console.log(`Fixing ${posts.length} posts...`);

  for (const post of posts) {
    let cleaned = sanitizePostHtml(post.content);

    // Old static routes → current blog routes
    cleaned = cleaned.replace(/href="\/posts\//g, 'href="/blog/');

    if (cleaned === post.content) {
      console.log(`  unchanged: ${post.slug}`);
      continue;
    }

    await db.post.update({
      where: { id: post.id },
      data: { content: cleaned },
    });

    console.log(`  fixed: ${post.slug}`);
    console.log(`    still has jsx space: ${/\{\s*" "\s*\}/.test(cleaned)}`);
    console.log(`    still has h1: ${/<h1[\s>]/.test(cleaned)}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
