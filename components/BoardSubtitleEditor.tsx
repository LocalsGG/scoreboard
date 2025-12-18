"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ElementPositions } from "@/lib/types";

type Props = {
  boardId: string;
  initialValue: string | null;
  placeholder?: string;
  align?: "left" | "center";
  initialPositions?: ElementPositions | null;
};

const DEBOUNCE_MS = 400;
const DEFAULT_FONT_SIZE = 48;

export function BoardSubtitleEditor({
  boardId,
  initialValue,
  placeholder = "Subtitle",
  align = "left",
  initialPositions,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);
  
  // Size state
  const initialFontSize = initialPositions?.subtitle?.fontSize ?? DEFAULT_FONT_SIZE;
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [fontSizeInput, setFontSizeInput] = useState<string>(String(initialFontSize));
  const [savingSize, setSavingSize] = useState(false);
  const [errorSize, setErrorSize] = useState<string | null>(null);
  const isFirstRunSize = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? "");
  }, [boardId, initialValue]);

  useEffect(() => {
    const currentFontSize = initialPositions?.subtitle?.fontSize ?? DEFAULT_FONT_SIZE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSize(currentFontSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSizeInput(String(currentFontSize));
  }, [boardId, initialPositions]);

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

  // Handle size changes
  useEffect(() => {
    if (isFirstRunSize.current) {
      isFirstRunSize.current = false;
      return;
    }
    if (!boardId) return;

    const handler = setTimeout(async () => {
      setSavingSize(true);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      
      const { data: boardData } = await supabase
        .from("scoreboards")
        .select("element_positions")
        .eq("id", boardId)
        .single();

      const currentPositions: ElementPositions = boardData?.element_positions || {
        title: { x: 720, y: 200, fontSize: 72 },
        subtitle: { x: 720, y: 600, fontSize: DEFAULT_FONT_SIZE },
        logo: { x: 720, y: 405, width: 64, height: 64 },
        a_side: { x: 100, y: 310, fontSize: 60 },
        b_side: { x: 1200, y: 310, fontSize: 60 },
        a_score: { x: 540, y: 400, fontSize: 110 },
        b_score: { x: 910, y: 400, fontSize: 110 },
      };

      const subtitlePosition = currentPositions.subtitle || { x: 720, y: 600, fontSize: DEFAULT_FONT_SIZE };
      const updatedPositions: ElementPositions = {
        ...currentPositions,
        subtitle: { 
          x: subtitlePosition.x ?? 720, 
          y: subtitlePosition.y ?? 600, 
          fontSize: fontSize 
        },
      };

      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ element_positions: updatedPositions })
        .eq("id", boardId);

      if (updateError) {
        setErrorSize(updateError.message);
      } else {
        setErrorSize(null);
      }
      setSavingSize(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, fontSize, supabase]);

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
        <input
          type="number"
          value={fontSizeInput}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Allow free typing - update input value immediately
            setFontSizeInput(inputValue);
            // Only update fontSize if it's a valid number
            const value = parseInt(inputValue, 10);
            if (!isNaN(value)) {
              setFontSize(value);
            }
          }}
          onBlur={(e) => {
            // Validate on blur - clamp to min/max
            const value = parseInt(e.target.value, 10);
            let finalValue = value;
            if (isNaN(value) || value < 12) {
              finalValue = 12;
            } else if (value > 300) {
              finalValue = 300;
            }
            setFontSize(finalValue);
            setFontSizeInput(String(finalValue));
          }}
          min={12}
          max={300}
          disabled={savingSize}
          className="w-14 sm:w-16 bg-transparent px-1 sm:px-2 py-0 text-xs text-black outline-none border-l border-black/20 pl-2 ml-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>({error})</span>
        </div>
      )}
      {errorSize && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>({errorSize})</span>
        </div>
      )}
    </div>
  );
}

