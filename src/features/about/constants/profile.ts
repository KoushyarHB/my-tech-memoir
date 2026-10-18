import type { ComponentType } from "react";
import { Mail } from "lucide-react";
import {
  GithubIcon,
  LinkedinIcon,
  TelegramIcon,
} from "../components/brand-icons";

/**
 * About domain: profile data.
 *
 * Kept as constants rather than inline JSX so the page stays a layout and the
 * links have exactly one definition (used by both the Connect row and the
 * closing call to action).
 */

export const PROFILE = {
  name: "Koushyar",
  /** Shown under the name. */
  role: "Software engineer",
  /** Second line: what the day job actually is. */
  focus: "Transport management systems",
  photo: {
    src: "/about-portrait.jpg",
    width: 900,
    height: 900,
    alt: "Portrait of Koushyar",
  },
} as const;

export type SocialLink = {
  name: string;
  href: string;
  /** Short line used as the link's title/aria description. */
  hint: string;
  Icon: ComponentType<{ className?: string }>;
  /** Opens in a new tab. */
  external: boolean;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    name: "Telegram",
    href: "https://t.me/Koushyar_hb",
    hint: "Message me on Telegram",
    Icon: TelegramIcon,
    external: true,
  },
  {
    name: "GitHub",
    href: "https://github.com/KoushyarHB",
    hint: "Code and side projects",
    Icon: GithubIcon,
    external: true,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/koushyarhb",
    hint: "Work history",
    Icon: LinkedinIcon,
    external: true,
  },
  {
    name: "Email",
    href: "mailto:koushyarhb@gmail.com",
    hint: "koushyarhb@gmail.com",
    Icon: Mail,
    external: false,
  },
];

/** The primary call to action — Telegram, since it is the fastest reply. */
export const PRIMARY_CONTACT = SOCIAL_LINKS[0];

/** Grouped by what they are, so the row reads as a skill map, not a list. */
export const SKILL_GROUPS: ReadonlyArray<{
  label: string;
  skills: readonly string[];
}> = [
  {
    label: "Languages",
    skills: ["TypeScript", "Python", "SQL"],
  },
  {
    label: "Web",
    skills: ["React", "Next.js", "Node.js", "Tailwind CSS"],
  },
  {
    label: "Data",
    skills: ["PostgreSQL", "Prisma"],
  },
  {
    label: "Systems",
    skills: ["Networking", "Linux", "Docker", "Git"],
  },
];
