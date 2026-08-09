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
  // Keep image data through the close animation — clearing it on close
  // unmounts the <img> mid fade/zoom and causes a visible blink.
  const [image, setImage] = useState<LighthouseImage | null>(null);
  const [open, setOpen] = useState(false);

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

      setImage({
        src: img.currentSrc || img.src,
        alt: img.alt || caption || "Image",
        caption,
      });
      setOpen(true);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/80 supports-backdrop-filter:backdrop-blur-sm" />
          <DialogPrimitive.Popup
            data-slot="dialog-content"
            className={cn(
              "fixed top-1/2 left-1/2 z-50 flex w-[min(100vw-1rem,56rem)] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <DialogTitle className="sr-only">
              {image?.alt || "Image preview"}
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

            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  className="max-h-[min(82dvh,82vh)] w-auto max-w-full rounded-lg object-contain shadow-(--shadow-xl)"
                />
                {image.caption ? (
                  <p className="mt-3 max-w-prose px-3 text-center text-sm text-white/90">
                    {image.caption}
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
