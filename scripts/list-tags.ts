import "dotenv/config";
import { db } from "@/lib/db";

async function main() {
  const tags = await db.tag.findMany({ select: { id: true, name: true, slug: true } });
  console.log(JSON.stringify(tags, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
