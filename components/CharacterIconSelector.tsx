"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { ScoreboardType, ElementPositions } from "@/lib/types";

type Props = {
  boardId: string;
  initialValue: string | null;
  column: "a_side_icon" | "b_side_icon";
  placeholder?: string;
  compact?: boolean;
  scoreboardType?: ScoreboardType | null;
  elementPositions?: ElementPositions | null;
};

import { cache } from "@/lib/cache";
import { preloadImages } from "@/lib/image-cache";

// Upload constants (same as LogoSelector)
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg"];
const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg"];
const CHARACTER_ICONS_BUCKET = "scoreboard-public";

function getCharacterIconUrl(boardId: string, column: string, timestamp: number, extension: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  const encodedBucket = encodeURIComponent(CHARACTER_ICONS_BUCKET);
  const filename = `${boardId}_${column}_${timestamp}${extension}`;
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodeURIComponent(filename)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type not allowed. Accepted formats: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const fileSize = formatFileSize(file.size);
    const maxSize = formatFileSize(MAX_FILE_SIZE);
    return `File too large (${fileSize}). Maximum size is ${maxSize}`;
  }
  return null;
}


// Lazy-loaded image component that only loads when visible
function LazyCharacterIcon({ character }: { character: { name: string; url: string } }) {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" } // Start loading 50px before visible
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Use a transparent 1x1 pixel data URL as placeholder to avoid empty src
  const placeholderSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

  return (
    <Image
      ref={imgRef}
      src={isVisible ? character.url : placeholderSrc}
      alt={character.name}
      width={24}
      height={24}
      className="w-6 h-6 object-contain flex-shrink-0"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
      unoptimized
    />
  );
}

