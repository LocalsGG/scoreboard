"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  column: "a_score" | "b_score";
  initialValue: number | null;
  className?: string;
};

export function RealtimeScoreValue({ boardId, column, initialValue, className }: Props) {
  const [value, setValue] = useState<number | null>(initialValue ?? 0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? 0);
  }, [boardId, initialValue]);

  useEffect(() => {
    if (!boardId) return;

    const eventName = `score-local-${boardId}-${column}`;
    const handleLocal = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      setValue(detail ?? 0);
    };
    window.addEventListener(eventName, handleLocal);

    const supabase = createClient();
    const channel = supabase
      .channel(`score-${boardId}-${column}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scoreboards", filter: `id=eq.${boardId}` },
        (payload) => {
          const nextValue = (payload.new as Record<string, unknown>)[column];
          if (typeof nextValue === "number") {
            setValue(nextValue);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(eventName, handleLocal);
    };
  }, [boardId, column]);

  return <span className={className}>{value ?? 0}</span>;
}
