"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  column: "a_side" | "b_side";
  initialValue: string | null;
  placeholder?: string;
  className?: string;
};

export function RealtimeSideName({
  boardId,
  column,
  initialValue,
  placeholder = "Team",
  className,
}: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const fallback = placeholder || (column === "a_side" ? "A Side" : "B Side");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue ?? "");
  }, [boardId, initialValue]);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`scoreboard-side-${boardId}-${column}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scoreboards", filter: `id=eq.${boardId}` },
        (payload) => {
          const next = (payload.new as Record<string, unknown>)[column];
          if (typeof next === "string") {
            setValue(next);
          } else if (next === null) {
            setValue("");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, column]);

  const label = value && value.trim().length > 0 ? value : fallback;

  return <span className={className}>{label}</span>;
}
