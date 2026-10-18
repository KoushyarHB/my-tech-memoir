import type { Metadata } from "next";
import { AppearanceForm } from "@/features/appearance/components";

export const metadata: Metadata = {
  title: "Appearance",
};

export default function AdminAppearancePage() {
  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
          System
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink-primary">
          Appearance
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-secondary">
          Theme, accent colour and reading preferences. Changes apply
          immediately and are saved in this browser.
        </p>
      </div>

      <AppearanceForm />
    </div>
  );
}
