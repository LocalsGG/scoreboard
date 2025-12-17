"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ElementPositions } from "@/lib/types";

type Props = {
  boardId: string;
  column: "a_score" | "b_score";
  initialValue: number | null;
  initialPositions?: ElementPositions | null;
};

const DEBOUNCE_MS = 400;
const DEFAULT_FONT_SIZE = 110;

export function ScoreAdjuster({ boardId, column, initialValue, initialPositions }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<number>(initialValue ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Size state
  const initialFontSize = initialPositions?.a_score?.fontSize ?? initialPositions?.b_score?.fontSize ?? DEFAULT_FONT_SIZE;
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [fontSizeInput, setFontSizeInput] = useState<string>(String(initialFontSize));
  const [savingSize, setSavingSize] = useState(false);
  const [errorSize, setErrorSize] = useState<string | null>(null);
  const isFirstRunSize = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? 0);
  }, [boardId, initialValue]);

  useEffect(() => {
    const currentFontSize = initialPositions?.a_score?.fontSize ?? initialPositions?.b_score?.fontSize ?? DEFAULT_FONT_SIZE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSize(currentFontSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSizeInput(String(currentFontSize));
  }, [boardId, initialPositions]);

  // Listen for size changes from the other side
  useEffect(() => {
    if (!boardId) return;

    const eventName = `score-size-changed-${boardId}`;
    const handleSizeChange = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") {
        setFontSize(detail);
        setFontSizeInput(String(detail));
      }
    };

    window.addEventListener(eventName, handleSizeChange);
    return () => {
      window.removeEventListener(eventName, handleSizeChange);
    };
  }, [boardId]);

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
        subtitle: { x: 720, y: 600, fontSize: 48 },
        logo: { x: 720, y: 405, width: 64, height: 64 },
        a_side: { x: 100, y: 310, fontSize: 60 },
        b_side: { x: 1200, y: 310, fontSize: 60 },
        a_score: { x: 540, y: 400, fontSize: DEFAULT_FONT_SIZE },
        b_score: { x: 910, y: 400, fontSize: DEFAULT_FONT_SIZE },
      };

      const updatedPositions: ElementPositions = {
        ...currentPositions,
        a_score: { ...currentPositions.a_score, fontSize: fontSize },
        b_score: { ...currentPositions.b_score, fontSize: fontSize },
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
      <div className="relative flex items-center rounded-md border border-black/20 bg-white px-2 py-1 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus-within:border-black focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.08)] w-full">
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
              // Broadcast to the other side in real-time
              const eventName = `score-size-changed-${boardId}`;
              window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
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
            // Broadcast final value to the other side
            const eventName = `score-size-changed-${boardId}`;
            window.dispatchEvent(new CustomEvent(eventName, { detail: finalValue }));
          }}
          min={12}
          max={300}
          disabled={savingSize}
          className="w-full bg-transparent px-1 py-0 text-xs text-black outline-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
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
