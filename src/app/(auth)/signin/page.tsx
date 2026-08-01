import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import SignInButtons from "@/features/auth/components/sign-in-buttons";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-serif text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to leave comments and bookmark posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButtons />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-xs text-ink-tertiary">
            By signing in you agree to the site&apos;s terms.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
