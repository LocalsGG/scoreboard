"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  column: "a_score" | "b_score";
  initialValue: number | null;
  initialPositions?: unknown;
};

const DEBOUNCE_MS = 400;

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
    window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
    const { error: updateError } = await supabase
      .from("scoreboards")
      .update({ [column]: next })
      .eq("id", boardId);

    if (updateError) {
      setError(updateError.message);
      setValue(previous);
      broadcastLocal(previous);
    } else {
      setError(null);
    }
    setSaving(false);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
  };


  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between rounded-md border border-black/20 bg-white px-2 sm:px-3 py-2 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={saving}
          className="cursor-pointer rounded-md border border-black/20 px-2 sm:px-3 py-1 text-xs uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0"
        >
          -1
        </button>
        <span className="text-2xl sm:text-3xl font-black leading-none mx-1 sm:mx-2">{value}</span>
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={saving}
          className="cursor-pointer rounded-md border border-black/20 px-2 sm:px-3 py-1 text-xs uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0"
        >
          +1
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>({error})</span>
        </div>
      )}
    </div>
  );
}
