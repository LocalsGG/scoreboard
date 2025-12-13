"use client";

import { useEffect, useMemo, useState } from "react";
import { SCOREBOARD_OVERLAY_IMAGE } from "@/lib/assets";
import { formatDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";

type Props = {
  boardId: string;
  initialName: string | null;
  initialASide: string | null;
  initialBSide: string | null;
  initialAScore: number | null;
  initialBScore: number | null;
  initialUpdatedAt: string | null;
};

type PreviewState = {
  name: string | null;
  aSide: string | null;
  bSide: string | null;
  aScore: number;
  bScore: number;
  updatedAt: string | null;
};

export function ScoreboardPreview({
  boardId,
  initialName,
  initialASide,
  initialBSide,
  initialAScore,
  initialBScore,
  initialUpdatedAt,
}: Props) {
  const [state, setState] = useState<PreviewState>({
    name: initialName,
    aSide: initialASide,
    bSide: initialBSide,
    aScore: initialAScore ?? 0,
    bScore: initialBScore ?? 0,
    updatedAt: initialUpdatedAt,
  });

  const gradientId = useMemo(
    () => `scoreboard-preview-${(boardId || "default").replace(/[^a-zA-Z0-9]/g, "")}`,
    [boardId]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      name: initialName,
      aSide: initialASide,
      bSide: initialBSide,
      aScore: initialAScore ?? 0,
      bScore: initialBScore ?? 0,
      updatedAt: initialUpdatedAt,
    });
  }, [boardId, initialAScore, initialASide, initialBScore, initialBSide, initialName, initialUpdatedAt]);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`scoreboard-preview-${boardId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scoreboards", filter: `id=eq.${boardId}` },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          setState((prev) => ({
            name: typeof next.name === "string" ? next.name : prev.name,
            aSide: typeof next.a_side === "string" ? next.a_side : prev.aSide,
            bSide: typeof next.b_side === "string" ? next.b_side : prev.bSide,
            aScore: typeof next.a_score === "number" ? next.a_score : prev.aScore,
            bScore: typeof next.b_score === "number" ? next.b_score : prev.bScore,
            updatedAt: typeof next.updated_at === "string" ? next.updated_at : prev.updatedAt,
          }));
        }
      )
      .subscribe();

    const handleBoardName = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setState((prev) => ({ ...prev, name: detail ?? prev.name }));
    };

    const handleScore = (column: "aScore" | "bScore") => (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") {
        setState((prev) => ({ ...prev, [column]: detail }));
      }
    };

    const handleScoreA = handleScore("aScore");
    const handleScoreB = handleScore("bScore");

    window.addEventListener(`board-name-local-${boardId}`, handleBoardName);
    window.addEventListener(`score-local-${boardId}-a_score`, handleScoreA);
    window.addEventListener(`score-local-${boardId}-b_score`, handleScoreB);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(`board-name-local-${boardId}`, handleBoardName);
      window.removeEventListener(`score-local-${boardId}-a_score`, handleScoreA);
      window.removeEventListener(`score-local-${boardId}-b_score`, handleScoreB);
    };
  }, [boardId]);

  const formatLabel = (value: string | null, fallback: string, maxLength = 28) => {
    const trimmed = value?.trim();
    if (!trimmed) return fallback;
    return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}...` : trimmed;
  };

  const formattedUpdatedAt = formatDateTime(state.updatedAt);
  const aLead = state.aScore > state.bScore;
  const bLead = state.bScore > state.aScore;

  const scoreboardTitle = formatLabel(state.name, "SUPER SMASH!", 24);
  const aLabel = formatLabel(state.aSide, "ASHRAF", 16);
  const bLabel = formatLabel(state.bSide, "TARIQ", 16);

  return (
    <svg
      viewBox="0 0 1440 810"
      className="h-auto w-full drop-shadow-xl transition-transform duration-300 ease-out hover:scale-[1.01]"
      role="img"
      aria-label={`Preview of ${scoreboardTitle}`}
      style={{ aspectRatio: "1440 / 810", background: "transparent" }}
    >
        <defs>
          <filter id={`${gradientId}-text-shadow`} x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.65" />
          </filter>
        </defs>
        <image
          href={SCOREBOARD_OVERLAY_IMAGE}
          x="0"
          y="0"
          width="1440"
          height="810"
          preserveAspectRatio="xMidYMid meet"
        />

        <text
          x="720"
          y="270"
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="72"
          fill="#f8fafc"
          stroke="#0b1220"
          strokeWidth="8"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="3"
          paintOrder="stroke fill"
          filter={`url(#${gradientId}-text-shadow)`}
        >
          {scoreboardTitle}
        </text>

        <text
          x="100"
          y="450"
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="60"
          fill="#f8fafc"
          stroke="#0b1220"
          strokeWidth="6"
          fontWeight="800"
          textAnchor="start"
          letterSpacing="2"
          paintOrder="stroke fill"
          filter={`url(#${gradientId}-text-shadow)`}
        >
          {aLabel}
        </text>
        <text
          x="1200"
          y="450"
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="60"
          fill="#f8fafc"
          stroke="#0b1220"
          strokeWidth="6"
          fontWeight="800"
          textAnchor="end"
          letterSpacing="2"
          paintOrder="stroke fill"
          filter={`url(#${gradientId}-text-shadow)`}
        >
          {bLabel}
        </text>

        <text
          x="540"
          y="465"
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="110"
          fill={aLead ? "#ffffff" : "#f2f2f2"}
          stroke="#0b1220"
          fontWeight="800"
          textAnchor="middle"
          paintOrder="stroke fill"
          filter={`url(#${gradientId}-text-shadow)`}
        >
          {state.aScore}
        </text>
        <text
          x="910"
          y="465"
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="110"
          fill={bLead ? "#ffffff" : "#f2f2f2"}
          stroke="#0b1220"
          fontWeight="800"
          textAnchor="middle"
          paintOrder="stroke fill"
          filter={`url(#${gradientId}-text-shadow)`}
        >
          {state.bScore}
        </text>

    </svg>
  );
}
