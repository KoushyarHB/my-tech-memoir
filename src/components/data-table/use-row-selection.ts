"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Selection state for a server-paginated table.
 *
 * Ids are kept as a set that survives page changes, so a moderator can select
 * across pages before acting. The UI is responsible for offering "select all on
 * this page" and for clearing after an action.
 */
export function useRowSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const toggle = useCallback((id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((ids: string[], on: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected]
  );

  /** True when every id is selected (and there is at least one). */
  const allSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selected.has(id)),
    [selected]
  );

  /** True when some but not all ids are selected. */
  const someSelected = useCallback(
    (ids: string[]) =>
      ids.some((id) => selected.has(id)) && !allSelected(ids),
    [selected, allSelected]
  );

  return useMemo(
    () => ({
      selected,
      selectedIds: Array.from(selected),
      count: selected.size,
      toggle,
      toggleMany,
      clear,
      isSelected,
      allSelected,
      someSelected,
    }),
    [
      selected,
      toggle,
      toggleMany,
      clear,
      isSelected,
      allSelected,
      someSelected,
    ]
  );
}
