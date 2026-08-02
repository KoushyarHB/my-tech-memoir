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
import { cn } from "@/lib/utils";

type Tag = { id: string; name: string; slug: string };

type PostEditorPageProps = {
  postId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
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
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

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
    content: input.content,
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
  initialPublished = false,
  initialTagIds = [],
  availableTags,
}: PostEditorPageProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent);
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

  const canSave =
    currentSnapshot.title.length > 0 &&
    currentSnapshot.slug.length > 0 &&
    hasText(content);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const doSave = useCallback(
    async (publish?: boolean) => {
      if (savingRef.current) return;
      if (!canSave && publish === undefined) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      savingRef.current = true;
      setSavePhase("saving");

      const nextPublished = publish !== undefined ? publish : published;
      const payload = {
        title: title.trim(),
        slug: effectiveSlug.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
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
          if (!res.ok) throw new Error("Save failed");
        } else {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Create failed");
          const json = await res.json();
          setCurrentPostId(json.data.id);
        }

        if (publish !== undefined) {
          setPublished(publish);
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

        setSavePhase("saved");
        setTimeout(() => {
          setSavePhase((prev) => (prev === "saved" ? "idle" : prev));
        }, 2000);
      } catch (err) {
        console.error("Save failed:", err);
        setSavePhase("idle");
        alert("Failed to save. Please try again.");
      } finally {
        savingRef.current = false;
      }
    },
    [canSave, title, effectiveSlug, excerpt, content, published, selectedTagIds, currentPostId]
  );

  // Auto-save drafts (debounced 3s)
  useEffect(() => {
    if (published || !isDirty || !canSave || savingRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void doSave();
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, published, canSave, doSave]);

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
      const proceed = window.confirm(
        "You have unsaved changes.\n\nClick OK to save as draft and leave, or Cancel to stay."
      );
      if (proceed && canSave) {
        void doSave().then(() => router.push("/admin"));
        return;
      }
      if (!proceed) return;
    }
    router.push("/admin");
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  // Derive display state for the indicator
  const showUnsaved = isDirty && savePhase !== "saving" && savePhase !== "saved";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBackClick}>
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator
            phase={savePhase}
            published={published}
            isDirty={showUnsaved}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void doSave()}
            disabled={!canSave || savePhase === "saving"}
            title={
              canSave
                ? "Save draft"
                : "Add a title and some body text before saving"
            }
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          {!published ? (
            <Button
              size="sm"
              onClick={() => void doSave(true)}
              disabled={!canSave || savePhase === "saving"}
            >
              <Send className="size-4" />
              Publish
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Editor */}
        <div>
          <Input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 border-none px-0 font-serif text-2xl font-bold shadow-none focus-visible:ring-0"
          />
          <PostEditor
            initialContent={initialContent}
            onChange={setContent}
          />
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
}: {
  phase: SavePhase;
  published: boolean;
  isDirty: boolean;
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
        Saved
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
