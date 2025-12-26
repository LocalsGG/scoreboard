"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialValue: string | null;
  column: "a_side_icon" | "b_side_icon";
  placeholder?: string;
  compact?: boolean;
};

import { cache } from "@/lib/cache";
import { preloadImages } from "@/lib/image-cache";


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

  return (
    <Image
      ref={imgRef}
      src={isVisible ? character.url : ""}
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

export function CharacterIconSelector({ boardId, initialValue, column, placeholder, compact = false }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [characters, setCharacters] = useState<Array<{ name: string; url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch character icons from Supabase storage via API route with caching
  useEffect(() => {
    async function fetchCharacters() {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        const cached = cache.getCharacters();
        if (cached) {
          setCharacters(cached);
          setLoading(false);
          
          // Preload images in background
          preloadImages(cached.map((c) => c.url)).catch(console.warn);
          return;
        }
        
        // Fetch from API route (server-side has better permissions)
        const response = await fetch("/api/characters", {
          cache: "force-cache", // Use browser cache
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch characters" }));
          setError(errorData.error || "Failed to load characters");
          return;
        }

        const data = await response.json();
        
        if (data.characters && data.characters.length > 0) {
          setCharacters(data.characters);
          
          // Cache the result
          cache.setCharacters(data.characters);
          
          // Preload images in background
          preloadImages(data.characters.map((c: { url: string }) => c.url)).catch(console.warn);
        } else {
          setError("No character icons found in storage");
        }
      } catch (err) {
        console.error("Error fetching characters:", err);
        setError(err instanceof Error ? err.message : "Failed to load characters");
      } finally {
        setLoading(false);
      }
    }

    fetchCharacters();
  }, []);

  // Update selected icon when initialValue changes
  useEffect(() => {
    setSelectedIcon(initialValue);
  }, [initialValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Save selected icon to database
  const handleSelectIcon = async (iconUrl: string | null) => {
    setSelectedIcon(iconUrl);
    setIsOpen(false);
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

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
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

        {isOpen && (
          <div className="absolute z-50 mt-1 left-0 w-64 rounded-md border border-black/20 bg-white shadow-lg max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-black/10">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="w-full rounded-md border border-black/20 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.08)]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {error ? (
                <div className="p-3 text-sm text-red-600 text-center">
                  Error: {error}
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="p-3 text-sm text-black/60 text-center">
                  {loading ? "Loading..." : characters.length === 0 ? "No characters available" : "No characters match your search"}
                </div>
              ) : (
                <div className="p-1">
                  {filteredCharacters.map((character) => (
                    <button
                      key={character.url}
                      type="button"
                      onClick={() => handleSelectIcon(character.url)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                        selectedIcon === character.url
                          ? "bg-black/10 font-semibold"
                          : "hover:bg-black/5"
                      }`}
                    >
                      <LazyCharacterIcon character={character} />
                      <span className="truncate">{character.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIcon && (
              <div className="p-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => handleSelectIcon(null)}
                  className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        )}
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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
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
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-black/20 bg-white shadow-lg max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-black/10">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="w-full rounded-md border border-black/20 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.08)]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {error ? (
                <div className="p-3 text-sm text-red-600 text-center">
                  Error: {error}
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="p-3 text-sm text-black/60 text-center">
                  {loading ? "Loading..." : characters.length === 0 ? "No characters available" : "No characters match your search"}
                </div>
              ) : (
                <div className="p-1">
                  {filteredCharacters.map((character) => (
                    <button
                      key={character.url}
                      type="button"
                      onClick={() => handleSelectIcon(character.url)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                        selectedIcon === character.url
                          ? "bg-black/10 font-semibold"
                          : "hover:bg-black/5"
                      }`}
                    >
                      <LazyCharacterIcon character={character} />
                      <span className="truncate">{character.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIcon && (
              <div className="p-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => handleSelectIcon(null)}
                  className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

