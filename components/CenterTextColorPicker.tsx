"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialColor: string | null;
};

const DEBOUNCE_MS = 400;
const DEFAULT_COLOR = "#f8fafc"; // Current white color

export function CenterTextColorPicker({ boardId, initialColor }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedColor, setSelectedColor] = useState<string>(
    initialColor || DEFAULT_COLOR
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedColor(initialColor || DEFAULT_COLOR);
  }, [boardId, initialColor]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!boardId) return;

    // Broadcast local change immediately for preview
    const eventName = `center-text-color-local-${boardId}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: selectedColor }));

    const handler = setTimeout(async () => {
      setSaving(true);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ center_text_color: selectedColor })
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
  }, [boardId, supabase, selectedColor]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
        Scoreboard Text Color
      </p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-lg border-2 border-black/20 bg-white transition-all duration-150 hover:border-black/40 hover:shadow-md active:scale-95"
            aria-label="Select scoreboard text color"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => {
              const value = e.target.value;
              // Allow typing hex colors
              if (/^#[0-9A-Fa-f]{0,6}$/i.test(value)) {
                setSelectedColor(value);
              }
            }}
            onBlur={(e) => {
              // On blur, ensure we have a valid hex color, otherwise reset
              const value = e.target.value.trim();
              if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
                setSelectedColor(selectedColor);
              }
            }}
            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-semibold text-black shadow-inner shadow-black/5"
            placeholder="#f8fafc"
            maxLength={7}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-black">
          {error ? <span className="text-red-600">({error})</span> : null}
        </div>
      </div>
    </div>
  );
}
