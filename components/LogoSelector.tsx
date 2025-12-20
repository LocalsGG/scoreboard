"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GAME_CONFIGS, getSupabaseStorageUrl } from "@/lib/assets";
import { getDefaultLogo } from "./scoreboard-preview/gameConfigs";
import type { ScoreboardType } from "@/lib/types";

type Props = {
  boardId: string;
  initialCustomLogoUrl: string | null;
  initialScoreboardType?: ScoreboardType | null;
  initialPositions?: unknown;
};

const DEBOUNCE_MS = 400;
const SUPABASE_PUBLIC_IMAGE_BASE = getSupabaseStorageUrl();
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg"];
const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg"];
const LOGOS_BUCKET = "public images";
const LOGOS_PATH = "custom-logos";

function getLogoUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  const encodedBucket = encodeURIComponent(LOGOS_BUCKET);
  const encodedPath = encodeURIComponent(LOGOS_PATH);
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}/${encodeURIComponent(filename)}`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type not allowed. Please use: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
  return null;
}

export function LogoSelector({ boardId, initialCustomLogoUrl, initialScoreboardType, initialPositions }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Normalize scoreboard type (handle undefined)
  const scoreboardType = initialScoreboardType ?? null;
  
  // Get default logo based on scoreboard type
  const defaultLogoUrl = getDefaultLogo(scoreboardType);
  
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(
    initialCustomLogoUrl || defaultLogoUrl
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set to custom logo if available, otherwise use default based on scoreboard type
    const defaultLogo = getDefaultLogo(scoreboardType);
    setSelectedLogoUrl(initialCustomLogoUrl || defaultLogo);
  }, [boardId, initialCustomLogoUrl, scoreboardType]);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // User cancelled - revert to default logo
      const defaultLogo = getDefaultLogo(scoreboardType);
      setSelectedLogoUrl(initialCustomLogoUrl || defaultLogo);
      return;
    }

    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate unique filename: boardId-timestamp.extension
      const extension = file.name.substring(file.name.lastIndexOf("."));
      const timestamp = Date.now();
      const filename = `${boardId}-${timestamp}${extension}`;
      const filePath = `${LOGOS_PATH}/${filename}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(LOGOS_BUCKET)
        .upload(filePath, file, {
          cacheControl: "31536000", // 1 year cache
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload logo");
      }

      // Get public URL
      const logoUrl = getLogoUrl(filename);

      // Delete old logo if it exists and is a custom upload
      if (initialCustomLogoUrl && initialCustomLogoUrl.includes(LOGOS_PATH)) {
        try {
          const oldFilename = initialCustomLogoUrl.split("/").pop();
          if (oldFilename) {
            await supabase.storage
              .from(LOGOS_BUCKET)
              .remove([`${LOGOS_PATH}/${oldFilename}`]);
          }
        } catch (deleteError) {
          console.warn("Failed to delete old logo:", deleteError);
        }
      }

      // Update state immediately for preview
      setSelectedLogoUrl(logoUrl);

      // Broadcast local change immediately for preview
      window.dispatchEvent(new CustomEvent(`custom-logo-local-${boardId}`, { detail: logoUrl }));

      setSaving(true);
      setError(null);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

      // Save to database
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ custom_logo_url: logoUrl })
        .eq("id", boardId);

      if (updateError) {
        throw new Error(updateError.message || "Failed to save logo URL");
      }

      setError(null);
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
      // Revert to previous logo on error
      const defaultLogo = getDefaultLogo(scoreboardType);
      setSelectedLogoUrl(initialCustomLogoUrl || defaultLogo);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col gap-3 items-center">
        {/* Logo preview - clickable */}
        <div className="flex flex-col items-center gap-2 w-full relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleLogoUpload}
            className="hidden"
            aria-label="Upload logo"
          />
          <button
            type="button"
            onClick={handleLogoClick}
            disabled={saving || uploading}
            className={`relative h-16 w-16 rounded-lg border-2 border-black/10 bg-white p-2 transition-all duration-150 hover:border-black/30 hover:scale-105 active:scale-95 ${
              saving || uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            title="Click to upload logo"
          >
            <img
              src={selectedLogoUrl || defaultLogoUrl}
              alt="Logo"
              className="h-full w-full object-contain pointer-events-none"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultLogoUrl;
              }}
            />
            {(saving || uploading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                <span className="text-xs font-semibold text-black">
                  {uploading ? "Uploading…" : "Saving…"}
                </span>
              </div>
            )}
          </button>

        </div>

        {/* Error messages */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 justify-center">
            <span>({error})</span>
          </div>
        )}
      </div>
    </div>
  );
}


