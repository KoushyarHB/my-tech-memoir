"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostEditor } from "./post-editor";
import { Save, Send, ArrowLeft, X, Eye } from "lucide-react";
import { slugify } from "@/features/blog/lib/slugify";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TiptapDocument } from "@/features/blog/types/document";
import { EMPTY_TIPTAP_DOCUMENT, hasDocumentText } from "@/features/blog/types/document";
import { TiptapContent } from "@/features/blog/components";
import { documentToMarkdown, markdownToDocument } from "./markdown";

type Tag = { id: string; name: string; slug: string };

type PostEditorPageProps = {
  postId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
  initialContentJson?: TiptapDocument | null;
  initialPublished?: boolean;
  initialTagIds?: string[];
  availableTags: Tag[];
};

type SavePhase = "idle" | "saving" | "saved";

type SavedSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  tagIds: string;
};

function hasText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

/** TipTap empty docs are "<p></p>" / "<p><br></p>", not "". Treat those as equal. */
function normalizeContent(html: string): string {
  return hasText(html) ? html : "";
}

function plainTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length;
}

/**
 * Pause auto-save after large accidental wipes (select-all + delete).
 * Manual save still works. Auto-save resumes after continued typing
 * (see AUTO_SAVE_RESUME_CHARS) or when the wipe is undone.
 */
function isHugeContentDeletion(previousHtml: string, nextHtml: string): boolean {
  const prevLen = plainTextLength(previousHtml);
  const nextLen = plainTextLength(nextHtml);
  if (prevLen < 80) return false; // nothing substantial was saved yet

  const deleted = prevLen - nextLen;
  if (deleted < 80) return false;

  // Cleared most of a long draft, or removed a large absolute chunk
  if (nextLen === 0) return true;
  if (deleted >= 400) return true;
  if (deleted >= prevLen * 0.5) return true;

  return false;
}

/** Chars typed after a wipe before auto-save resumes (confirms intent). */
const AUTO_SAVE_RESUME_CHARS = 40;

function makeSnapshot(input: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  tagIds: string[];
}): SavedSnapshot {
  return {
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt.trim(),
    content: normalizeContent(input.content),
    published: input.published,
    tagIds: [...input.tagIds].sort().join(","),
  };
}

