"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HERO_SCOREBOARD_IMAGES, SCOREBOARD_OVERLAY_IMAGE } from "@/lib/assets";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialStyle: string | null;
};

const DEBOUNCE_MS = 400;

const STYLE_OPTIONS = [
  {
    value: HERO_SCOREBOARD_IMAGES[0],
    label: "Default",
    preview: HERO_SCOREBOARD_IMAGES[0],
  },
  {
    value: HERO_SCOREBOARD_IMAGES[1],
    label: "Melee",
    preview: HERO_SCOREBOARD_IMAGES[1],
  },
  {
    value: HERO_SCOREBOARD_IMAGES[2],
    label: "Guilty Gear",
    preview: HERO_SCOREBOARD_IMAGES[2],
  },
];

export function ScoreboardStyleSelector({ boardId, initialStyle }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedStyle, setSelectedStyle] = useState<string>(
    initialStyle || SCOREBOARD_OVERLAY_IMAGE
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedStyle(initialStyle || SCOREBOARD_OVERLAY_IMAGE);
  }, [boardId, initialStyle]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!boardId) return;

    const handler = setTimeout(async () => {
      setSaving(true);
      const { error: updateError } = await supabase
        .from("scoreboards")
        .update({ scoreboard_style: selectedStyle })
        .eq("id", boardId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setError(null);
      }
      setSaving(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, supabase, selectedStyle]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
        Scoreboard Design
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {STYLE_OPTIONS.map((option) => {
          const isSelected = selectedStyle === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedStyle(option.value)}
              className={`group relative flex flex-col items-center gap-1.5 sm:gap-2 rounded-xl border-2 p-2 sm:p-3 transition-all duration-150 ${
                isSelected
                  ? "border-black/40 bg-black/5 shadow-md"
                  : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md active:scale-[0.99]"
              }`}
            >
              <div className="relative h-12 sm:h-16 w-full overflow-hidden rounded-lg border border-black/10">
                <img
                  src={option.preview}
                  alt={option.label}
                  className="h-full w-full object-cover"
                />
              </div>
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-black">
        {saving ? <span>Saving…</span> : <span>Saved</span>}
        {error ? <span className="text-red-600">({error})</span> : null}
      </div>
    </div>
  );
}



