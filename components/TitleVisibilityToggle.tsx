"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialVisible?: boolean;
};

export function TitleVisibilityToggle({ boardId, initialVisible = true }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [visible, setVisible] = useState(initialVisible);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVisible(initialVisible ?? true);
  }, [boardId, initialVisible]);

  const toggleVisibility = async () => {
    const newVisible = !visible;
    setVisible(newVisible);
    setSaving(true);

    // Broadcast to preview component
    const eventName = `title-visibility-${boardId}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: newVisible }));

    // Save to database
    const { error } = await supabase
      .from("scoreboards")
      .update({ title_visible: newVisible })
      .eq("id", boardId);

    if (error) {
      console.error("Failed to update title visibility:", error);
      // Revert on error
      setVisible(visible);
    }
    setSaving(false);
  };

  return (
    <button
      type="button"
      onClick={toggleVisibility}
      disabled={saving}
      className="flex items-center justify-center gap-2 rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      title={visible ? "Hide title" : "Show title"}
    >
      {visible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m0 0l2.438 2.435M6.228 6.228L12 12m-6.772-5.772L12 12"
          />
        </svg>
      )}
      <span className="text-xs">{visible ? "Title visible" : "Title hidden"}</span>
    </button>
  );
}