export function PostEditorPage({
  postId,
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialContent = "",
  initialContentJson = null,
  initialPublished = false,
  initialTagIds = [],
  availableTags,
}: PostEditorPageProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent);
  const [contentJson, setContentJson] = useState<TiptapDocument>(initialContentJson ?? EMPTY_TIPTAP_DOCUMENT);
  const [editorMode, setEditorMode] = useState<"write" | "preview" | "source">("write");
  const [source, setSource] = useState(() => initialContentJson ? documentToMarkdown(initialContentJson) : "");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [published, setPublished] = useState(initialPublished);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialSlug);
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [currentPostId, setCurrentPostId] = useState(postId);

  // Last-saved snapshot lives in state so we can diff during render
  const [lastSaved, setLastSaved] = useState<SavedSnapshot>(
    makeSnapshot({
      title: initialTitle,
      slug: initialSlug || slugify(initialTitle),
      excerpt: initialExcerpt,
      content: initialContent,
      published: initialPublished,
      tagIds: initialTagIds,
    })
  );

  const effectiveSlug = slugManuallyEdited ? slug : slugify(title);

  // Derive dirty state during render (no ref access, no effect)
  const currentSnapshot = makeSnapshot({
    title,
    slug: effectiveSlug,
    excerpt,
    content,
    published,
    tagIds: selectedTagIds,
  });

  const isDirty =
    currentSnapshot.title !== lastSaved.title ||
    currentSnapshot.slug !== lastSaved.slug ||
    currentSnapshot.excerpt !== lastSaved.excerpt ||
    currentSnapshot.content !== lastSaved.content ||
    currentSnapshot.published !== lastSaved.published ||
    currentSnapshot.tagIds !== lastSaved.tagIds;

  const hasTitle = currentSnapshot.title.length > 0;
  const hasBody = hasDocumentText(contentJson) || hasText(content);

  // Drafts can save with title-only or body-only; block only when both are empty
  const canSave = hasTitle || hasBody;
  // Publishing still requires a real title and body
  const canPublish = hasTitle && hasBody;

  // Latch pause on the rising edge of a huge wipe so we can resume after
  // continued editing even while content is still much shorter than lastSaved.
  const [autoSavePaused, setAutoSavePaused] = useState(false);
  const pauseBaselineLenRef = useRef<number | null>(null);
  const wasHugeDeletionRef = useRef(false);

  useEffect(() => {
    const huge = isHugeContentDeletion(lastSaved.content, content);
    const currentLen = plainTextLength(content);

    if (autoSavePaused) {
      const baseline = pauseBaselineLenRef.current ?? 0;
      // Deeper wipe while paused — reset the "kept typing" baseline
      if (currentLen < baseline) {
        pauseBaselineLenRef.current = currentLen;
      }
      const effectiveBaseline = pauseBaselineLenRef.current ?? currentLen;
      const continuedEditing =
        currentLen >= effectiveBaseline + AUTO_SAVE_RESUME_CHARS;

      if (!huge || continuedEditing) {
        pauseBaselineLenRef.current = null;
        setAutoSavePaused(false);
        // Keep wasHuge true after a typed resume so we don't immediately re-latch
        // while content is still short vs lastSaved; clear when huge goes false.
        wasHugeDeletionRef.current = huge;
        return;
      }
    } else if (huge && !wasHugeDeletionRef.current) {
      pauseBaselineLenRef.current = currentLen;
      setAutoSavePaused(true);
    }

    wasHugeDeletionRef.current = huge;
  }, [content, lastSaved.content, autoSavePaused]);

  const canAutoSave = canSave && !autoSavePaused;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const doSave = useCallback(
    async (publish?: boolean) => {
      if (savingRef.current) return;
      if (publish === true && !canPublish) return;
      if (publish === undefined && !canSave) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      savingRef.current = true;
      setSavePhase("saving");

      const nextPublished = publish !== undefined ? publish : published;
      const slugToSave =
        effectiveSlug.trim() ||
        slugify(title) ||
        `draft-${Date.now()}`;
      const payload = {
        title: title.trim(),
        slug: slugToSave,
        excerpt: excerpt.trim() || undefined,
        content: content || "<p></p>",
        contentJson,
        published: nextPublished,
        tagIds: selectedTagIds,
      };

      try {
        if (currentPostId) {
          const res = await fetch(`/api/posts/${currentPostId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            throw new Error(json?.error ?? "Save failed");
          }
        } else {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            throw new Error(json?.error ?? "Create failed");
          }
          const json = await res.json();
          setCurrentPostId(json.data.id);
        }

        if (publish !== undefined) {
          setPublished(publish);
        }

        if (!slugManuallyEdited && slugToSave !== slug) {
          setSlug(slugToSave);
        }

        setLastSaved(
          makeSnapshot({
            title: payload.title,
            slug: payload.slug,
            excerpt: payload.excerpt || "",
            content: payload.content,
            published: nextPublished,
            tagIds: selectedTagIds,
          })
        );
        pauseBaselineLenRef.current = null;
        wasHugeDeletionRef.current = false;
        setAutoSavePaused(false);

        setSavePhase("saved");
        setTimeout(() => {
          setSavePhase((prev) => (prev === "saved" ? "idle" : prev));
        }, 2000);
      } catch (err) {
        console.error("Save failed:", err);
        setSavePhase("idle");
        toast.error(err instanceof Error ? err.message : "Failed to save. Please try again.");
      } finally {
        savingRef.current = false;
      }
    },
    [
      canSave,
      canPublish,
      title,
      slug,
      effectiveSlug,
      excerpt,
      content,
      published,
      selectedTagIds,
      currentPostId,
      slugManuallyEdited,
      contentJson,
    ]
  );

  // Auto-save drafts (debounced 3s) — skipped after large content deletions
  useEffect(() => {
    if (published || !isDirty || !canAutoSave || savingRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void doSave();
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, published, canAutoSave, doSave]);

  // Ctrl/Cmd+S → save (works from editor, title, settings, etc.)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (!canSave || savingRef.current) return;
      void doSave();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canSave, doSave]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && savePhase !== "saving") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, savePhase]);

  function handleBackClick() {
    if (isDirty && savePhase !== "saved") {
      toast.warning("You have unsaved changes", {
        description: published
          ? "Save your updates and leave, or stay on this page."
          : "Save as draft and leave, or stay on this page.",
        duration: Infinity,
        action: {
          label: published ? "Update & leave" : "Save & leave",
          onClick: () => {
            if (canSave) {
              void doSave().then(() => router.push("/admin"));
              return;
            }
            router.push("/admin");
          },
        },
        cancel: {
          label: "Stay",
          onClick: () => {},
        },
      });
      return;
    }
    router.push("/admin");
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function parseSource() {
    try {
      const next = markdownToDocument(source);
      setContentJson(next);
      setSourceError(null);
      return true;
    } catch {
      setSourceError("This Markdown is incomplete or contains unsupported syntax. Write and Preview are showing the last valid version.");
      return false;
    }
  }

  function switchMode(mode: "write" | "preview" | "source") {
    if (mode === "source") setSource(documentToMarkdown(contentJson));
    if (editorMode === "source" && mode !== "source" && !parseSource()) return;
    setEditorMode(mode);
  }

  // Derive display state for the indicator
  const showUnsaved = isDirty && savePhase !== "saving" && savePhase !== "saved";

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={handleBackClick}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to dashboard</span>
          <span className="sm:hidden">Back</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SaveStatusIndicator
            phase={savePhase}
            published={published}
            isDirty={showUnsaved}
            autoSavePaused={autoSavePaused && showUnsaved}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void doSave()}
            disabled={!canSave || savePhase === "saving"}
            title={
              canSave
                ? autoSavePaused
                  ? "Large deletion detected — save manually, or keep typing to resume auto-save"
                  : published
                    ? "Save changes to the live post"
                    : "Save draft"
                : "Add a title or some body text before saving"
            }
          >
            <Save className="size-4" />
            <span className="hidden sm:inline">
              {published ? "Update" : "Save Draft"}
            </span>
          </Button>
          {!published ? (
            <Button
              size="sm"
              onClick={() => void doSave(true)}
              disabled={!canPublish || savePhase === "saving"}
              title={
                canPublish
                  ? "Publish post"
                  : "Add a title and body before publishing"
              }
            >
              <Send className="size-4" />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          ) : (
            <>
              <Link
                href={`/blog/${effectiveSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                title="View published post"
              >
                <Eye className="size-4" />
                View
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void doSave(false)}
                disabled={savePhase === "saving"}
              >
                Unpublish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_300px]">
        {/* Editor */}
         <div className="min-w-0">
           <div className="mb-3 flex items-center justify-end gap-1 border-b border-border pb-2">
             {(["write", "preview", "source"] as const).map((mode) => (
               <Button key={mode} type="button" size="sm" variant={editorMode === mode ? "secondary" : "ghost"} onClick={() => switchMode(mode)}>
                 {mode === "write" ? "Write" : mode === "preview" ? "Preview" : "Markdown"}
               </Button>
             ))}
           </div>
           <Input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3 h-auto rounded-none border-0 bg-transparent px-0 py-1 font-serif text-2xl font-bold leading-tight tracking-tight text-ink-primary shadow-none placeholder:text-muted-foreground/50 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent sm:mb-4 sm:text-3xl md:text-3xl"
          />
          {/* Keep Write mounted so Markdown paste syncs into TipTap without a remount wipe. */}
          <div className={cn(editorMode !== "write" && "hidden")}>
            <PostEditor
              initialContent={initialContent}
              initialContentJson={initialContentJson}
              document={contentJson}
              onChange={setContent}
              onDocumentChange={setContentJson}
            />
          </div>
          {editorMode === "preview" ? (
            <div className="rounded-lg border border-border bg-card px-3 py-3 sm:px-5 sm:py-4">
              <TiptapContent document={contentJson} />
            </div>
          ) : null}
          {editorMode === "source" ? (
            <div className="space-y-2">
              <Textarea
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  // Keep the visual editor synchronized with every valid source edit.
                  // Invalid intermediate Markdown does not destroy the last valid document.
                  try {
                    const next = markdownToDocument(event.target.value);
                    setContentJson(next);
                    setSourceError(null);
                  } catch {
                    setSourceError("The source has a temporary syntax error. Fix it before switching tabs.");
                  }
                }}
                className="min-h-[400px] rounded-lg border-border bg-card font-mono text-sm"
                placeholder="# Paste or write Markdown here…"
                spellCheck={false}
              />
              <div className="flex items-center justify-between gap-3 text-xs">
                <p className={sourceError ? "text-amber-600" : "text-ink-tertiary"}>
                  {sourceError ?? "Paste AI Markdown here — it syncs into Write and Preview."}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => void parseSource()}>
                  Apply source
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Meta sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Post settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug" className="mb-1 block text-xs">
                  Slug
                </Label>
                <Input
                  id="slug"
                  type="text"
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="post-url-slug"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="excerpt" className="mb-1 block text-xs">
                  Excerpt
                </Label>
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description…"
                  className="text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="published" className="text-xs">
                  Published
                </Label>
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={(checked) => {
                    void doSave(checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Badge variant={selected ? "default" : "secondary"}>
                        {selected && <X className="size-3" />}
                        {tag.name}
                      </Badge>
                    </button>
                  );
                })}
                {availableTags.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No tags yet. Create some via the API.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SaveStatusIndicator({
  phase,
  published,
  isDirty,
  autoSavePaused,
}: {
  phase: SavePhase;
  published: boolean;
  isDirty: boolean;
  autoSavePaused?: boolean;
}) {
  if (phase === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-yellow-500" />
        Saving…
      </span>
    );
  }

  if (phase === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-green-500" />
        {published ? "Updated" : "Saved"}
      </span>
    );
  }

  if (isDirty && autoSavePaused) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        title="Auto-save paused after a large deletion. Keep typing to resume, or use Save Draft."
      >
        <span className="size-2 rounded-full bg-orange-500" />
        Auto-save paused
      </span>
    );
  }

  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-orange-500" />
        Unsaved changes
      </span>
    );
  }

  if (published) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-blue-500" />
        Published
      </span>
    );
  }

  return null;
}
