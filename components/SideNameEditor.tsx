"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialValue: string | null;
  column: "a_side" | "b_side";
  placeholder?: string;
};

const DEBOUNCE_MS = 400;

export function SideNameEditor({ boardId, initialValue, column, placeholder }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? "");
  }, [boardId, initialValue]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!boardId) return;

    const handler = setTimeout(async () => {
      setSaving(true);
      const trimmed = value.trim();
      const fallback = placeholder || (column === "a_side" ? "A Side" : "B Side");
      const nextValue = trimmed || fallback;
      const updatePayload: Record<string, string> = {
        [column]: nextValue,
      };
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update(updatePayload)
        .eq("id", boardId);

      if (updateError) {
        console.error("Failed to update side", updateError.message);
        setError(updateError.message);
      } else {
        setError(null);
      }
      setSaving(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, column, placeholder, supabase, value]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-white"
      />
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {saving ? <span>Saving…</span> : <span>Saved</span>}
        {error ? <span className="text-red-600 dark:text-red-300">({error})</span> : null}
      </div>
    </div>
  );
}
