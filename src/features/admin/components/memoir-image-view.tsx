"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemoirImageAlign } from "./memoir-image";

const ALIGN_OPTIONS: {
  value: MemoirImageAlign;
  label: string;
  icon: typeof AlignCenter;
}[] = [
  { value: "left", label: "Align left", icon: AlignLeft },
  { value: "center", label: "Align center", icon: AlignCenter },
  { value: "right", label: "Align right", icon: AlignRight },
  {
    value: "wrap-left",
    label: "Float left — text wraps on the right",
    icon: PanelLeft,
  },
  {
    value: "wrap-right",
    label: "Float right — text wraps on the left",
    icon: PanelRight,
  },
];

const WIDTH_PRESETS = [50, 75, 100] as const;

function clampWidth(value: number) {
  return Math.min(100, Math.max(25, Math.round(value)));
}

export function MemoirImageView(props: ReactNodeViewProps) {
  const { node, updateAttributes, selected, editor } = props;
  const width = clampWidth(Number(node.attrs.width ?? 100));
  const align = (node.attrs.align as MemoirImageAlign) || "center";
  const caption =
    typeof node.attrs.caption === "string" ? node.attrs.caption : "";
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string | null) ?? "";

  const figureRef = useRef<HTMLElement | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(width);
  const [dragging, setDragging] = useState(false);
  const captionDraft = useRef(caption);
  const onResizeEndRef = useRef<() => void>(() => undefined);

  const onResizeMove = useCallback(
    (event: PointerEvent) => {
      const parent = figureRef.current?.parentElement;
      if (!parent) return;
      const parentWidth = parent.getBoundingClientRect().width;
      if (parentWidth <= 0) return;

      const delta = event.clientX - dragStartX.current;
      const next = clampWidth(
        dragStartWidth.current + (delta / parentWidth) * 100
      );
      updateAttributes({ width: next });
    },
    [updateAttributes]
  );

  const onResizeEnd = useCallback(() => {
    setDragging(false);
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeEndRef.current);
  }, [onResizeMove]);

  useEffect(() => {
    onResizeEndRef.current = onResizeEnd;
  }, [onResizeEnd]);

  function onResizeStart(event: React.PointerEvent) {
    if (!editor.isEditable) return;
    event.preventDefault();
    event.stopPropagation();
    figureRef.current =
      (event.currentTarget as HTMLElement).closest("figure") ?? null;
    dragStartX.current = event.clientX;
    dragStartWidth.current = width;
    setDragging(true);
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeEnd);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onResizeMove);
      window.removeEventListener("pointerup", onResizeEnd);
    };
  }, [onResizeMove, onResizeEnd]);

  function commitCaption() {
    const next = captionDraft.current.trim();
    if (next !== caption) {
      updateAttributes({ caption: next });
    }
  }

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "memoir-figure__chrome",
        selected && "memoir-figure__chrome--selected",
        dragging && "memoir-figure__chrome--dragging"
      )}
      data-drag-handle
    >
      {selected && editor.isEditable && (
        <div
          className="memoir-figure__toolbar"
          contentEditable={false}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="memoir-figure__toolbar-group">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                className={cn(
                  "memoir-figure__tool",
                  align === option.value && "memoir-figure__tool--active"
                )}
                onClick={() => updateAttributes({ align: option.value })}
              >
                <option.icon className="size-3.5" />
              </button>
            ))}
          </div>
          <span className="memoir-figure__width">{width}%</span>
          <div className="memoir-figure__width-presets">
            {WIDTH_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                title={`Width ${preset}%`}
                aria-label={`Set image width to ${preset}%`}
                className={cn(
                  "memoir-figure__width-preset",
                  width === preset && "memoir-figure__width-preset--active"
                )}
                onClick={() => updateAttributes({ width: preset })}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="memoir-figure__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          title={(node.attrs.title as string | null) ?? undefined}
          draggable={false}
        />
        {selected && editor.isEditable && (
          <span
            className="memoir-figure__resize"
            contentEditable={false}
            onPointerDown={onResizeStart}
            title="Drag to resize"
            aria-label="Resize image"
            role="slider"
            aria-valuemin={25}
            aria-valuemax={100}
            aria-valuenow={width}
          />
        )}
      </div>

      {editor.isEditable ? (
        selected || caption ? (
          <div className="memoir-figure__caption" contentEditable={false}>
            <input
              type="text"
              key={caption}
              defaultValue={caption}
              placeholder="Add a caption…"
              className="memoir-figure__caption-input"
              onChange={(e) => {
                captionDraft.current = e.target.value;
              }}
              onBlur={commitCaption}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitCaption();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        ) : null
      ) : caption ? (
        <div className="memoir-figure__caption">{caption}</div>
      ) : null}
    </NodeViewWrapper>
  );
}
