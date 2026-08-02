import "dotenv/config";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";
import { sanitizePostHtml } from "@/features/blog/lib/sanitize-post-html";

type StaticPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: Date;
  tags: string[];
};

const POSTS_DIR = join(
  process.cwd(),
  "src",
  "app",
  "[locale]",
  "(main)",
  "posts"
);

function extractContent(filePath: string): string {
  const raw = readFileSync(filePath, "utf-8");

  const startIdx = raw.indexOf("<article");
  const endIdx = raw.lastIndexOf("</article>");
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`No <article> found in ${filePath}`);
  }

  let content = raw.slice(startIdx, endIdx + "</article>".length);

  content = content.replace(/<article[^>]*>/, "");
  content = content.replace("</article>", "");

  return sanitizePostHtml(content);
}

function extractMetadata(filePath: string, slug: string): Partial<StaticPost> {
  const raw = readFileSync(filePath, "utf-8");

  const titleMatch = raw.match(/title:\s*"([^"]+)"/);
  const descMatch = raw.match(/description:\s*\n\s*"([^"]+)"/);
  const dateMatch = raw.match(/publishedTime:\s*"([^"]+)"/);

  const title = titleMatch ? titleMatch[1] : slug;

  let description = "";
  if (descMatch) {
    description = descMatch[1];
  }

  return {
    title,
    excerpt: description,
    publishedAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
  };
}

function getTagsForSlug(slug: string): string[] {
  const tagMap: Record<string, string[]> = {
    "networking-101": ["Networking", "Fundamentals"],
    "understanding-reacts-state-tree-and-closures": ["React", "Hooks", "Fundamentals"],
    "why-you-cant-call-usestate-inside-useeffect": ["React", "Hooks", "Gotchas"],
  };
  return tagMap[slug] ?? [];
}

async function main() {
  console.log("Seeding database...");

  if (!existsSync(POSTS_DIR)) {
    console.log(`No static posts directory at ${POSTS_DIR}; nothing to seed.`);
    return;
  }

  const postDirs = readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const slug of postDirs) {
    const filePath = join(POSTS_DIR, slug, "page.tsx");
    console.log(`Processing: ${slug}`);

    const content = extractContent(filePath);
    const meta = extractMetadata(filePath, slug);
    const tagNames = getTagsForSlug(slug);

    const existing = await db.post.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  Skipping (already exists): ${slug}`);
      continue;
    }

    const post = await db.post.create({
      data: {
        title: meta.title!,
        slug,
        excerpt: meta.excerpt ?? null,
        content,
        published: true,
        publishedAt: meta.publishedAt!,
        tags: {
          create: await Promise.all(
            tagNames.map(async (name) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: name.toLowerCase() },
                  create: { name, slug: name.toLowerCase() },
                },
              },
            }))
          ),
        },
      },
    });

    console.log(`  Created: ${post.title}`);
  }

  const count = await db.post.count();
  console.log(`\nDone. ${count} posts in database.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
