"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialName: string | null;
  initialTitleVisible?: boolean | null;
  placeholder?: string;
  align?: "left" | "center";
  showLabel?: boolean;
  isAuthenticated?: boolean;
};

const DEBOUNCE_MS = 400;

export function BoardNameEditor({
  boardId,
  initialName,
  initialTitleVisible = true,
  placeholder = "Scoreboard title",
  align = "left",
  showLabel = false,
  isAuthenticated = false,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(() => initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [titleVisible, setTitleVisible] = useState(() => initialTitleVisible ?? true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const isFirstRun = useRef(true);


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
      if (!isAuthenticated) {
        setError(null);
        return;
      }
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      const trimmed = value.trim();
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ name: trimmed || null })
        .eq("id", boardId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setError(null);
      }
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, supabase, value]);

  const containerAlignment =
    align === "center"
      ? "sm:flex-col sm:items-center"
      : "sm:flex-row sm:items-center";
  const helperAlignment = align === "center" ? "justify-center" : "";
  const inputAlignment = align === "center" ? "text-center" : "text-left";

  const toggleTitleVisibility = async () => {
    const newVisible = !titleVisible;
    setTitleVisible(newVisible);
    setSavingVisibility(true);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

    // Broadcast to preview component
    const eventName = `title-visibility-${boardId}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: newVisible }));

    if (!isAuthenticated) {
      setSavingVisibility(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
      return;
    }

    const { error: updateError } = await supabase
      .from("scoreboards")
      .update({ title_visible: newVisible })
      .eq("id", boardId);

    if (updateError) {
      console.error("Failed to update title visibility:", updateError);
      setTitleVisible(titleVisible);
    }
    setSavingVisibility(false);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
  };


  return (
    <div className={`mt-2 flex flex-col gap-2 ${containerAlignment}`}>
      {showLabel && (
        <button
          type="button"
          onClick={toggleTitleVisibility}
          disabled={savingVisibility}
          className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
          title={titleVisible ? "Hide title" : "Show title"}
        >
          <span>Scoreboard name</span>
          {titleVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 0010 3c-1.38 0-2.68.28-3.87.8L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.374l1.091 1.092a4 4 0 00-5.557-5.557z"
                clipRule="evenodd"
              />
              <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 4.02L6.5 7.681A4 4 0 0010.748 13.93z" />
            </svg>
          )}
        </button>
      )}
      <div className="relative flex items-center rounded-md border border-black/20 bg-white px-2 sm:px-3 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus-within:border-black focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] w-full">
        <input
          type="text"
          name="name"
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
        <div className={`flex items-center gap-2 text-xs text-red-600 ${helperAlignment}`}>
          <span>({error})</span>
        </div>
      )}
    </div>
  );
}
