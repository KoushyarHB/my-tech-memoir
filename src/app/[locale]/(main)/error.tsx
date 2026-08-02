"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Page Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <h2 className="font-serif text-2xl font-semibold text-ink-primary">
        Something went wrong
      </h2>
      <p className="mt-3 text-sm text-ink-secondary">
        An error occurred loading this content. Please try again.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre
          className="mt-4 max-w-lg overflow-auto rounded-lg border border-border bg-code-bg p-4 text-left text-xs text-code-text"
        >
          {error.message}
        </pre>
      )}
      <Button variant="outline" className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
