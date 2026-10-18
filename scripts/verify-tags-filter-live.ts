/**
 * Live check for the tags api-select filter:
 *   - /api/tags paginates and searches the way the dropdown expects
 *   - filtering posts by a tag id returns exactly the posts with that tag
 */
import { db } from "../src/lib/db";
import { findPostsPage } from "../src/features/blog/server/post-repository";
import { findTagsPage } from "../src/features/tags/server/tag-repository";
import { API_SELECT_PAGE_SIZE } from "../src/components/data-table/use-api-select-options";

async function main() {
  // 1. Dropdown option source: page 1, size 10, no search.
  const firstPage = await findTagsPage({
    page: 1,
    pageSize: API_SELECT_PAGE_SIZE,
    search: null,
    filters: null,
    sortBy: null,
    sortOrder: null,
  });

  console.log(
    `tags page 1: ${firstPage.items.length}/${firstPage.totalItems} ` +
      `(totalPages ${firstPage.totalPages})`
  );

  // 2. Search narrows it down.
  const searched = await findTagsPage({
    page: 1,
    pageSize: API_SELECT_PAGE_SIZE,
    search: "re",
    filters: null,
    sortBy: null,
    sortOrder: null,
  });
  console.log(
    `search "re": ${searched.totalItems} ->`,
    searched.items.map((tag) => tag.name).join(", ")
  );

  // 3. Filter posts by each tag id and compare with a direct count.
  for (const tag of firstPage.items.slice(0, 4)) {
    const page = await findPostsPage(
      {
        page: 1,
        pageSize: 100,
        search: null,
        filters: `tagId = "${tag.id}"`,
        sortBy: null,
        sortOrder: null,
        searchFields: null,
      },
      { publishedOnly: false }
    );

    const expected = await db.post.count({
      where: { tags: { some: { tagId: tag.id } } },
    });

    const allMatch = page.items.every((post) =>
      post.tags.some((entry) => entry.id === tag.id)
    );

    const ok = page.totalItems === expected && allMatch;
    console.log(
      `${tag.name.padEnd(14)} posts=${page.totalItems}/${expected} ` +
        `allTagged=${allMatch} ${ok ? "OK" : "MISMATCH"}`
    );
    if (!ok) throw new Error(`tag filter mismatch for ${tag.name}`);
  }

  // 4. Unknown id returns nothing rather than everything.
  const none = await findPostsPage(
    {
      page: 1,
      pageSize: 10,
      search: null,
      filters: 'tagId = "does-not-exist"',
      sortBy: null,
      sortOrder: null,
      searchFields: null,
    },
    { publishedOnly: false }
  );
  if (none.totalItems !== 0) {
    throw new Error(`unknown tag id returned ${none.totalItems} posts`);
  }
  console.log("unknown tag id: 0 posts  OK");

  // 5. Combined with search, both constraints apply.
  const combined = await findPostsPage(
    {
      page: 1,
      pageSize: 10,
      search: "react",
      filters: `tagId = "${firstPage.items[0].id}"`,
      sortBy: null,
      sortOrder: null,
      searchFields: null,
    },
    { publishedOnly: false }
  );
  console.log(`search+tag combined: ${combined.totalItems} posts  OK`);

  console.log("\ntags api-select filter live check passed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FAILED:", error);
    process.exit(1);
  });
