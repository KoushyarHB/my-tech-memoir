import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { Editor } from "@tiptap/react";
import { uploadEditorImage } from "./upload-editor-image";

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
  { title: "Image", description: "Upload and insert an image", keywords: ["img", "picture", "photo", "upload", "media"], command: (editor) => uploadEditorImage(editor) },
  { title: "Table", description: "Insert a 3 by 3 table", keywords: ["grid"], command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Callout", description: "Highlight an important note", keywords: ["note", "warning", "info"], command: (editor) => editor.chain().focus().insertContent({ type: "callout", attrs: { variant: "info", title: "Note" }, content: [{ type: "paragraph" }] }).run() },
  { title: "Divider", description: "Insert a horizontal rule", keywords: ["hr", "separator"], command: (editor) => editor.chain().focus().setHorizontalRule().run() },
];

const POPUP_GAP = 6;
const VIEWPORT_MARGIN = 8;

type ClientRectFn = (() => DOMRect | null) | null | undefined;

function positionSlashPopup(popup: HTMLElement, getClientRect: ClientRectFn) {
  const rect = getClientRect?.();
  if (!rect) return;

  const height = popup.offsetHeight;
  const width = popup.offsetWidth;
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const placeBelow = spaceBelow >= height || spaceBelow >= spaceAbove;

  let top = placeBelow ? rect.bottom + POPUP_GAP : rect.top - height - POPUP_GAP;
  let left = rect.left;

  top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - height - VIEWPORT_MARGIN));
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN));

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      ...this.parent?.(),
      suggestion: {
        char: "/",
        items: ({ query }: { query: string }) =>
          slashCommands
            .filter((item) =>
              `${item.title} ${item.description} ${item.keywords.join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, 10),
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: { from: number; to: number };
          props: SlashCommand;
        }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
        render: () => {
          let popup: HTMLDivElement | null = null;
          let list: HTMLDivElement | null = null;
          let selectedIndex = 0;
          let items: SlashCommand[] = [];
          let command: ((item: SlashCommand) => void) | null = null;
          let getClientRect: ClientRectFn;
          let detachPositionListeners: (() => void) | null = null;

          const draw = () => {
            if (!list) return;
            list.replaceChildren(
              ...items.map((item, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = [
                  "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  index === selectedIndex
                    ? "bg-(--bg-muted) text-ink-primary"
                    : "text-ink-primary hover:bg-(--bg-muted)/70",
                ].join(" ");
                button.innerHTML = `<span class="font-medium">${item.title}</span><span class="text-xs text-ink-tertiary">${item.description}</span>`;
                button.addEventListener("mousedown", (event) => {
                  event.preventDefault();
                  command?.(item);
                });
                return button;
              }),
            );
            // Re-measure after content changes so flip/clamp use the real height.
            requestAnimationFrame(() => {
              if (popup) positionSlashPopup(popup, getClientRect);
            });
          };

          const syncPosition = () => {
            if (popup) positionSlashPopup(popup, getClientRect);
          };

          const attachPositionListeners = () => {
            detachPositionListeners?.();
            window.addEventListener("scroll", syncPosition, true);
            window.addEventListener("resize", syncPosition);
            detachPositionListeners = () => {
              window.removeEventListener("scroll", syncPosition, true);
              window.removeEventListener("resize", syncPosition);
              detachPositionListeners = null;
            };
          };

          return {
            onStart: (props: {
              items: SlashCommand[];
              command: (item: SlashCommand) => void;
              clientRect?: ClientRectFn;
            }) => {
              items = props.items;
              command = props.command;
              getClientRect = props.clientRect;
              selectedIndex = 0;

              // Outer shell owns border/radius; inner list scrolls so the
              // scrollbar never clips the top-right corner of the border.
              popup = document.createElement("div");
              popup.className = [
                "fixed z-50 min-w-56 overflow-hidden rounded-xl",
                "border border-(--border-hover) bg-(--bg-elevated) text-ink-primary",
                "shadow-(--shadow-xl) ring-1 ring-black/10",
                "dark:border-(--border-focus) dark:bg-(--bg-elevated) dark:ring-white/20",
              ].join(" ");

              list = document.createElement("div");
              list.className = "max-h-[min(320px,calc(100vh-16px))] overflow-y-auto p-1";
              popup.appendChild(list);

              document.body.appendChild(popup);
              attachPositionListeners();
              draw();
            },
            onUpdate: (props: {
              items: SlashCommand[];
              command: (item: SlashCommand) => void;
              clientRect?: ClientRectFn;
            }) => {
              items = props.items;
              command = props.command;
              getClientRect = props.clientRect;
              selectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));
              draw();
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
              detachPositionListeners?.();
              popup?.remove();
              popup = null;
              list = null;
              getClientRect = null;
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
