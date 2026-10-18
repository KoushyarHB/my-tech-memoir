import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectLinks, ProfileHeader } from "@/features/about/components";
import {
  PRIMARY_CONTACT,
  SKILL_GROUPS,
} from "@/features/about/constants/profile";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "profile",
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-(--reading-max-width) px-5 py-12 sm:py-16">
      <ProfileHeader roleLine={t("roleLine")} />

      <section aria-label="Bio" className="prose-memoir mt-10">
        <p>{t("bio.p1")}</p>
        <p>{t("bio.p2")}</p>
        <p>{t("bio.p3")}</p>
      </section>

      <section aria-label="Currently" className="mt-8">
        <div className="rounded-xl border border-border bg-(--bg-elevated) px-4 py-3.5">
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-tertiary">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            {t("now")}
          </p>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t("nowText")}
          </p>
        </div>
      </section>

      <section aria-label="Skills" className="mt-12">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink-primary">
          {t("skills")}
        </h2>
        <dl className="space-y-3">
          {SKILL_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
              <dt className="shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-tertiary sm:w-24">
                {group.label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {group.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="font-normal">
                    {skill}
                  </Badge>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Connect" className="mt-12">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink-primary">
          {t("connect")}
        </h2>
        <ConnectLinks />
      </section>

      <section
        aria-label="Contact"
        className="mt-14 border-t border-border pt-8 text-center"
      >
        <p className="text-ink-secondary">{t("contact")}</p>
        <p className="mt-1 text-xs text-ink-tertiary">{t("contactHint")}</p>
        <a
          href={PRIMARY_CONTACT.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-5"
          )}
        >
          <PRIMARY_CONTACT.Icon className="size-4" />
          {t("getInTouch")}
          <ArrowUpRight className="size-4" />
        </a>
      </section>
    </div>
  );
}
