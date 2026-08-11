import { Node } from "@tiptap/core";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: { default: "info" },
      title: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "aside.memoir-callout" }];
  },
  renderHTML({ node }) {
    return [
      "aside",
      {
        class: `memoir-callout memoir-callout--${node.attrs.variant}`,
        "data-variant": node.attrs.variant,
        "data-title": node.attrs.title,
      },
      0,
    ];
  },
});
