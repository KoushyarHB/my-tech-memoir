"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppearance } from "../hooks/use-appearance";
import { AccentPicker } from "./accent-picker";
import { AppearancePreview } from "./appearance-preview";
import { AppearanceSection } from "./appearance-section";
import { ReadingControls } from "./reading-controls";
import { ThemePicker } from "./theme-picker";

/**
 * Appearance settings form.
 *
 * Every change applies immediately — there is no save step, because these are
 * browser-local preferences and a preview is always on screen. The reset action
 * is the only "commit"-style control.
 */
export function AppearanceForm() {
  const {
    theme,
    accent,
    readingSize,
    readingWidth,
    reduceMotion,
    setTheme,
    setAccent,
    setReadingSize,
    setReadingWidth,
    setReduceMotion,
    reset,
    isDefault,
  } = useAppearance();

  function handleReset() {
    reset();
    toast.success("Appearance reset to defaults");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-5">
        <AppearanceSection
          title="Theme"
          description="Choose how the interface looks. System follows your operating system setting and updates when it changes."
        >
          <ThemePicker value={theme} onChange={setTheme} />
        </AppearanceSection>

        <AppearanceSection
          title="Accent colour"
          description="Used for links, highlights and primary actions. Each option has a light and dark variant."
        >
          <AccentPicker value={accent} onChange={setAccent} />
        </AppearanceSection>

        <AppearanceSection
          title="Reading"
          description="Applies to published articles and long-form pages, not the editor."
        >
          <ReadingControls
            size={readingSize}
            width={readingWidth}
            onSizeChange={setReadingSize}
            onWidthChange={setReadingWidth}
          />
        </AppearanceSection>

        <AppearanceSection
          title="Accessibility"
          description="Reduce motion disables transitions and animations across the site."
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="reduce-motion" className="text-xs text-ink-primary">
                Reduce motion
              </Label>
              <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">
                Turn this on if animation feels distracting. Your operating
                system preference is respected automatically.
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              aria-label="Reduce motion"
            />
          </div>
        </AppearanceSection>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <AppearancePreview readingWidth={readingWidth} />

        <section className="rounded-xl border border-border bg-(--bg-elevated) p-4">
          <h2 className="text-sm font-medium text-ink-primary">Preferences</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">
            Saved in this browser only — they follow the device, not the account.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isDefault}
            className="mt-3 w-full"
          >
            <RotateCcw className="size-3.5" />
            Reset to defaults
          </Button>
        </section>
      </aside>
    </div>
  );
}
