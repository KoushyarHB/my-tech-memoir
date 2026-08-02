/**
 * Converts JSX-ish article markup (from old static page.tsx files)
 * into HTML safe for dangerouslySetInnerHTML.
 *
 * Post title always comes from PostHeader — body HTML must not include <h1>.
 */
export function sanitizePostHtml(content: string): string {
  let html = content;

  // JSX whitespace expressions → real spaces
  html = html.replace(/\{\s*" "\s*\}/g, " ");
  html = html.replace(/\{\s*' '\s*\}/g, " ");
  html = html.replace(/\{\s*` `\s*\}/g, " ");
  html = html.replace(/\{\s*""\s*\}/g, "");
  html = html.replace(/\{\s*''\s*\}/g, "");

  // JSX comments
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // Title lives in PostHeader only — never render <h1> from body HTML
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, "");

  // Strip leftover React-only attributes
  html = html.replace(/\s+className="[^"]*"/g, "");

  // Old static post routes → current blog routes
  html = html.replace(/href="\/posts\//g, 'href="/blog/');

  // Collapse excessive blank lines from indented JSX
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}
