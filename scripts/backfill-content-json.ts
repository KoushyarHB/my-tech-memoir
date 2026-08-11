/**
 * Backfill Post.contentJson from legacy HTML Post.content.
 *
 * Usage:
 *   npx tsx scripts/backfill-content-json.ts           # dry-run (default)
 *   npx tsx scripts/backfill-content-json.ts --apply   # write to DB
 *
 * Uses DATABASE_URL from the environment (.env). Point it at production
 * deliberately before --apply.
 */
import "dotenv/config";
import { db, Prisma } from "@/lib/db";
import { sanitizePostHtml } from "@/features/blog/lib/sanitize-post-html";
import { htmlToTiptapDocument } from "@/features/blog/lib/html-to-document";
import {
  documentToPlainText,
  hasDocumentText,
} from "@/features/blog/types/document";

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const posts = await db.post.findMany({
    where: { contentJson: { equals: Prisma.DbNull } },
    select: { id: true, slug: true, title: true, content: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Posts with null contentJson: ${posts.length}`);
  if (posts.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const cleaned = sanitizePostHtml(post.content);
      const document = htmlToTiptapDocument(cleaned);
      const preview = documentToPlainText(document).slice(0, 80);

      if (!hasDocumentText(document) && cleaned.replace(/<[^>]+>/g, "").trim()) {
        throw new Error("Converted document is empty but HTML still has text");
      }

      if (apply) {
        await db.post.update({
          where: { id: post.id },
          data: {
            contentJson: document as unknown as Prisma.InputJsonValue,
            // Keep HTML in sync with what TipTap would emit on next save? No —
            // leave `content` untouched; only fill the new JSON column.
          },
        });
      }

      ok += 1;
      console.log(
        `  ${apply ? "updated" : "ok"}: ${post.slug} (${preview || "(empty)"})`
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAIL: ${post.slug} — ${message}`);
    }
  }

  console.log(`Done. ok=${ok} failed=${failed}`);
  if (!apply && ok > 0) {
    console.log("Re-run with --apply to write these rows.");
  }
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
