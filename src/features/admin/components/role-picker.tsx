"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  type UserRole,
} from "@/features/admin/types/roles";
import { cn } from "@/lib/utils";

const ROLE_DOT: Record<UserRole, string> = {
  USER: "bg-ink-tertiary/60",
  EDITOR: "bg-blue-500",
  ADMIN: "bg-amber-500",
};

type RolePickerProps = {
  value: UserRole;
  disabled?: boolean;
  onChange: (role: UserRole) => void;
};

export function RolePicker({ value, disabled, onChange }: RolePickerProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={disabled}
        className={cn(
          "group/role-picker inline-flex min-w-30 items-center justify-between gap-2 rounded-lg border border-border bg-(--bg-elevated) px-2.5 py-1.5 text-xs font-medium text-ink-primary transition-colors",
          "hover:border-(--border-hover) hover:bg-(--bg-muted)/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus)/30",
          "data-popup-open:border-(--border-hover) data-popup-open:bg-(--bg-muted)/50",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span className="flex items-center gap-2">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", ROLE_DOT[value])}
            aria-hidden
          />
          {ROLE_LABELS[value]}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-ink-tertiary transition-transform group-data-popup-open/role-picker:rotate-180" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          className="isolate z-50"
        >
          <Menu.Popup
            className={cn(
              "min-w-40 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-(--bg-elevated) p-1 shadow-(--shadow-lg) outline-none",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            )}
          >
            <Menu.RadioGroup
              value={value}
              onValueChange={(next) => {
                if (typeof next !== "string" || next === value) return;
                onChange(next as UserRole);
              }}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <Menu.RadioItem
                  key={role}
                  value={role}
                  closeOnClick
                  label={ROLE_LABELS[role]}
                  className={cn(
                    "flex w-full cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none select-none transition-colors",
                    "text-ink-secondary data-highlighted:bg-(--bg-muted)/70 data-highlighted:text-ink-primary",
                    "data-checked:bg-(--bg-muted) data-checked:font-medium data-checked:text-ink-primary",
                    "data-disabled:pointer-events-none data-disabled:opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      ROLE_DOT[role]
                    )}
                    aria-hidden
                  />
                  <span className="flex-1">{ROLE_LABELS[role]}</span>
                  <Menu.RadioItemIndicator className="flex size-3.5 shrink-0 items-center justify-center text-ink-tertiary">
                    <Check className="size-3.5" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
