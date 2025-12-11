"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialName: string | null;
  placeholder?: string;
  className?: string;
};

/**
 * Subscribes to the `scoreboards` table and keeps the name in sync via Realtime.
 */
export function RealtimeScoreboardName({
  boardId,
  initialName,
  placeholder = "Untitled board",
  className,
}: Props) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(initialName);
  }, [boardId, initialName]);

  useEffect(() => {
    if (!boardId) return;

    const eventName = `board-name-local-${boardId}`;
    const handleLocal = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setName(detail ?? null);
    };
    window.addEventListener(eventName, handleLocal);

    const supabase = createClient();
    const channel = supabase
      .channel(`scoreboard-name-${boardId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scoreboards", filter: `id=eq.${boardId}` },
        (payload) => {
          const nextName = (payload.new as { name?: string | null } | null)?.name ?? null;
          setName(nextName);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(eventName, handleLocal);
    };
  }, [boardId]);

  const label = name && name.trim().length > 0 ? name : placeholder;

  return <span className={className}>{label}</span>;
}
