"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialValue: string | null;
  prefix?: string;
  className?: string;
};

export function RealtimeUpdatedAt({ boardId, initialValue, prefix = "Updated", className }: Props) {
  const [value, setValue] = useState<string | null>(initialValue);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue);
  }, [boardId, initialValue]);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`scoreboard-updated-${boardId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scoreboards", filter: `id=eq.${boardId}` },
        (payload) => {
          const next = (payload.new as Record<string, unknown>).updated_at;
          if (typeof next === "string") {
            setValue(next);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const formatted = formatDateTime(value);
  if (!formatted) {
    return <span className={className}>Waiting for first update.</span>;
  }

  return <span className={className}>{`${prefix} ${formatted}`}</span>;
}
