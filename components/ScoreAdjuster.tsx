"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  column: "a_score" | "b_score";
  initialValue: number | null;
};

export function ScoreAdjuster({ boardId, column, initialValue }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<number>(initialValue ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? 0);
  }, [boardId, initialValue]);

  const eventName = `score-local-${boardId}-${column}`;
  const broadcastLocal = (next: number) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
  };

  const adjust = async (delta: number) => {
    if (!boardId || saving) return;
    const previous = value;
    const next = Math.max(0, (value ?? 0) + delta);
    setValue(next);
    broadcastLocal(next);
    setSaving(true);
    const { error: updateError } = await supabase
      .from("scoreboards")
      .update({ [column]: next })
      .eq("id", boardId);

    if (updateError) {
      console.error("Failed to update score", updateError.message);
      setError(updateError.message);
      setValue(previous);
      broadcastLocal(previous);
    } else {
      setError(null);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-zinc-900/5 px-3 py-2 text-sm font-semibold text-black dark:bg-white/10 dark:text-white">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={saving}
          className="rounded-md border border-zinc-300 px-3 py-1 text-xs uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
        >
          -1
        </button>
        <span className="text-3xl font-black leading-none">{value}</span>
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={saving}
          className="rounded-md border border-zinc-300 px-3 py-1 text-xs uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
        >
          +1
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {saving ? <span>Saving…</span> : <span>Saved</span>}
        {error ? <span className="text-red-600 dark:text-red-300">({error})</span> : null}
      </div>
    </div>
  );
}
