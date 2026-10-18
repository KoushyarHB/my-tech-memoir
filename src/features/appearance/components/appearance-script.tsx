import { APPEARANCE_SCRIPT } from "../lib/appearance-script";

/**
 * Appearance domain: applies stored preferences before first paint.
 *
 * Rendered in `<head>`; must not be a `next/script` (which is deferred).
 */
export function AppearanceScript() {
  return <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />;
}
