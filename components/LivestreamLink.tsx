"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialUrl: string | null;
  initialEnabled: boolean | null;
};

function validateStreamUrl(url: string): boolean {
  if (!url.trim()) return false;
  // Validate YouTube URLs
  const youtubePatterns = [
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+/i,
    /^https?:\/\/(?:www\.)?youtube\.com\/live\/[\w-]+/i,
  ];
  return youtubePatterns.some(pattern => pattern.test(url.trim()));
}

export function LivestreamLink({ boardId, initialUrl, initialEnabled }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string>(initialUrl || "");
  const [enabled, setEnabled] = useState<boolean>(initialEnabled ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    setUrl(initialUrl || "");
    setEnabled(initialEnabled ?? false);
  }, [boardId, initialUrl, initialEnabled]);

  // Listen for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`livestream-link-${boardId}`)
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
          if (typeof next.livestream_url === "string") {
            setUrl(next.livestream_url);
          }
          if (typeof next.livestream_enabled === "boolean") {
            setEnabled(next.livestream_enabled);
            // Dispatch event to notify other components
            window.dispatchEvent(
              new CustomEvent(`livestream-enabled-${boardId}`, {
                detail: next.livestream_enabled,
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, supabase]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setIsValid(!newUrl.trim() || validateStreamUrl(newUrl));
    setError(null);
  };

  const handleUrlBlur = async () => {
    if (!url.trim()) {
      // Clear URL if empty
      if (initialUrl) {
        setSaving(true);
        const { error: updateError } = await supabase
          .from("scoreboards")
          .update({ livestream_url: null })
          .eq("id", boardId);
        
        if (updateError) {
          setError(updateError.message);
        }
        setSaving(false);
      }
      return;
    }

    if (!validateStreamUrl(url)) {
      setError("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)");
      setIsValid(false);
      return;
    }

    setSaving(true);
    setError(null);
    
    const { error: updateError } = await supabase
      .from("scoreboards")
      .update({ livestream_url: url.trim() })
      .eq("id", boardId);

    if (updateError) {
      setError(updateError.message);
      setUrl(initialUrl || "");
    }
    
    setSaving(false);
  };

  const handleToggle = async () => {
    if (!url.trim() || !validateStreamUrl(url)) {
      setError("Please enter a valid YouTube URL first");
      return;
    }

    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setSaving(true);
    setError(null);

    // When enabling livestream, clear share_token to disable share scorekeeping
    const updateData: { 
      livestream_enabled: boolean; 
      share_token?: null;
    } = {
      livestream_enabled: newEnabled,
    };
    
    if (newEnabled) {
      updateData.share_token = null;
    }

    const { error: updateError } = await supabase
      .from("scoreboards")
      .update(updateData)
      .eq("id", boardId);

    if (updateError) {
      setError(updateError.message);
      setEnabled(enabled);
      setSaving(false);
      return;
    }

    // If enabling livestream, send request to Railway endpoint
    if (newEnabled) {
      try {
        const response = await fetch('/api/livestream/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ boardId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to process livestream:', errorData);
          // Don't show error to user as the update was successful
          // The Railway request is a background operation
        }
      } catch (error) {
        console.error('Error sending livestream request:', error);
        // Don't show error to user as the update was successful
        // The Railway request is a background operation
      }
    }

    // Dispatch event to notify other components
    window.dispatchEvent(
      new CustomEvent(`livestream-enabled-${boardId}`, {
        detail: newEnabled,
      })
    );
    
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      {/* Stream URL */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 min-w-[140px]">
          YouTube Link
        </label>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !isValid && url.trim() ? "border-red-500" : "border-gray-300"
            } ${saving ? "opacity-50" : ""}`}
            disabled={saving}
          />
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving || !url.trim() || !isValid}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enabled
                ? "bg-green-500"
                : "bg-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? "Disable livestream" : "Enable livestream"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 ml-[140px]">{error}</p>
      )}
    </div>
  );
}

