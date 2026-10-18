"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon, MinusIcon } from "lucide-react"

function Checkbox({
  className,
  indeterminate,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      indeterminate={indeterminate}
      className={cn(
        "peer relative flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border border-(--border-hover) bg-transparent transition-colors outline-none",
        "hover:border-(--border-focus)",
        "data-checked:border-(--accent) data-checked:bg-(--accent) data-checked:text-(--ink-inverse)",
        "data-indeterminate:border-(--accent) data-indeterminate:bg-(--accent) data-indeterminate:text-(--ink-inverse)",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "focus-visible:border-(--border-focus) focus-visible:ring-0",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        {indeterminate ? (
          <MinusIcon className="size-2.5" strokeWidth={3} />
        ) : (
          <CheckIcon className="size-2.5" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
