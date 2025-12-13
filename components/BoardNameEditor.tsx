"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialName: string | null;
  placeholder?: string;
  align?: "left" | "center";
};

const DEBOUNCE_MS = 400;

export function BoardNameEditor({
  boardId,
  initialName,
  placeholder = "Untitled board",
  align = "left",
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialName ?? "");
  }, [boardId, initialName]);

  const broadcastLocal = (next: string) => {
    const eventName = `board-name-local-${boardId}`;
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
      const trimmed = value.trim();
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ name: trimmed || null })
        .eq("id", boardId);

      if (updateError) {
        console.error("Failed to update name", updateError.message);
        setError(updateError.message);
      } else {
        setError(null);
      }
      setSaving(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, supabase, value]);

  const containerAlignment =
    align === "center"
      ? "sm:flex-col sm:items-center"
      : "sm:flex-row sm:items-center";
  const helperAlignment = align === "center" ? "justify-center" : "";
  const inputAlignment = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`mt-2 flex flex-col gap-2 ${containerAlignment}`}>
      <input
        type="text"
        name="name"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          broadcastLocal(e.target.value);
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition-all duration-150 placeholder:text-black/50 hover:-translate-y-0.5 hover:border-black/40 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] active:scale-[0.99] ${inputAlignment}`}
      />
      <div className={`flex items-center gap-2 text-xs text-black ${helperAlignment}`}>
        {saving ? <span>Saving…</span> : <span>Saved</span>}
        {error ? <span className="text-red-600">({error})</span> : null}
      </div>
    </div>
  );
}
