import "dotenv/config";
import { db } from "@/lib/db";

async function main() {
  const postCount = await db.post.count();
  console.log("Posts:", postCount);
  const tagCount = await db.tag.count();
  console.log("Tags:", tagCount);
  const userCount = await db.user.count();
  console.log("Users:", userCount);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
