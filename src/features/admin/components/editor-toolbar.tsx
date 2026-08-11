"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Strikethrough,
  Code2,
  Link2,
  Plus,
  ImagePlus,
  Table2,
  Quote,
  Braces,
  Minus,
  Undo2,
  Redo2,
  MoreHorizontal,
  Search,
  Check,
  Rows3,
  Columns3,
  Baseline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { uploadEditorImage } from "./upload-editor-image";

const TEXT_COLORS = [
  { label: "Default", value: null },
  { label: "Ink", value: "#2a2926" },
  { label: "Gray", value: "#787570" },
  { label: "Blue", value: "#2563eb" },
  { label: "Teal", value: "#0d9488" },
  { label: "Green", value: "#16a34a" },
  { label: "Amber", value: "#d97706" },
  { label: "Red", value: "#dc2626" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Pink", value: "#db2777" },
] as const;

const CODE_LANGUAGES = [
  { value: "plain", label: "Plain text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
] as const;

type EditorToolbarProps = {
  editor: Editor | null;
};

type ActionButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ActionButton({ label, active, onClick, children }: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary",
        active && "bg-accent-subtle text-ink-primary"
      )}
    >
      {children}
    </button>
  );
}


function BlockMenu({ editor }: { editor: Editor }) {
  const insert = (content: Parameters<typeof editor.commands.insertContent>[0]) => {
    editor.chain().focus().insertContent(content).run();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg">
      <ActionButton label="Insert heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><span className="text-xs font-semibold">H</span></ActionButton>
      <ActionButton label="Insert quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ActionButton>
      <ActionButton label="Insert code block" onClick={() => editor.chain().focus().setCodeBlock().run()}><Braces className="size-4" /></ActionButton>
      <ActionButton label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="size-4" /></ActionButton>
      <ActionButton label="Insert callout" onClick={() => insert({ type: "callout", attrs: { variant: "info", title: "Note" }, content: [{ type: "paragraph" }] })}><span className="text-xs font-bold">!</span></ActionButton>
      <ActionButton label="Insert image" onClick={() => uploadEditorImage(editor)}><ImagePlus className="size-4" /></ActionButton>
      <ActionButton label="Insert divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ActionButton>
    </div>
  );
}

function LinkEditor({ editor }: { editor: Editor }) {
  const [url, setUrl] = useState(() => editor.getAttributes("link").href ?? "");
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg">
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const value = url.trim();
          if (value) editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
          else editor.chain().focus().extendMarkRange("link").unsetLink().run();
        }}
        placeholder="https://..."
        className="h-8 w-52 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
        autoFocus
      />
      <Button size="sm" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()}>Apply</Button>
    </div>
  );
}

function ColorPicker({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = String(editor.getAttributes("textStyle").color ?? "");

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
      {TEXT_COLORS.map((swatch) => {
        const active = swatch.value
          ? current.toLowerCase() === swatch.value.toLowerCase()
          : !current;
        return (
          <button
            key={swatch.label}
            type="button"
            aria-label={swatch.label}
            title={swatch.label}
            onMouseDown={(event) => {
              event.preventDefault();
              if (swatch.value) editor.chain().focus().setColor(swatch.value).run();
              else editor.chain().focus().unsetColor().run();
              onClose();
            }}
            className={cn(
              "relative inline-flex size-6 items-center justify-center rounded-full border border-border transition-transform hover:scale-110",
              active && "ring-2 ring-accent ring-offset-1 ring-offset-popover"
            )}
            style={
              swatch.value
                ? { backgroundColor: swatch.value }
                : {
                    background:
                      "linear-gradient(to bottom right, transparent calc(50% - 0.5px), var(--border) calc(50% - 0.5px), var(--border) calc(50% + 0.5px), transparent calc(50% + 0.5px)), var(--bg-elevated)",
                  }
            }
          />
        );
      })}
    </div>
  );
}

