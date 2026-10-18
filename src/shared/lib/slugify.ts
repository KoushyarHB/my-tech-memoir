/**
 * Shared kernel: URL slug generation.
 *
 * Used by posts and tags, so it lives here rather than in a single domain.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}
