"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGameIcon } from "@/lib/assets";
import type { ElementPositions } from "@/lib/types";

type Props = {
  boardId: string;
  initialCustomLogoUrl: string | null;
  boardName: string | null;
  initialPositions?: ElementPositions | null;
};

const DEBOUNCE_MS = 400;
const DEFAULT_SIZE = 64;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg"];
const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg"];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LOGOS_BUCKET = "public images";
const LOGOS_PATH = "custom-logos";

function getLogoUrl(filename: string): string {
  if (!SUPABASE_URL) return "";
  const encodedBucket = encodeURIComponent(LOGOS_BUCKET);
  const encodedPath = encodeURIComponent(LOGOS_PATH);
  return `${SUPABASE_URL}/storage/v1/object/public/${encodedBucket}/${encodedPath}/${encodeURIComponent(filename)}`;
}

export function LogoUploader({ boardId, initialCustomLogoUrl, boardName, initialPositions }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(initialCustomLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstRun = useRef(true);
  
  // Size state - use width as the single size value (square)
  const initialSize = initialPositions?.logo?.width ?? DEFAULT_SIZE;
  const [size, setSize] = useState<number>(initialSize);
  const [sizeInput, setSizeInput] = useState<string>(String(initialSize));
  const [savingSize, setSavingSize] = useState(false);
  const [errorSize, setErrorSize] = useState<string | null>(null);
  const isFirstRunSize = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomLogoUrl(initialCustomLogoUrl);
  }, [boardId, initialCustomLogoUrl]);

  useEffect(() => {
    const currentSize = initialPositions?.logo?.width ?? DEFAULT_SIZE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSize(currentSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizeInput(String(currentSize));
  }, [boardId, initialPositions]);

  const currentLogoUrl = customLogoUrl || getGameIcon(boardName);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return "Only SVG, PNG, and JPG files are allowed";
      }
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      // Reset file input
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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(LOGOS_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload logo");
      }

      // Get public URL
      const logoUrl = getLogoUrl(filename);

      // Delete old logo if it exists
      if (customLogoUrl && customLogoUrl.includes(LOGOS_PATH)) {
        try {
          const oldFilename = customLogoUrl.split("/").pop();
          if (oldFilename) {
            await supabase.storage
              .from(LOGOS_BUCKET)
              .remove([`${LOGOS_PATH}/${oldFilename}`]);
          }
        } catch (deleteError) {
          // Log but don't fail if old file deletion fails
          console.warn("Failed to delete old logo:", deleteError);
        }
      }

      // Update state immediately for preview
      setCustomLogoUrl(logoUrl);

      // Broadcast local change immediately for preview
      const eventName = `custom-logo-local-${boardId}`;
      window.dispatchEvent(new CustomEvent(eventName, { detail: logoUrl }));

      // Save to database
      setSaving(true);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ custom_logo_url: logoUrl })
        .eq("id", boardId);

      if (updateError) {
        throw new Error(updateError.message || "Failed to save logo URL");
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
      setCustomLogoUrl(initialCustomLogoUrl);
    } finally {
      setUploading(false);
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!customLogoUrl) return;

    setError(null);
    setSaving(true);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

    try {
      // Delete file from storage
      if (customLogoUrl.includes(LOGOS_PATH)) {
        const filename = customLogoUrl.split("/").pop();
        if (filename) {
          const { error: deleteError } = await supabase.storage
            .from(LOGOS_BUCKET)
            .remove([`${LOGOS_PATH}/${filename}`]);

          if (deleteError) {
            console.warn("Failed to delete logo file:", deleteError);
          }
        }
      }

      // Update database
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ custom_logo_url: null })
        .eq("id", boardId);

      if (updateError) {
        throw new Error(updateError.message || "Failed to remove logo");
      }

      setCustomLogoUrl(null);
      
      // Broadcast removal for preview
      const eventName = `custom-logo-local-${boardId}`;
      window.dispatchEvent(new CustomEvent(eventName, { detail: null }));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }
  };

  const handleLogoClick = () => {
    if (!uploading && !saving && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle size changes
  useEffect(() => {
    if (isFirstRunSize.current) {
      isFirstRunSize.current = false;
      return;
    }
    if (!boardId) return;

    const handler = setTimeout(async () => {
      setSavingSize(true);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      
      const { data: boardData } = await supabase
        .from("scoreboards")
        .select("element_positions")
        .eq("id", boardId)
        .single();

      const currentPositions: ElementPositions = boardData?.element_positions || {
        title: { x: 720, y: 200, fontSize: 72 },
        subtitle: { x: 720, y: 600, fontSize: 48 },
        logo: { x: 720, y: 405, width: DEFAULT_SIZE, height: DEFAULT_SIZE },
        a_side: { x: 100, y: 310, fontSize: 60 },
        b_side: { x: 1200, y: 310, fontSize: 60 },
        a_score: { x: 540, y: 400, fontSize: 110 },
        b_score: { x: 910, y: 400, fontSize: 110 },
      };

      const updatedPositions: ElementPositions = {
        ...currentPositions,
        logo: { ...currentPositions.logo, width: size, height: size },
      };

      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ element_positions: updatedPositions })
        .eq("id", boardId);

      if (updateError) {
        setErrorSize(updateError.message);
      } else {
        setErrorSize(null);
      }
      setSavingSize(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, size, supabase]);

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col gap-3 items-center">
        {/* Current logo preview */}
        <div className="flex flex-col items-center gap-2 w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
            onChange={handleFileSelect}
            disabled={uploading || saving}
            className="hidden"
            id={`logo-upload-${boardId}`}
          />
          <div
            onClick={handleLogoClick}
            className={`relative h-16 w-16 rounded-lg border-2 border-black/10 bg-white p-2 cursor-pointer transition-all duration-150 hover:border-black/30 hover:scale-105 active:scale-95 ${
              uploading || saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={uploading ? "Uploading…" : saving ? "Saving…" : "Click to upload logo"}
          >
            <img
              src={currentLogoUrl}
              alt="Current logo"
              className="h-full w-full object-contain pointer-events-none"
              onError={(e) => {
                // Fallback to default if custom logo fails to load
                if (customLogoUrl) {
                  const defaultUrl = getGameIcon(boardName);
                  (e.target as HTMLImageElement).src = defaultUrl;
                }
              }}
            />
            {(uploading || saving) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                <span className="text-xs font-semibold text-black">
                  {uploading ? "Uploading…" : "Saving…"}
                </span>
              </div>
            )}
          </div>
          {/* Size control */}
          <div className="relative flex items-center rounded-md border border-black/20 bg-white px-2 py-1 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus-within:border-black focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.08)] w-full max-w-[80px]">
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Allow free typing - update input value immediately
                setSizeInput(inputValue);
                // Only update size if it's a valid number
                const value = parseInt(inputValue, 10);
                if (!isNaN(value)) {
                  setSize(value);
                }
              }}
              onBlur={(e) => {
                // Validate on blur - clamp to min/max
                const value = parseInt(e.target.value, 10);
                let finalValue = value;
                if (isNaN(value) || value < 20) {
                  finalValue = 20;
                } else if (value > 500) {
                  finalValue = 500;
                }
                setSize(finalValue);
                setSizeInput(String(finalValue));
              }}
              min={20}
              max={500}
              disabled={savingSize}
              className="w-full bg-transparent px-1 py-0 text-xs text-black outline-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
            />
          </div>
        </div>

        {/* Remove button */}
        {customLogoUrl && (
          <button
            type="button"
            onClick={handleRemoveLogo}
            disabled={uploading || saving}
            className="inline-flex items-center justify-center rounded-md border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove custom logo
          </button>
        )}

        {/* Error messages */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 justify-center">
            <span>({error})</span>
          </div>
        )}
        {errorSize && (
          <div className="flex items-center gap-2 text-xs text-red-600 justify-center">
            <span>({errorSize})</span>
          </div>
        )}
      </div>
    </div>
  );
}
