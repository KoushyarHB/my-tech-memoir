import { Color } from "@tiptap/extension-color";
import { resolveTextColor } from "@/features/blog/constants/text-colors";

/**
 * The stock Color mark writes `style="color: #2a2926"` straight into the
 * canvas, so a sentence styled with the "Ink" swatch kept its light-mode value
 * on the dark canvas while the rest of the paragraph followed
 * `--ink-secondary` — the selection looked fine, the sentence looked broken.
 *
 * Rendering through `resolveTextColor` swaps the palette neutrals for their
 * design tokens. Only the rendered attribute changes: the stored `color` stays
 * the palette hex, so saved documents and the API validator are unaffected.
 */
export const ThemedColor = Color.extend({
  addGlobalAttributes() {
    return (this.parent?.() ?? []).map((group) => ({
      ...group,
      attributes: {
        ...group.attributes,
        color: {
          ...group.attributes?.color,
          renderHTML: (attributes: Record<string, unknown>) => {
            const color = typeof attributes.color === "string" ? attributes.color.trim() : "";
            if (!color) return {};
            return { style: `color: ${resolveTextColor(color)}` };
          },
        },
      },
    }));
  },
});