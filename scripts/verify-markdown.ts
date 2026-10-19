/**
 * Verifies the Markdown paste pipeline: parsed documents must be valid for
 * the editor, the API validator, and the renderer.
 *
 * Covers the two failures seen when pasting AI-generated Markdown:
 *  - `####` headings produced documents the API rejected on save
 *    ("Heading level must be 1, 2, or 3").
 *  - invalid nesting (a paragraph inside a paragraph) rendered as `<p><p>`,
 *    which React reports as a hydration error.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { markdownToDocument, documentToMarkdown } from "../src/features/admin/components/markdown";
import { normalizeTiptapDocument } from "../src/features/blog/lib/normalize-document";
import {
  validateTiptapDocument,
  type TiptapDocument,
} from "../src/features/blog/types/document";
import { TiptapContent } from "../src/features/blog/components";

/** Fail if any <p> is rendered inside another <p> (invalid HTML). */
function findNestedP(html: string): string | null {
  const stack: string[] = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const [, closing, tag, selfClose] = match;
    const name = tag.toLowerCase();
    if (closing) {
      const index = stack.lastIndexOf(name);
      if (index !== -1) stack.splice(index, 1);
    } else if (!selfClose) {
      if (name === "p" && stack.includes("p")) {
        return `found <p> inside ${stack.join(" > ")}`;
      }
      stack.push(name);
    }
  }
  return null;
}

const FIXTURE = `## Section

Intro paragraph with \`inline code\` and a [link](https://example.com).

#### A. Deep heading

* **Item one:** some text.
* **Item two:**
  * nested bullet one
  * nested bullet two
* **Item three**

1. ordered one
2. ordered two

| Tool | Focus |
|---|---|
| Hono | routing |
| ts-rest | contracts |

> A quote.

\`\`\`ts
const x: number = 1;
\`\`\`

---
`;

// 1. `####` headings are clamped to h3 and the document can be saved.
const parsed = markdownToDocument(FIXTURE);
validateTiptapDocument(parsed);
const deepHeading = (
  parsed.content.find((node) => node.type === "heading" && node.attrs?.level === 3)
) as { type: string } | undefined;
if (!deepHeading) throw new Error("#### heading was not clamped to level 3");
const deepMarkdown = documentToMarkdown(parsed);
if (!deepMarkdown.includes("### A. Deep heading")) {
  throw new Error("clamped heading did not serialize back as h3");
}

// 2. The parsed fixture renders without nested <p>.
const parsedHtml = renderToStaticMarkup(TiptapContent({ document: parsed }));
const nestedInFixture = findNestedP(parsedHtml);
if (nestedInFixture) throw new Error(`fixture renders invalid nesting: ${nestedInFixture}`);

// 3. A paragraph inside a paragraph is rejected before it can be stored.
const pathological: TiptapDocument = {
  type: "doc",
  content: [
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "outer " },
                { type: "paragraph", content: [{ type: "text", text: "inner" }] },
              ],
            },
          ],
        },
      ],
    },
  ],
};
let rejected = false;
try {
  validateTiptapDocument(pathological);
} catch (error) {
  rejected = true;
  if (!/cannot contain/.test(String(error))) {
    throw new Error(`unexpected rejection message: ${String(error)}`);
  }
}
if (!rejected) throw new Error("paragraph-inside-paragraph was not rejected");

// 4. Normalization unwraps it into siblings, which validate and round-trip.
const normalized = normalizeTiptapDocument(pathological);
validateTiptapDocument(normalized);
const listItem = (
  (normalized.content[0] as { content: Array<{ content: unknown[] }> }).content[0] as {
    content: Array<{ type: string }>;
  }
).content;
if (listItem.length !== 2 || listItem.some((node) => node.type !== "paragraph")) {
  throw new Error(`normalization did not unwrap the nested paragraph: ${JSON.stringify(listItem.map((n) => n.type))}`);
}
const normalizedHtml = renderToStaticMarkup(TiptapContent({ document: normalized }));
const nestedInNormalized = findNestedP(normalizedHtml);
if (nestedInNormalized) throw new Error(`normalized document still invalid: ${nestedInNormalized}`);

// 5. The renderer is defensive even for legacy documents that skip the
//    normalizer: a block inside a paragraph must not become <p><p>.
const pathologicalHtml = renderToStaticMarkup(TiptapContent({ document: pathological }));
const nestedInRaw = findNestedP(pathologicalHtml);
if (nestedInRaw) throw new Error(`renderer fallback failed: ${nestedInRaw}`);
if (!pathologicalHtml.includes("<div>")) {
  throw new Error("paragraph with a block child did not fall back to <div>");
}

// 6. Round-trips are stable (paste → serialise → paste).
const once = documentToMarkdown(markdownToDocument(FIXTURE));
const twice = documentToMarkdown(markdownToDocument(once));
if (once !== twice) throw new Error("markdown round-trip is not stable");

console.log("verify:markdown — all checks passed");
console.log(`  - #### clamped to ###`);
console.log(`  - fixture renders without nested <p> (${parsedHtml.length} chars)`);
console.log(`  - paragraph-in-paragraph rejected by the validator and unwrapped by the normalizer`);
console.log(`  - renderer falls back to <div> for legacy invalid documents`);