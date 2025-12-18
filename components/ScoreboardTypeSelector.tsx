"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ScoreboardType } from "@/lib/types";
import Image from "next/image";

type Props = {
  boardId: string;
  initialValue: ScoreboardType | null;
};

import { GAME_CONFIGS, getSupabaseStorageUrl } from "@/lib/assets";

const SUPABASE_PUBLIC_IMAGE_BASE = getSupabaseStorageUrl();

const DEBOUNCE_MS = 400;

export function ScoreboardTypeSelector({ boardId, initialValue }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<ScoreboardType | null>(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    setValue(initialValue);
  }, [boardId, initialValue]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!boardId || value === initialValue) return;

    setSaving(true);
    setError(null);
    window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));

    const handler = setTimeout(async () => {
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ scoreboard_type: value })
        .eq("id", boardId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setError(null);
      }
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
      
      // Broadcast change for preview
      window.dispatchEvent(new CustomEvent(`scoreboard-type-local-${boardId}`, { detail: value }));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, value, initialValue, supabase]);

  const handleChange = (newType: ScoreboardType) => {
    setValue(newType);
  };

  const scoreboardTypes: ScoreboardType[] = ["melee", "ultimate", "guilty-gear", "generic"];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-black">
        Game Type
      </label>
      <div className="grid grid-cols-2 gap-2">
        {scoreboardTypes.map((type) => {
          const config = GAME_CONFIGS[type];
          const isSelected = value === type;
          const iconUrl = `${SUPABASE_PUBLIC_IMAGE_BASE}/${config.icon}`;

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleChange(type)}
              disabled={saving}
              className={`flex items-center gap-2 rounded-lg border-2 p-2 transition-all duration-150 ${
                isSelected
                  ? "border-black bg-black/5"
                  : "border-black/15 bg-white hover:border-black/30 hover:bg-white"
              } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <Image
                src={iconUrl}
                alt={config.displayName}
                width={20}
                height={20}
                className="h-5 w-5 flex-shrink-0"
                unoptimized
              />
              <span className="text-xs font-semibold text-black truncate">
                {config.displayName}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <div className="text-xs text-red-600">
          <span>({error})</span>
        </div>
      )}
    </div>
  );
}


