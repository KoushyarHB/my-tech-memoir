"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LighthouseImage = {
  src: string;
  alt: string;
  caption: string;
};

type LighthouseProps = {
  html: string;
  className?: string;
};

/**
 * Renders post HTML and opens images in a full-viewport lightbox ("Lighthouse").
 * Keeps stored TipTap markup unchanged — enhancement is client-side only.
 */
export function Lighthouse({ html, className }: LighthouseProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<LighthouseImage | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const img = target.closest("img");
      if (!img || !root?.contains(img)) return;

      // Ignore images inside links — let navigation win
      if (img.closest("a")) return;

      event.preventDefault();
      const figure = img.closest("figure");
      const caption =
        figure?.querySelector("figcaption")?.textContent?.trim() ?? "";

      setActive({
        src: img.currentSrc || img.src,
        alt: img.alt || caption || "Image",
        caption,
      });
    }

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [html]);

  return (
    <>
      <div
        ref={rootRef}
        className={cn("prose-memoir lighthouse-content", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/80 duration-0 supports-backdrop-filter:backdrop-blur-sm data-open:animate-none data-closed:animate-none" />
          <DialogPrimitive.Popup
            data-slot="dialog-content"
            className="fixed top-1/2 left-1/2 z-50 flex w-[min(100vw-1rem,56rem)] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none duration-0 data-open:animate-none data-closed:animate-none"
          >
            <DialogTitle className="sr-only">
              {active?.alt || "Image preview"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Enlarged image view. Press Escape or tap close to dismiss.
            </DialogDescription>

            <DialogClose
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-1 right-0 z-10 border border-border/50 bg-(--bg-elevated)/95 shadow-(--shadow-md) sm:right-2 sm:top-2"
                />
              }
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            {active ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.src}
                  alt={active.alt}
                  className="max-h-[min(82dvh,82vh)] w-auto max-w-full rounded-lg object-contain shadow-(--shadow-xl)"
                />
                {active.caption ? (
                  <p className="mt-3 max-w-prose px-3 text-center text-sm text-white/90">
                    {active.caption}
                  </p>
                ) : null}
              </>
            ) : null}
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
