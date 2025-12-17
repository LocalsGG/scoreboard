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

export function CompactStyleSelector({ boardId, initialStyle }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedStyle, setSelectedStyle] = useState<string>(
    initialStyle || SCOREBOARD_OVERLAY_IMAGE
  );
  const [saving, setSaving] = useState(false);
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
      window.dispatchEvent(new CustomEvent("scoreboard-saving-start"));
      await supabase
        .from("scoreboards")
        .update({ scoreboard_style: selectedStyle })
        .eq("id", boardId);
      setSaving(false);
      window.dispatchEvent(new CustomEvent("scoreboard-saving-end"));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [boardId, supabase, selectedStyle]);

  return (
    <div className="flex items-center gap-1.5">
      {STYLE_OPTIONS.map((option) => {
        const isSelected = selectedStyle === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelectedStyle(option.value)}
            disabled={saving}
            className={`relative h-6 sm:h-7 w-auto rounded border-2 overflow-hidden transition-all duration-150 ${
              isSelected
                ? "border-black/40 bg-black/5 shadow-md scale-105"
                : "border-zinc-200 bg-white hover:border-black/20 hover:shadow-sm active:scale-95"
            } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={option.label}
          >
            <img
              src={option.preview}
              alt={option.label}
              className="h-full w-auto object-contain"
            />
            {isSelected && (
              <div className="absolute right-0.5 top-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3 items-center justify-center rounded-full bg-black">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white"
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
  );
}
