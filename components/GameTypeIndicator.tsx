"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GAME_CONFIGS, getSupabaseStorageUrl } from "@/lib/assets";
import type { ScoreboardType } from "@/lib/types";

const SUPABASE_PUBLIC_IMAGE_BASE = getSupabaseStorageUrl();

type Props = {
  boardId: string;
  initialType: ScoreboardType | null;
};

export function GameTypeIndicator({ boardId, initialType }: Props) {
  const [gameType, setGameType] = useState<ScoreboardType | null>(initialType);

  useEffect(() => {
    setGameType(initialType);
  }, [initialType]);

  // Listen for scoreboard type changes
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      setGameType(event.detail);
    };

    const eventName = `scoreboard-type-local-${boardId}`;
    window.addEventListener(eventName, handleTypeChange as EventListener);

    return () => {
      window.removeEventListener(eventName, handleTypeChange as EventListener);
    };
  }, [boardId]);

  if (!gameType || !(gameType in GAME_CONFIGS)) {
    return null;
  }

  const config = GAME_CONFIGS[gameType];
  const iconUrl = `${SUPABASE_PUBLIC_IMAGE_BASE}/${config.icon}`;

  return (
    <div className="flex items-center gap-2 text-right">
      <Image
        src={iconUrl}
        alt={config.displayName}
        width={16}
        height={16}
        className="h-4 w-4 flex-shrink-0"
        unoptimized
      />
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {config.displayName}
      </p>
    </div>
  );
}

