import "dotenv/config";
import { db } from "@/lib/db";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npm run promote-admin -- email@example.com");
    process.exit(1);
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    console.error("Make sure the user has signed in at least once.");
    process.exit(1);
  }

  console.log(`Current role: ${user.role}`);

  const updated = await db.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: { email: true, name: true, role: true },
  });

  console.log(`Promoted to ADMIN: ${updated.email} (${updated.name})`);
  console.log("Note: User must sign out and sign in again for the new role to take effect.");
}

main()
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
