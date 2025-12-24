"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialUrl: string | null;
  initialEnabled: boolean | null;
};

const DEBOUNCE_MS = 400;

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

function validateYouTubeUrl(url: string): boolean {
  if (!url.trim()) return false;
  return extractYouTubeVideoId(url) !== null;
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
    setIsValid(!newUrl.trim() || validateYouTubeUrl(newUrl));
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

    if (!validateYouTubeUrl(url)) {
      setError("Please enter a valid YouTube livestream URL");
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
    if (!url.trim() || !validateYouTubeUrl(url)) {
      setError("Please enter a valid YouTube livestream URL first");
      return;
    }

    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("scoreboards")
      .update({ livestream_enabled: newEnabled })
      .eq("id", boardId);

    if (updateError) {
      setError(updateError.message);
      setEnabled(enabled);
    } else {
      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent(`livestream-enabled-${boardId}`, {
          detail: newEnabled,
        })
      );
    }
    
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 min-w-[140px]">
          Livestream Link
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
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              enabled
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {enabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 ml-[140px]">{error}</p>
      )}
      {!error && url.trim() && enabled && (
        <p className="text-sm text-green-600 ml-[140px]">
          Scoreboard is updating automatically from livestream
        </p>
      )}
    </div>
  );
}

