import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PostListSkeleton } from "../src/features/blog/components/post-list-skeleton";

/**
 * Guards the skeleton's shape against drift from `PostCard`: four cards, each
 * with a meta line, a two-line title, a two-line excerpt and two tag pills.
 */
const html = renderToStaticMarkup(React.createElement(PostListSkeleton));

const cards = html.match(/first:pt-0/g)?.length ?? 0;
const dividers = html.match(/divide-y/g)?.length ?? 0;
const firstTagPills = html.match(/h-5 w-20 rounded-full/g)?.length ?? 0;
const secondTagPills = html.match(/h-5 w-14 rounded-full/g)?.length ?? 0;
const bars = html.match(/animate-pulse/g)?.length ?? 0;

if (cards !== 4) throw new Error(`expected 4 cards, got ${cards}`);
if (dividers !== 1) throw new Error("missing divide-y wrapper");
if (firstTagPills !== 4 || secondTagPills !== 4) {
  throw new Error(
    `expected 4 tag rows, got ${firstTagPills}/${secondTagPills}`
  );
}
if (bars !== 4 * 9) throw new Error(`expected 36 skeleton bars, got ${bars}`);
if (html.includes("h-7 w-3/4")) {
  throw new Error("old single-line title placeholder still present");
}

console.log("post list skeleton render verification passed");
