"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Menu } from "@base-ui/react/menu";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  fa: "FA",
};

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  fa: "فارسی",
};

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  function switchLocale(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-secondary transition-colors",
          "hover:bg-(--bg-muted) hover:text-ink-primary",
          "outline-none focus-visible:border-(--border-hover) data-popup-open:bg-(--bg-muted) data-popup-open:text-ink-primary",
          className
        )}
        aria-label={t("language")}
        title={t("language")}
      >
        <Globe className="size-3.5 opacity-70" />
        <span className="tabular-nums tracking-wide">
          {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
        </span>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          className="isolate z-50 outline-none"
        >
          <Menu.Popup
            className={cn(
              "min-w-40 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-(--bg-elevated) p-1 shadow-(--shadow-md)",
              "outline-none"
            )}
            style={{ outline: "none" }}
          >
            {routing.locales.map((item) => (
              <Menu.Item
                key={item}
                closeOnClick
                onClick={() => switchLocale(item)}
                className={cn(
                  "flex w-full cursor-default items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none select-none",
                  "text-ink-secondary data-highlighted:bg-(--bg-muted) data-highlighted:text-ink-primary"
                )}
              >
                <span>{LOCALE_NAMES[item] ?? item}</span>
                {item === locale ? (
                  <Check className="size-3.5 text-ink-tertiary" />
                ) : null}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
