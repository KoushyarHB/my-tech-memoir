import "dotenv/config";
import { db } from "@/lib/db";

async function main() {
  const slugs = ["architecture", "meta", "ai"];
  for (const slug of slugs) {
    const name = slug.charAt(0).toUpperCase() + slug.slice(1);
    await db.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    console.log(`Tag ready: ${name}`);
  }
  const tags = await db.tag.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, name: true },
  });
  console.log(JSON.stringify(tags));
}

main().catch(console.error).finally(() => process.exit(0));