export function CharacterIconSelector({ boardId, initialValue, column, placeholder, compact = false, scoreboardType, elementPositions }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [characters, setCharacters] = useState<Array<{ name: string; url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showResize, setShowResize] = useState(false);
  const [iconSize, setIconSize] = useState(64); // Default size
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch character icons from Supabase storage via API route with caching
  useEffect(() => {
    async function fetchCharacters() {
      try {
        setLoading(true);
        setError(null);
        
        let fetchedCharacters: Array<{ name: string; url: string }> = [];
        
        // Only fetch from API for melee, ultimate, or guilty-gear game types
        if (scoreboardType === "melee" || scoreboardType === "ultimate" || scoreboardType === "guilty-gear") {
          // Check cache first (game-type specific)
          const cached = cache.getCharacters(scoreboardType);
          
          if (cached) {
            fetchedCharacters = cached;
          } else {
            // Fetch from API route with game type parameter
            const apiUrl = `/api/characters?gameType=${encodeURIComponent(scoreboardType || "")}`;
            const response = await fetch(apiUrl, {
              cache: "force-cache", // Use browser cache
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Failed to fetch characters" }));
              setError(errorData.error || "Failed to load characters");
              return;
            }

            const data = await response.json();
            
            if (data.characters && data.characters.length > 0) {
              fetchedCharacters = data.characters;
              
              // Cache the result (game-type specific)
              cache.setCharacters(fetchedCharacters, scoreboardType);
            }
          }
        }

        // Add custom uploaded icon if it exists and is from our bucket (works for all game types)
        const customIcons: Array<{ name: string; url: string }> = [];
        if (initialValue && initialValue.includes(CHARACTER_ICONS_BUCKET)) {
          const urlParts = initialValue.split("/");
          const filename = urlParts[urlParts.length - 1];
          if (filename && filename.startsWith(`${boardId}_${column}_`)) {
            customIcons.push({
              name: "Custom Icon",
              url: initialValue,
            });
          }
        }

        // Combine custom icons with fetched characters (custom icons first)
        setCharacters([...customIcons, ...fetchedCharacters]);
        
        // Preload images in background
        const allUrls = [...customIcons, ...fetchedCharacters].map((c) => c.url);
        if (allUrls.length > 0) {
          preloadImages(allUrls).catch(console.warn);
        }
      } catch (err) {
        console.error("Error fetching characters:", err);
        setError(err instanceof Error ? err.message : "Failed to load characters");
      } finally {
        setLoading(false);
      }
    }

    fetchCharacters();
  }, [scoreboardType, boardId, column, initialValue]);

  // Update selected icon when initialValue changes
  useEffect(() => {
    setSelectedIcon(initialValue);
  }, [initialValue]);

  // Initialize icon size from element positions
  useEffect(() => {
    if (elementPositions) {
      const iconPos = elementPositions[column];
      if (iconPos?.width) {
        setIconSize(iconPos.width);
      }
    }
  }, [elementPositions, column]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setShowResize(false);
      }
    }

    if (showPopup || showResize) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPopup, showResize]);

  // Cleanup resize timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        handleCloseModal();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  // Save selected icon to database
  const handleSelectIcon = async (iconUrl: string | null) => {
    setSelectedIcon(iconUrl);
    setIsOpen(false);
    setSearchQuery("");
    setError(null);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

    try {
      const updatePayload: Record<string, string | null> = {
        [column]: iconUrl,
      };

      const { error: updateError } = await supabase
        .from("scoreboards")
        .update(updatePayload)
        .eq("id", boardId);

      if (updateError) {
        setError(updateError.message);
        // Revert selection on error
        setSelectedIcon(initialValue);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save icon");
      setSelectedIcon(initialValue);
    } finally {
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      // Generate filename with timestamp to avoid conflicts
      const extension = file.name.substring(file.name.lastIndexOf("."));
      const timestamp = Date.now();
      const filename = `${boardId}_${column}_${timestamp}${extension}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(CHARACTER_ICONS_BUCKET)
        .upload(filename, file, {
          cacheControl: "31536000", // 1 year cache
          upsert: false, // Don't overwrite - use timestamp for uniqueness
        });

      if (uploadError) {
        // Check if error is related to file size and include max size info
        const errorMessage = uploadError.message || "Failed to upload icon";
        const lowerMessage = errorMessage.toLowerCase();
        const isSizeError = lowerMessage.includes("maximum allowed size") || 
            (lowerMessage.includes("exceeded") && lowerMessage.includes("size")) ||
            lowerMessage.includes("too large");
        if (isSizeError) {
          const maxSize = formatFileSize(MAX_FILE_SIZE);
          throw new Error(`File too large. Maximum allowed size is ${maxSize}. Please use a smaller file.`);
        }
        throw new Error(errorMessage);
      }

      // Get public URL
      const iconUrl = getCharacterIconUrl(boardId, column, timestamp, extension);

      // Delete old icon if it exists and is a custom upload
      if (initialValue && initialValue.includes(CHARACTER_ICONS_BUCKET)) {
        try {
          const urlParts = initialValue.split("/");
          const oldFilename = urlParts[urlParts.length - 1];
          if (oldFilename && oldFilename.startsWith(`${boardId}_${column}_`)) {
            await supabase.storage
              .from(CHARACTER_ICONS_BUCKET)
              .remove([oldFilename]);
          }
        } catch (deleteError) {
          console.warn("Failed to delete old icon:", deleteError);
        }
      }

      // Add uploaded icon to characters list
      const uploadedCharacter = {
        name: `Custom Icon (${file.name.replace(/\.[^/.]+$/, "")})`,
        url: iconUrl,
      };
      setCharacters((prev) => [uploadedCharacter, ...prev]);

      // Select the uploaded icon
      await handleSelectIcon(iconUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload icon";
      // Ensure max size is mentioned in error if it's a size-related error
      if (errorMessage.toLowerCase().includes("too large") || 
          errorMessage.toLowerCase().includes("maximum") ||
          (errorMessage.toLowerCase().includes("exceeded") && errorMessage.toLowerCase().includes("size"))) {
        const maxSize = formatFileSize(MAX_FILE_SIZE);
        setError(errorMessage.includes(maxSize) ? errorMessage : `File too large. Maximum allowed size is ${maxSize}.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Filter characters based on search query
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const query = searchQuery.toLowerCase();
    return characters.filter((char) => char.name.toLowerCase().includes(query));
  }, [characters, searchQuery]);

  // Get display name for selected icon
  const selectedCharacterName = useMemo(() => {
    if (!selectedIcon) return placeholder || "Select character";
    const character = characters.find((char) => char.url === selectedIcon);
    return character ? character.name : "Selected";
  }, [selectedIcon, characters, placeholder]);

  // Handle icon click - show popup if icon exists, otherwise open modal
  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIcon) {
      setShowPopup(true);
      setShowResize(false);
    } else {
      handleOpenModal();
    }
  };

  // Handle opening modal and focus search input
  const handleOpenModal = () => {
    setIsOpen(true);
    setSearchQuery("");
    setShowPopup(false);
    setShowResize(false);
    // Focus search input after modal opens
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  // Handle remove icon
  const handleRemoveIcon = async () => {
    setShowPopup(false);
    await handleSelectIcon(null);
  };

  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle resize icon with debouncing
  const handleResizeIcon = (newSize: number) => {
    setIconSize(newSize);
    
    if (!elementPositions) return;

    // Update both icons' sizes
    const updatedPositions: ElementPositions = {
      ...elementPositions,
      a_side_icon: {
        ...(elementPositions.a_side_icon || { x: 0, y: 0 }),
        width: newSize,
        height: newSize,
      },
      b_side_icon: {
        ...(elementPositions.b_side_icon || { x: 0, y: 0 }),
        width: newSize,
        height: newSize,
      },
    };

    // Broadcast change immediately for preview (real-time update)
    window.dispatchEvent(new CustomEvent(`element-positions-local-${boardId}`, { detail: updatedPositions }));

    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Debounce the database save operation
    resizeTimeoutRef.current = setTimeout(async () => {
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

      try {
        const { error: updateError } = await supabase
          .from("scoreboards")
          .update({ element_positions: updatedPositions })
          .eq("id", boardId);

        if (updateError) {
          setError(updateError.message);
        } else {
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resize icon");
      } finally {
        window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
      }
    }, 400); // 400ms debounce for database save
  };

  // Shared modal content
  const modalContent = (
    <div
      ref={modalRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[80vh] flex flex-col bg-white rounded-lg shadow-xl"
    >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/10">
            <h2 className="text-lg font-semibold text-black">Select Character</h2>
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-1 rounded-md hover:bg-black/5 transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-black/10">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search characters..."
              className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.08)]"
            />
          </div>

          {/* Character List */}
          <div className="flex-1 overflow-y-auto p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload character icon"
            />
            {error ? (
              <div className="p-3 text-sm text-red-600 text-center">
                Error: {error}
              </div>
            ) : loading ? (
              <div className="p-3 text-sm text-black/60 text-center">
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {/* Upload Option */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center gap-2 p-3 rounded-md transition-colors border-2 border-dashed border-black/20 hover:bg-black/5 hover:border-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Upload custom icon\n\nAccepted: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}\nMax size: ${formatFileSize(MAX_FILE_SIZE)}`}
                >
                  {uploading ? (
                    <>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 text-black"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                      <span className="text-xs text-center">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 flex items-center justify-center text-black/60">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="h-6 w-6"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <span className="text-xs text-center">Upload Icon</span>
                    </>
                  )}
                </button>
                {/* Character Icons */}
                {filteredCharacters.length === 0 ? (
                  <div className="col-span-full p-3 text-sm text-black/60 text-center">
                    {characters.length === 0 ? "No characters available" : "No characters match your search"}
                  </div>
                ) : (
                  filteredCharacters.map((character) => (
                    <button
                      key={character.url}
                      type="button"
                      onClick={() => handleSelectIcon(character.url)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-md transition-colors ${
                        selectedIcon === character.url
                          ? "bg-black/10 border-2 border-black/20"
                          : "hover:bg-black/5 border-2 border-transparent"
                      }`}
                    >
                      <LazyCharacterIcon character={character} />
                      <span className="text-xs text-center truncate w-full">{character.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedIcon && (
            <div className="p-4 border-t border-black/10">
              <button
                type="button"
                onClick={() => handleSelectIcon(null)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
    </div>
  );

  if (compact) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleIconClick}
          disabled={loading}
          className="flex items-center justify-center rounded-md border border-black/20 bg-white px-2 py-2 text-black outline-none transition-all duration-150 hover:border-black/40 focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.08)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed h-[38px] w-[38px] flex-shrink-0"
          title={selectedIcon ? selectedCharacterName : placeholder || "Select character"}
        >
          {loading ? (
            <span className="text-xs">...</span>
          ) : selectedIcon ? (
            <Image
              src={selectedIcon}
              alt={selectedCharacterName}
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              unoptimized
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}
        </button>

        {/* Popup Menu */}
        {showPopup && !showResize && (
          <div
            ref={popupRef}
            className="absolute z-50 mt-2 left-0 w-48 bg-white rounded-lg shadow-xl border border-black/20 overflow-hidden"
          >
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full px-4 py-2 text-sm text-left text-black hover:bg-black/5 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Choose Character
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResize(true);
                setShowPopup(false);
              }}
              className="w-full px-4 py-2 text-sm text-left text-black hover:bg-black/5 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5H6.75V21h6.75V10.5z" />
              </svg>
              Resize Icon
            </button>
            <button
              type="button"
              onClick={handleRemoveIcon}
              className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Remove Icon
            </button>
          </div>
        )}

        {/* Resize Slider */}
        {showResize && (
          <div
            ref={popupRef}
            className="absolute z-50 mt-2 left-0 w-64 bg-white rounded-lg shadow-xl border border-black/20 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-black">Resize Icon</h3>
              <button
                type="button"
                onClick={() => {
                  setShowResize(false);
                  setShowPopup(false);
                }}
                className="p-1 rounded-md hover:bg-black/5 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="24"
                  max="128"
                  value={iconSize}
                  onChange={(e) => handleResizeIcon(Number(e.target.value))}
                  className="flex-1 h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-black font-medium w-12 text-right">{iconSize}px</span>
              </div>
              <p className="text-xs text-black/60">
                Size applies to both icons
              </p>
            </div>
          </div>
        )}

        {isOpen && modalContent}

        {error && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-600 whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={loading}
        className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
      >
        <span className="truncate">{loading ? "Loading..." : selectedCharacterName}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>

      {isOpen && modalContent}

      {selectedIcon && (
        <div className="flex items-center gap-2">
          <Image
            src={selectedIcon}
            alt="Selected character"
            width={32}
            height={32}
            className="w-8 h-8 object-contain border border-black/10 rounded"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-black/60 truncate">{selectedCharacterName}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>({error})</span>
        </div>
      )}
    </div>
  );
}

