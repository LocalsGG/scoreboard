"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialUrl: string | null;
  initialEnabled: boolean | null;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
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

export function LivestreamLinkModal({ 
  boardId, 
  initialUrl, 
  initialEnabled,
  isOpen, 
  onClose, 
  position 
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string>(initialUrl || "");
  const [enabled, setEnabled] = useState<boolean>(initialEnabled ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current state when modal opens to ensure we have the latest data
  useEffect(() => {
    if (isOpen) {
      const fetchCurrentState = async () => {
        const { data, error } = await supabase
          .from('scoreboards')
          .select('livestream_url, livestream_enabled')
          .eq('id', boardId)
          .maybeSingle();

        if (!error && data) {
          if (typeof data.livestream_url === "string" || data.livestream_url === null) {
            setUrl(data.livestream_url || "");
          }
          if (typeof data.livestream_enabled === "boolean") {
            setEnabled(data.livestream_enabled);
          }
        }
      };
      fetchCurrentState();
    } else {
      // Reset to initial props when modal closes
      setUrl(initialUrl || "");
      setEnabled(initialEnabled ?? false);
    }
  }, [isOpen, boardId, supabase, initialUrl, initialEnabled]);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Small delay to avoid immediate close on click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed z-50 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Arrow pointing up */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 border-l border-t border-black/10 bg-white rotate-45"></div>
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 pr-8">
          Link Your Livestream
        </h2>

        <p className="text-sm text-gray-600">
          Enter your YouTube livestream URL to automatically update the scoreboard:
        </p>

        {/* YouTube URL Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            YouTube Livestream URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !isValid && url.trim() ? "border-red-500" : "border-gray-300"
            } ${saving ? "opacity-50" : ""}`}
            disabled={saving}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Enable Livestream Updates
          </label>
          <div className="flex items-center gap-3">
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
            <span className="text-sm text-gray-600">
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            How to use:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
            <li>Enter your YouTube livestream URL (e.g., https://www.youtube.com/watch?v=...)</li>
            <li>Toggle the switch to enable automatic scoreboard updates</li>
            <li>The scoreboard will update automatically from your livestream</li>
            <li>Note: Share scorekeeping will be disabled when livestream is enabled</li>
          </ol>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