const EDITOR_COMMANDS = [
  { id: "paragraph", label: "Turn into paragraph", hint: "Text", run: (editor: Editor) => editor.chain().focus().setParagraph().run() },
  { id: "heading", label: "Turn into heading", hint: "H2", run: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "code", label: "Insert code block", hint: "Code", run: (editor: Editor) => editor.chain().focus().setCodeBlock().run() },
  { id: "table", label: "Insert table", hint: "3 × 3", run: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { id: "callout", label: "Insert callout", hint: "Note", run: (editor: Editor) => editor.chain().focus().insertContent({ type: "callout", attrs: { variant: "info", title: "Note" }, content: [{ type: "paragraph" }] }).run() },
  { id: "divider", label: "Insert divider", hint: "Rule", run: (editor: Editor) => editor.chain().focus().setHorizontalRule().run() },
];

function ContextTools({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      code: current.isActive("codeBlock"),
      table: current.isActive("table"),
      language: String(current.getAttributes("codeBlock").language ?? "") || "plain",
    }),
  });

  if (!state.code && !state.table) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-bg-muted/40 px-3 py-2 text-xs">
      {state.code ? (
        <>
          <span className="font-medium text-ink-secondary">Code block</span>
          <Select
            value={state.language}
            items={[...CODE_LANGUAGES]}
            onValueChange={(next) => {
              const value = !next || next === "plain" ? null : String(next);
              editor.chain().focus().updateAttributes("codeBlock", { language: value }).run();
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-7 min-w-32 border-border bg-bg-elevated text-xs text-ink-primary"
              aria-label="Code language"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-40">
              {CODE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            defaultValue={String(editor.getAttributes("codeBlock").filename ?? "")}
            onBlur={(event) => editor.chain().focus().updateAttributes("codeBlock", { filename: event.target.value.trim() || null }).run()}
            placeholder="filename.ts (optional)"
            className="h-7 w-44 border-border bg-bg-elevated text-xs"
            aria-label="Code filename"
          />
        </>
      ) : (
        <>
          <span className="font-medium text-ink-secondary">Table tools</span>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 /> Add row</Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 /> Add column</Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</Button>
        </>
      )}
    </div>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const commands = EDITOR_COMMANDS.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase()));
  const editorState = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      color: String(current?.getAttributes("textStyle").color ?? ""),
      selectionEmpty: current?.state.selection.empty ?? true,
      imageActive: current?.isActive("image") ?? false,
    }),
  });
  const activeColor = editorState?.color ?? "";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (!paletteOpen) return;
      if (event.key === "Escape") setPaletteOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelected((value) => (value + 1) % Math.max(commands.length, 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelected((value) => (value + commands.length - 1) % Math.max(commands.length, 1));
      }
      if (event.key === "Enter" && commands[selected]) {
        event.preventDefault();
          if (editor) commands[selected].run(editor);
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commands, editor, paletteOpen, selected]);

  if (!editor) return null;

  return (
    <>
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 8 }}
        shouldShow={({ editor: current }) => !current.state.selection.empty && !current.isActive("image")}
        className="z-40 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-xl"
      >
        {linkOpen ? (
          <LinkEditor editor={editor} />
        ) : colorOpen ? (
          <ColorPicker editor={editor} onClose={() => setColorOpen(false)} />
        ) : (
          <>
            <ActionButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ActionButton>
            <ActionButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ActionButton>
            <ActionButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ActionButton>
            <ActionButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 className="size-4" /></ActionButton>
            <ActionButton
              label="Text color"
              active={Boolean(activeColor)}
              onClick={() => {
                setLinkOpen(false);
                setColorOpen(true);
              }}
            >
              <span className="relative inline-flex flex-col items-center">
                <Baseline className="size-4" />
                <span
                  className="absolute -bottom-0.5 h-0.5 w-3.5 rounded-full"
                  style={{ backgroundColor: activeColor || "currentColor" }}
                />
              </span>
            </ActionButton>
            <ActionButton
              label="Link"
              active={editor.isActive("link")}
              onClick={() => {
                setColorOpen(false);
                setLinkOpen(true);
              }}
            >
              <Link2 className="size-4" />
            </ActionButton>
          </>
        )}
      </BubbleMenu>

      <FloatingMenu editor={editor} options={{ placement: "left", offset: 12 }} className="z-30" shouldShow={({ state }) => {
        const { $from, empty } = state.selection;
        return empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0;
      }}>
        <BlockMenu editor={editor} />
      </FloatingMenu>

      <div className="sticky top-12 z-20 flex items-center justify-between rounded-t-[0.9rem] border-b border-border bg-card/95 px-3 py-2 backdrop-blur-sm lg:top-14">
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span className="inline-flex size-2 rounded-full bg-emerald-500" />
          <span>Type <kbd className="rounded border border-border px-1 font-mono text-[10px]">/</kbd> for blocks</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Undo" aria-label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 /></Button>
          <Button variant="ghost" size="icon-sm" title="Redo" aria-label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 /></Button>
          <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)}><Search /> <span className="hidden sm:inline">Command menu</span><kbd className="ml-1 hidden rounded border border-border px-1 font-mono text-[10px] sm:inline">Ctrl+K</kbd></Button>
        </div>
      </div>
      <ContextTools editor={editor} />
      {paletteOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[15vh]" onMouseDown={() => setPaletteOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 text-ink-tertiary" />
              <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} placeholder="Search editor commands..." className="h-12 flex-1 bg-transparent text-sm text-ink-primary outline-none" />
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-ink-tertiary">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {commands.map((item, index) => (
                <button key={item.id} type="button" className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm", index === selected ? "bg-bg-muted" : "hover:bg-bg-muted/60")} onMouseEnter={() => setSelected(index)} onClick={() => { item.run(editor); setPaletteOpen(false); }}>
                  <span className="flex items-center gap-2"><Check className={cn("size-3.5", index === selected ? "opacity-100" : "opacity-0")} />{item.label}</span><span className="text-xs text-ink-tertiary">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
