import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
    <div className="flex items-center justify-center min-h-[80vh] px-5">
      <div
        className="w-full max-w-sm rounded-xl p-8 space-y-6"
        style={{
          backgroundColor: "var(--bg-raised)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="space-y-2 text-center">
          <h1
            className="font-serif text-2xl font-semibold"
            style={{ color: "var(--ink-primary)" }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--ink-secondary)" }}
          >
            Sign in to leave comments and bookmark posts.
          </p>
        </div>

        <SignInButtons />

        <p
          className="text-center text-xs"
          style={{ color: "var(--ink-tertiary)" }}
        >
          By signing in you agree to the site&apos;s terms.
        </p>
      </div>
    </div>
  );
}
