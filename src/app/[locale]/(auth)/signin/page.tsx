import type { Metadata } from "next";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import SignInButtons from "@/features/auth/components/sign-in-buttons";
import { redirect } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signIn" });
  return { title: t("title") };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (session?.user) {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations("signIn");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-serif text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButtons />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-xs text-ink-tertiary">{t("terms")}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
