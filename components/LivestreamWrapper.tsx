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

  // Poll for livestream updates when enabled
  useEffect(() => {
    if (!livestreamEnabled) {
      return;
    }

    // Poll every 5 seconds
    const POLL_INTERVAL = 5000;

    const pollForUpdates = async () => {
      try {
        console.log('Polling livestream updates for board:', boardId);
        const response = await fetch('/api/livestream/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ boardId }),
        });

        console.log('Livestream poll response status:', response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            const responseText = await response.text();
            console.error('Error response text:', responseText);
            errorData = responseText ? JSON.parse(responseText) : { error: 'Empty response body' };
          } catch (parseError) {
            errorData = { 
              error: 'Failed to parse error response',
              status: response.status,
              statusText: response.statusText,
            };
          }
          console.error('Failed to poll livestream updates:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          return;
        }

        const data = await response.json();
        console.log('Livestream poll success:', data);
      } catch (error) {
        console.error('Error polling livestream updates:', error);
      }
    };

    // Poll immediately, then set up interval
    pollForUpdates();
    const intervalId = setInterval(pollForUpdates, POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [livestreamEnabled, boardId]);

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

