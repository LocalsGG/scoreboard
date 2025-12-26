"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  column: "a_score" | "b_score";
  initialValue: number | null;
  initialPositions?: unknown;
  isAuthenticated?: boolean;
  disabled?: boolean;
};

const DEBOUNCE_MS = 400;

export function ScoreAdjuster({ boardId, column, initialValue, isAuthenticated = false, disabled = false }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<number>(initialValue ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreChange, setScoreChange] = useState<number>(0);
  const scoreControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? 0);
  }, [boardId, initialValue]);


  const eventName = `score-local-${boardId}-${column}`;
  const broadcastLocal = (next: number) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
  };

  const adjust = async (delta: number) => {
    if (!boardId || saving || disabled) return;
    const previous = value;
    const next = Math.max(0, (value ?? 0) + delta);

    // Trigger gamified animations
    setScoreChange(delta);
    scoreControls.start({
      scale: [1, 1.1, 1],
      color: delta > 0 ? ["#000", "#22c55e", "#000"] : ["#000", "#ef4444", "#000"],
      transition: { duration: 0.6, ease: "easeOut" }
    });

    buttonControls.start({
      scale: [1, 0.95, 1.05, 1],
      transition: { duration: 0.3, ease: "easeInOut" }
    });

    // Dispatch animation event for scoreboard preview
    window.dispatchEvent(new CustomEvent(`score-animation-${boardId}-${column}`, {
      detail: { delta, score: next }
    }));

    setValue(next);
    broadcastLocal(next);

    // Clear change indicator after animation
    setTimeout(() => setScoreChange(0), 600);

    if (!isAuthenticated) {
      setError(null);
      return;
    }

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
      <motion.div
        animate={buttonControls}
        className={`flex items-center justify-between rounded-md border border-black/20 bg-white px-2 sm:px-3 py-2 text-sm font-semibold text-black transition-all duration-150 ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 hover:border-black/40"
        }`}
        style={{
          boxShadow: scoreChange !== 0 ? `0 0 20px ${scoreChange > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` : 'none'
        }}
      >
        <motion.button
          type="button"
          onClick={() => adjust(-1)}
          disabled={saving || disabled}
          className="cursor-pointer rounded-md border border-black/20 px-2 sm:px-3 py-1 text-xs uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0 relative overflow-hidden"
          whileHover={{ scale: 1.05, backgroundColor: "#f8fafc" }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            initial={{ x: 0 }}
            whileTap={{ x: -2 }}
            transition={{ duration: 0.1 }}
          >
            -1
          </motion.span>
        </motion.button>

        <motion.span
          animate={scoreControls}
          className="text-2xl sm:text-3xl font-black leading-none mx-1 sm:mx-2 relative"
        >
          {value}
          {scoreChange !== 0 && (
            <motion.span
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1.2 }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`absolute -top-2 -right-2 text-sm font-bold ${
                scoreChange > 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {scoreChange > 0 ? '+' : ''}{scoreChange}
            </motion.span>
          )}
        </motion.span>

        <motion.button
          type="button"
          onClick={() => adjust(1)}
          disabled={saving || disabled}
          className="cursor-pointer rounded-md border border-black/20 px-2 sm:px-3 py-1 text-xs uppercase tracking-[0.14em] text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0 relative overflow-hidden"
          whileHover={{ scale: 1.05, backgroundColor: "#f8fafc" }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            initial={{ x: 0 }}
            whileTap={{ x: 2 }}
            transition={{ duration: 0.1 }}
          >
            +1
          </motion.span>
        </motion.button>
      </motion.div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-red-600"
        >
          <span>({error})</span>
        </motion.div>
      )}
    </div>
  );
}
