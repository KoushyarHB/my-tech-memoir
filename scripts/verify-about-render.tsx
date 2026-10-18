import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConnectLinks, ProfileHeader } from "../src/features/about/components";
import {
  PRIMARY_CONTACT,
  PROFILE,
  SKILL_GROUPS,
  SOCIAL_LINKS,
} from "../src/features/about/constants/profile";

const html = renderToStaticMarkup(
  React.createElement(
    "div",
    null,
    React.createElement(ProfileHeader, {
      roleLine: "Software engineer · Transport management systems",
    }),
    React.createElement(ConnectLinks)
  )
);

// Photo: real image, not a monogram. next/image URL-encodes the path into
// /_next/image?url=%2Fabout-portrait.jpg&w=…, so match the file name.
const photoFile = PROFILE.photo.src.replace(/^\//, "");
const decoded = html.replace(/%2F/g, "/");
if (!decoded.includes(PROFILE.photo.src) && !decoded.includes(photoFile)) {
  throw new Error("portrait is not rendered");
}
if (!html.includes(`alt="${PROFILE.photo.alt}"`)) {
  throw new Error("portrait is missing alt text");
}
if (!html.includes("<img")) {
  throw new Error("portrait did not render as an img");
}
// A real photo should be optimised and preloaded, not a raw <img src>.
if (!html.includes("/_next/image")) {
  throw new Error("portrait is not going through next/image optimisation");
}
if (!html.includes('rel="preload"')) {
  throw new Error("priority portrait should be preloaded");
}
// It must be constrained, otherwise a 900px source ships at full size.
if (!html.includes("sizes=")) {
  throw new Error("portrait is missing a sizes attribute");
}

// The name is the h1, not "About".
if (!html.includes("<h1")) throw new Error("missing h1");
if (!html.includes(PROFILE.name)) throw new Error("name missing from header");
if (!html.includes("Transport management systems")) {
  throw new Error("role line missing");
}

// Telegram must be present, linked, and open safely.
const telegram = SOCIAL_LINKS.find((link) => link.name === "Telegram");
if (!telegram) throw new Error("Telegram link missing from constants");
if (telegram.href !== "https://t.me/Koushyar_hb") {
  throw new Error(`unexpected Telegram href: ${telegram.href}`);
}
if (!html.includes("https://t.me/Koushyar_hb")) {
  throw new Error("Telegram href not rendered");
}
if (!html.includes("noopener noreferrer")) {
  throw new Error("external links missing rel");
}

// Primary CTA points at Telegram.
if (PRIMARY_CONTACT.name !== "Telegram") {
  throw new Error("primary contact should be Telegram");
}

// Every social link renders exactly once.
for (const link of SOCIAL_LINKS) {
  const count = html.split(link.href).length - 1;
  if (count !== 1) {
    throw new Error(`${link.name} rendered ${count} times, expected 1`);
  }
}

// Mailto links must not open a new tab.
if (html.includes('href="mailto:koushyarhb@gmail.com" target="_blank"')) {
  throw new Error("mailto link should not open a new tab");
}

// Skill groups are non-empty and unique.
const seen = new Set<string>();
for (const group of SKILL_GROUPS) {
  if (group.skills.length === 0) throw new Error(`empty group: ${group.label}`);
  for (const skill of group.skills) {
    if (seen.has(skill)) throw new Error(`duplicate skill: ${skill}`);
    seen.add(skill);
  }
}

// No leftover placeholder copy.
if (html.includes("deep curiosity about how things work")) {
  throw new Error("old placeholder copy still present");
}

// The bio must not read as a networking-only blog: the old paragraph named
// packets/protocols/internet three times, which narrowed the whole page.
const en = JSON.parse(
  require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "messages", "en.json"),
    "utf8"
  )
);
const networkingTerms = (en.about.bio.p2.match(/packet|protocol|internet/gi) ?? [])
  .length;
if (networkingTerms > 0) {
  throw new Error(
    `bio.p2 still leans on networking (${networkingTerms} references)`
  );
}
if (!en.about.nowText || /packet|protocol|internet/i.test(en.about.nowText)) {
  throw new Error("nowText should stay topic-neutral");
}

console.log(`portrait: ${PROFILE.photo.src} with alt  ✓`);
console.log(`social links: ${SOCIAL_LINKS.map((l) => l.name).join(", ")}  ✓`);
console.log(`primary CTA: ${PRIMARY_CONTACT.name}  ✓`);
console.log(`skill groups: ${SKILL_GROUPS.length} (${seen.size} skills)  ✓`);
console.log("about render verification passed");
