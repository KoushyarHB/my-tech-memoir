import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getBookmarksByUserId } from "@/features/bookmarks/server/bookmark-service";
import { PostCard } from "@/features/blog/components";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bookmarks" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function BookmarksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/signin", locale });
    return;
  }

  const bookmarks = await getBookmarksByUserId(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="mb-8 font-serif text-3xl font-bold text-ink-primary">
        Bookmarks
      </h1>

      {bookmarks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-2 text-lg text-ink-secondary">No bookmarks yet</p>
          <p className="text-sm text-ink-tertiary">
            Bookmark posts to save them for later.
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {bookmarks.map((bookmark) => (
            <PostCard key={bookmark.id} post={bookmark.post} />
          ))}
        </div>
      )}
    </div>
  );
}
