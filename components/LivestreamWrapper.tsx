"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialLivestreamEnabled: boolean | null;
  children: React.ReactNode;
};

export function LivestreamWrapper({
  boardId,
  initialLivestreamEnabled,
  children,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [livestreamEnabled, setLivestreamEnabled] = useState<boolean>(
    initialLivestreamEnabled ?? false
  );

  // Listen for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`livestream-wrapper-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "scoreboards",
          filter: `id=eq.${boardId}`,
        },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          if (typeof next.livestream_enabled === "boolean") {
            setLivestreamEnabled(next.livestream_enabled);
          }
        }
      )
      .subscribe();

    // Also listen for custom events from LivestreamLink component
    const handleLivestreamChange = (event: CustomEvent<boolean>) => {
      setLivestreamEnabled(event.detail);
    };

    window.addEventListener(
      `livestream-enabled-${boardId}`,
      handleLivestreamChange as EventListener
    );

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(
        `livestream-enabled-${boardId}`,
        handleLivestreamChange as EventListener
      );
    };
  }, [boardId, supabase]);

  return (
    <div
      className={`transition-all ${
        livestreamEnabled
          ? "ring-4 ring-green-500 ring-opacity-60 rounded-xl p-1"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

