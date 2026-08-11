import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { Editor } from "@tiptap/react";

export type SlashCommand = {
  title: string;
  description: string;
  keywords: string[];
  command: (editor: Editor) => void;
};

export const slashCommands: SlashCommand[] = [
  { title: "Heading 1", description: "Large section heading", keywords: ["h1", "title"], command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Heading 2", description: "Medium section heading", keywords: ["h2", "title"], command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", description: "Small section heading", keywords: ["h3", "title"], command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Bullet list", description: "Create a simple list", keywords: ["ul", "list"], command: (editor) => editor.chain().focus().toggleBulletList().run() },
  { title: "Numbered list", description: "Create an ordered list", keywords: ["ol", "list"], command: (editor) => editor.chain().focus().toggleOrderedList().run() },
  { title: "Code block", description: "Insert syntax-highlighted code", keywords: ["code", "snippet"], command: (editor) => editor.chain().focus().setCodeBlock().run() },
  { title: "Table", description: "Insert a 3 by 3 table", keywords: ["grid"], command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Callout", description: "Highlight an important note", keywords: ["note", "warning", "info"], command: (editor) => editor.chain().focus().insertContent({ type: "callout", attrs: { variant: "info", title: "Note" }, content: [{ type: "paragraph" }] }).run() },
  { title: "Divider", description: "Insert a horizontal rule", keywords: ["hr", "separator"], command: (editor) => editor.chain().focus().setHorizontalRule().run() },
];

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      ...this.parent?.(),
      suggestion: {
        char: "/",
        items: ({ query }: { query: string }) => slashCommands.filter((item) => `${item.title} ${item.description} ${item.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
        command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: SlashCommand }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
        render: () => {
          let popup: HTMLDivElement | null = null;
          let selectedIndex = 0;
          let items: SlashCommand[] = [];
          let command: ((item: SlashCommand) => void) | null = null;

          const draw = () => {
            if (!popup) return;
            popup.replaceChildren(...items.map((item, index) => {
              const button = document.createElement("button");
              button.type = "button";
              button.className = `flex w-full flex-col items-start px-3 py-2 text-left text-sm ${index === selectedIndex ? "bg-muted" : ""}`;
              button.innerHTML = `<span class="font-medium">${item.title}</span><span class="text-xs text-muted-foreground">${item.description}</span>`;
              button.addEventListener("mousedown", (event) => {
                event.preventDefault();
                command?.(item);
              });
              return button;
            }));
          };

          return {
            onStart: (props: { items: SlashCommand[]; command: (item: SlashCommand) => void; clientRect?: (() => DOMRect | null) | null }) => {
              items = props.items;
              command = props.command;
              popup = document.createElement("div");
              popup.className = "fixed z-50 min-w-56 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-lg";
              document.body.appendChild(popup);
              draw();
              const rect = props.clientRect?.();
              if (rect && popup) {
                popup.style.left = `${rect.left}px`;
                popup.style.top = `${rect.bottom + 4}px`;
              }
            },
            onUpdate: (props: { items: SlashCommand[]; command: (item: SlashCommand) => void; clientRect?: (() => DOMRect | null) | null }) => {
              items = props.items;
              command = props.command;
              selectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));
              draw();
              const rect = props.clientRect?.();
              if (rect && popup) {
                popup.style.left = `${rect.left}px`;
                popup.style.top = `${rect.bottom + 4}px`;
              }
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "ArrowDown") {
                selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1);
                draw();
                return true;
              }
              if (props.event.key === "ArrowUp") {
                selectedIndex = (selectedIndex + items.length - 1) % Math.max(items.length, 1);
                draw();
                return true;
              }
              if (props.event.key === "Enter" && items[selectedIndex]) {
                command?.(items[selectedIndex]);
                return true;
              }
              return false;
            },
            onExit: () => {
              popup?.remove();
              popup = null;
            },
          };
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});
