"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostEditor } from "./post-editor";
import { Save, Send, ArrowLeft, Plus, X } from "lucide-react";
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

type SaveState = "idle" | "unsaved" | "saving" | "saved";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [currentPostId, setCurrentPostId] = useState(postId);

  // Compute slug from title during render (no effect needed)
  const effectiveSlug = slugManuallyEdited ? slug : slugify(title);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSave = title.trim().length > 0 && slug.trim().length > 0 && content.trim().length > 0;

  const doSave = useCallback(
    async (publish?: boolean) => {
      if (!canSave && !publish) return;
      setSaveState("saving");

      const payload = {
        title: title.trim(),
        slug: effectiveSlug.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        published: publish !== undefined ? publish : published,
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
          if (publish !== undefined) setPublished(publish);
        } else {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Create failed");
          const json = await res.json();
          setCurrentPostId(json.data.id);
          if (publish !== undefined) setPublished(publish);
        }
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch (err) {
        console.error("Save failed:", err);
        setSaveState("idle");
        alert("Failed to save. Please try again.");
      }
    },
    [canSave, title, effectiveSlug, excerpt, content, published, selectedTagIds, currentPostId]
  );

  // Auto-save for drafts (debounced 3s)
  useEffect(() => {
    if (published || !canSave) return;

    if (saveState === "saved") return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (title || content) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaveState("unsaved");
      saveTimerRef.current = setTimeout(() => {
        doSave();
      }, 3000);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, effectiveSlug, excerpt, content, selectedTagIds, published, canSave, doSave, saveState]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator state={saveState} published={published} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => doSave()}
            disabled={!canSave || saveState === "saving"}
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          {!published ? (
            <Button
              size="sm"
              onClick={() => doSave(true)}
              disabled={!canSave || saveState === "saving"}
            >
              <Send className="size-4" />
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => doSave(false)}
              disabled={saveState === "saving"}
            >
              Unpublish
            </Button>
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
          <PostEditor initialContent={content} onChange={setContent} />
        </div>

        {/* Meta sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Post settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug" className="mb-1 block text-xs">Slug</Label>
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
                <Label htmlFor="excerpt" className="mb-1 block text-xs">Excerpt</Label>
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
                <Label htmlFor="published" className="text-xs">Published</Label>
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={(checked) => {
                    setPublished(checked);
                    doSave(checked);
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
  state,
  published,
}: {
  state: SaveState;
  published: boolean;
}) {
  if (state === "saving") {
    return (
      <span className="text-xs text-muted-foreground">
        <span className="size-2 inline-block animate-pulse rounded-full bg-yellow-500" />
        Saving…
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span className="text-xs text-muted-foreground">
        <span className="size-2 inline-block rounded-full bg-green-500" />
        Saved ✓
      </span>
    );
  }

  if (state === "unsaved" && !published) {
    return (
      <span className="text-xs text-muted-foreground">
        <span className="size-2 inline-block rounded-full bg-orange-500" />
        Unsaved changes
      </span>
    );
  }

  if (published) {
    return (
      <span className="text-xs text-muted-foreground">
        <span className="size-2 inline-block rounded-full bg-blue-500" />
        Published
      </span>
    );
  }

  return null;
}
