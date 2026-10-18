import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "../constants/profile";

type ConnectLinksProps = {
  className?: string;
};

/**
 * Contact row.
 *
 * Telegram leads: it is where a reply is fastest, so it gets the accent
 * treatment while the rest stay neutral.
 */
export function ConnectLinks({ className }: ConnectLinksProps) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {SOCIAL_LINKS.map((link) => {
        const primary = link.name === "Telegram";

        return (
          <li key={link.name}>
            <a
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              title={link.hint}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors",
                primary
                  ? "border-(--accent)/40 bg-(--accent-subtle) text-ink-primary hover:border-(--accent)"
                  : "border-border text-ink-secondary hover:border-(--border-hover) hover:text-ink-primary"
              )}
            >
              <link.Icon className="size-4 shrink-0" />
              {link.name}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
