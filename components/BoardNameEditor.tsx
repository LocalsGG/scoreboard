"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGameIcon } from "@/lib/assets";
import type { ElementPositions } from "@/lib/types";

type Props = {
  boardId: string;
  initialName: string | null;
  initialTitleVisible?: boolean | null;
  initialCustomLogoUrl?: string | null;
  placeholder?: string;
  align?: "left" | "center";
  showLabel?: boolean;
  initialPositions?: ElementPositions | null;
};

const DEBOUNCE_MS = 400;
const DEFAULT_FONT_SIZE = 72;
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

export function BoardNameEditor({
  boardId,
  initialName,
  initialTitleVisible = true,
  initialCustomLogoUrl,
  placeholder = "Scoreboard title",
  align = "left",
  showLabel = false,
  initialPositions,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleVisible, setTitleVisible] = useState(initialTitleVisible ?? true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(initialCustomLogoUrl ?? null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstRun = useRef(true);
  
  // Size state
  const initialFontSize = initialPositions?.title?.fontSize ?? DEFAULT_FONT_SIZE;
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [fontSizeInput, setFontSizeInput] = useState<string>(String(initialFontSize));
  const [savingSize, setSavingSize] = useState(false);
  const [errorSize, setErrorSize] = useState<string | null>(null);
  const isFirstRunSize = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialName ?? "");
  }, [boardId, initialName]);

  useEffect(() => {
    setTitleVisible(initialTitleVisible ?? true);
  }, [boardId, initialTitleVisible]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomLogoUrl(initialCustomLogoUrl ?? null);
  }, [boardId, initialCustomLogoUrl]);

  useEffect(() => {
    const currentFontSize = initialPositions?.title?.fontSize ?? DEFAULT_FONT_SIZE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSize(currentFontSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSizeInput(String(currentFontSize));
  }, [boardId, initialPositions]);

  const broadcastLocal = (next: string) => {
    const eventName = `board-name-local-${boardId}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!boardId) return;

    const handler = setTimeout(async () => {
      setSaving(true);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      const trimmed = value.trim();
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ name: trimmed || null })
        .eq("id", boardId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setError(null);
      }
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, supabase, value]);

  const containerAlignment =
    align === "center"
      ? "sm:flex-col sm:items-center"
      : "sm:flex-row sm:items-center";
  const helperAlignment = align === "center" ? "justify-center" : "";
  const inputAlignment = align === "center" ? "text-center" : "text-left";

  const toggleTitleVisibility = async () => {
    const newVisible = !titleVisible;
    setTitleVisible(newVisible);
    setSavingVisibility(true);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

    // Broadcast to preview component
    const eventName = `title-visibility-${boardId}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: newVisible }));

    // Save to database
    const { error: updateError } = await supabase
      .from("scoreboards")
      .update({ title_visible: newVisible })
      .eq("id", boardId);

    if (updateError) {
      console.error("Failed to update title visibility:", updateError);
      // Revert on error
      setTitleVisible(titleVisible);
    }
    setSavingVisibility(false);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
  };

  const currentLogoUrl = customLogoUrl || getGameIcon(value);

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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setLogoError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploadingLogo(true);
    setLogoError(null);

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
          console.warn("Failed to delete old logo:", deleteError);
        }
      }

      // Update state immediately for preview
      setCustomLogoUrl(logoUrl);

      // Broadcast local change immediately for preview
      const eventName = `custom-logo-local-${boardId}`;
      window.dispatchEvent(new CustomEvent(eventName, { detail: logoUrl }));

      // Save to database
      setSavingLogo(true);
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ custom_logo_url: logoUrl })
        .eq("id", boardId);

      if (updateError) {
        throw new Error(updateError.message || "Failed to save logo URL");
      }

      setLogoError(null);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Failed to upload logo");
      setCustomLogoUrl(initialCustomLogoUrl ?? null);
    } finally {
      setUploadingLogo(false);
      setSavingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!customLogoUrl) return;

    setLogoError(null);
    setSavingLogo(true);

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

      setLogoError(null);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setSavingLogo(false);
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
        title: { x: 720, y: 200, fontSize: DEFAULT_FONT_SIZE },
        subtitle: { x: 720, y: 600, fontSize: 48 },
        logo: { x: 720, y: 405, width: 64, height: 64 },
        a_side: { x: 100, y: 310, fontSize: 60 },
        b_side: { x: 1200, y: 310, fontSize: 60 },
        a_score: { x: 540, y: 400, fontSize: 110 },
        b_score: { x: 910, y: 400, fontSize: 110 },
      };

      const updatedPositions: ElementPositions = {
        ...currentPositions,
        title: { ...currentPositions.title, fontSize: fontSize },
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
  }, [boardId, fontSize, supabase]);

  return (
    <div className={`mt-2 flex flex-col gap-2 ${containerAlignment}`}>
      {showLabel && (
        <button
          type="button"
          onClick={toggleTitleVisibility}
          disabled={savingVisibility}
          className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
          title={titleVisible ? "Hide title" : "Show title"}
        >
          <span>Scoreboard name</span>
          {titleVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 0010 3c-1.38 0-2.68.28-3.87.8L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.374l1.091 1.092a4 4 0 00-5.557-5.557z"
                clipRule="evenodd"
              />
              <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 4.02L6.5 7.681A4 4 0 0010.748 13.93z" />
            </svg>
          )}
        </button>
      )}
      <div className="relative flex items-center rounded-md border border-black/20 bg-white px-2 sm:px-3 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus-within:border-black focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] w-full">
        <input
          type="text"
          name="name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            broadcastLocal(e.target.value);
          }}
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent text-sm text-black outline-none placeholder:text-black/50 ${inputAlignment}`}
        />
        <input
          type="number"
          value={fontSizeInput}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Allow free typing - update input value immediately
            setFontSizeInput(inputValue);
            // Only update fontSize if it's a valid number
            const value = parseInt(inputValue, 10);
            if (!isNaN(value)) {
              setFontSize(value);
            }
          }}
          onBlur={(e) => {
            // Validate on blur - clamp to min/max
            const value = parseInt(e.target.value, 10);
            let finalValue = value;
            if (isNaN(value) || value < 12) {
              finalValue = 12;
            } else if (value > 300) {
              finalValue = 300;
            }
            setFontSize(finalValue);
            setFontSizeInput(String(finalValue));
          }}
          min={12}
          max={300}
          disabled={savingSize}
          className="w-14 sm:w-16 bg-transparent px-1 sm:px-2 py-0 text-xs text-black outline-none border-l border-black/20 pl-2 ml-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      {error && (
        <div className={`flex items-center gap-2 text-xs text-red-600 ${helperAlignment}`}>
          <span>({error})</span>
        </div>
      )}
      {errorSize && (
        <div className={`flex items-center gap-2 text-xs text-red-600 ${helperAlignment}`}>
          <span>({errorSize})</span>
        </div>
      )}
    </div>
  );
}
