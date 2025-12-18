"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialValue: string | null;
  placeholder?: string;
  align?: "left" | "center";
  initialPositions?: unknown;
};

const DEBOUNCE_MS = 400;

export function BoardSubtitleEditor({
  boardId,
  initialValue,
  placeholder = "Subtitle",
  align = "left",
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? "");
  }, [boardId, initialValue]);


  const broadcastLocal = (next: string) => {
    const eventName = `board-subtitle-local-${boardId}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!boardId) return;

    const handler = setTimeout(async () => {
      setSaving(true);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      const trimmed = value.trim();
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ scoreboard_subtitle: trimmed || null })
        .eq("id", boardId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setError(null);
      }
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, supabase, value]);


  const inputAlignment = align === "center" ? "text-center" : "text-left";

  return (
    <div className="space-y-2">
      <div className="relative flex items-center rounded-md border border-black/20 bg-white px-2 sm:px-3 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus-within:border-black focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] w-full">
        <input
          type="text"
          name="subtitle"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            broadcastLocal(e.target.value);
          }}
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent text-sm text-black outline-none placeholder:text-black/50 ${inputAlignment}`}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>({error})</span>
        </div>
      )}
    </div>
  );
}

