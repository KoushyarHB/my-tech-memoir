"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<string, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  fa: { label: "فارسی", flag: "🇮🇷" },
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.split("/")[1] as string;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(locale: string) {
    router.replace(pathname, { locale });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        aria-expanded={open}
      >
        <Globe className="size-3.5" />
        <span className="text-xs">{LOCALE_LABELS[currentLocale]?.flag ?? "🇺🇸"}</span>
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border bg-card shadow-md"
        >
          {routing.locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => switchLocale(locale)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                locale === currentLocale ? "text-primary" : "text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <span>{LOCALE_LABELS[locale]?.flag}</span>
                <span>{LOCALE_LABELS[locale]?.label}</span>
              </span>
              {locale === currentLocale && <Check className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
