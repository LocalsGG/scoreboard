"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCOREBOARD_OVERLAY_IMAGE } from "@/lib/assets";
import { createClient } from "@/lib/supabase/client";
import type { ElementPositions, ScoreboardPreviewProps } from "@/lib/types";

type Props = ScoreboardPreviewProps;

type PreviewState = {
  name: string | null;
  aSide: string | null;
  bSide: string | null;
  aScore: number;
  bScore: number;
  updatedAt: string | null;
  style: string;
};

const DEFAULT_POSITIONS: ElementPositions = {
  title: { x: 720, y: 200 },
  a_side: { x: 100, y: 310 },
  b_side: { x: 1200, y: 310 },
  a_score: { x: 540, y: 400 },
  b_score: { x: 910, y: 400 },
};

const DEBOUNCE_MS = 500;

export function ScoreboardPreview({
  boardId,
  initialName,
  initialASide,
  initialBSide,
  initialAScore,
  initialBScore,
  initialUpdatedAt,
  initialStyle,
  initialPositions,
  readOnly = false,
}: Props) {
  const [state, setState] = useState<PreviewState>({
    name: initialName,
    aSide: initialASide,
    bSide: initialBSide,
    aScore: initialAScore ?? 0,
    bScore: initialBScore ?? 0,
    updatedAt: initialUpdatedAt,
    style: initialStyle || SCOREBOARD_OVERLAY_IMAGE,
  });

  const [positions, setPositions] = useState<ElementPositions>(
    initialPositions || DEFAULT_POSITIONS
  );

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const gradientId = useMemo(
    () => `scoreboard-preview-${(boardId || "default").replace(/[^a-zA-Z0-9]/g, "")}`,
    [boardId]
  );

  // Get SVG point from mouse event
  const getSVGPoint = useCallback((event: MouseEvent | React.MouseEvent) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    return svgPoint;
  }, []);

  // Save positions to database
  const savePositions = useCallback(
    async (newPositions: ElementPositions) => {
      if (!boardId || readOnly) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const { error, data } = await supabase
          .from("scoreboards")
          .update({ element_positions: newPositions })
          .eq("id", boardId)
          .select();

        if (error) {
          // Check if error is about missing column
          const errorMessage = error.message || String(error);
          const isColumnMissing = 
            errorMessage.includes("element_positions") ||
            errorMessage.includes("column") ||
            errorMessage.includes("does not exist");
          
          if (isColumnMissing) {
            console.warn(
              "element_positions column not found. Please run the migration:\n" +
              "Run the SQL in MIGRATION_add_element_positions.sql in your Supabase SQL Editor"
            );
          } else {
            console.error("Error saving positions:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
              fullError: error,
            });
          }
        }
      }, DEBOUNCE_MS);
    },
    [boardId, supabase, readOnly]
  );

  // Handle drag start
  const handleMouseDown = useCallback(
    (elementId: keyof ElementPositions, event: React.MouseEvent) => {
      if (readOnly) return;
      event.preventDefault();
      const svgPoint = getSVGPoint(event);
      if (!svgPoint) return;

      const currentPos = positions[elementId];
      setDragging(elementId);
      setDragOffset({
        x: svgPoint.x - currentPos.x,
        y: svgPoint.y - currentPos.y,
      });
    },
    [positions, getSVGPoint, readOnly]
  );

  // Handle drag
  useEffect(() => {
    if (!dragging || !dragOffset) return;

    const handleMouseMove = (event: MouseEvent) => {
      const svgPoint = getSVGPoint(event);
      if (!svgPoint) return;

      setPositions((prev) => {
        const newPositions = {
          ...prev,
          [dragging]: {
            x: svgPoint.x - dragOffset.x,
            y: svgPoint.y - dragOffset.y,
          },
        };
        savePositions(newPositions);
        return newPositions;
      });
    };

    const handleMouseUp = () => {
      setDragging(null);
      setDragOffset(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset, getSVGPoint, savePositions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      name: initialName,
      aSide: initialASide,
      bSide: initialBSide,
      aScore: initialAScore ?? 0,
      bScore: initialBScore ?? 0,
      updatedAt: initialUpdatedAt,
      style: initialStyle || SCOREBOARD_OVERLAY_IMAGE,
    });

    if (initialPositions) {
      setPositions(initialPositions);
    }
  }, [
    boardId,
    initialAScore,
    initialASide,
    initialBScore,
    initialBSide,
    initialName,
    initialUpdatedAt,
    initialStyle,
    initialPositions,
  ]);

  // Reset positions to default
  const resetPositions = useCallback(() => {
    if (readOnly) return;
    setPositions(DEFAULT_POSITIONS);
    savePositions(DEFAULT_POSITIONS);
  }, [readOnly, savePositions]);

  useEffect(() => {
    if (!boardId) return;

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
            style:
              typeof next.scoreboard_style === "string"
                ? next.scoreboard_style
                : prev.style || SCOREBOARD_OVERLAY_IMAGE,
          }));

          // Update positions if they changed
          if (next.element_positions && typeof next.element_positions === "object") {
            const newPositions = next.element_positions as ElementPositions;
            setPositions(newPositions);
          }
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

    const handleResetPositions = () => {
      resetPositions();
    };

    const handleScoreA = handleScore("aScore");
    const handleScoreB = handleScore("bScore");

    window.addEventListener(`board-name-local-${boardId}`, handleBoardName);
    window.addEventListener(`score-local-${boardId}-a_score`, handleScoreA);
    window.addEventListener(`score-local-${boardId}-b_score`, handleScoreB);
    window.addEventListener(`reset-positions-${boardId}`, handleResetPositions);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(`board-name-local-${boardId}`, handleBoardName);
      window.removeEventListener(`score-local-${boardId}-a_score`, handleScoreA);
      window.removeEventListener(`score-local-${boardId}-b_score`, handleScoreB);
      window.removeEventListener(`reset-positions-${boardId}`, handleResetPositions);
    };
  }, [boardId, supabase, resetPositions]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const formatLabel = (value: string | null, fallback: string, maxLength = 28) => {
    const trimmed = value?.trim();
    if (!trimmed) return fallback;
    return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}...` : trimmed;
  };

  const aLead = state.aScore > state.bScore;
  const bLead = state.bScore > state.aScore;

  const scoreboardTitle = formatLabel(state.name, "SCOREBOARD", 24);
  const aLabel = formatLabel(state.aSide, "A", 16);
  const bLabel = formatLabel(state.bSide, "B", 16);

  const isDragging = (elementId: keyof ElementPositions) => dragging === elementId;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox="0 135 1440 540"
        className="h-auto w-full drop-shadow-xl transition-transform duration-300 ease-out hover:scale-[1.01] rounded-lg"
        role="img"
        aria-label={`Preview of ${scoreboardTitle}`}
        style={{ aspectRatio: "1440 / 540", background: "transparent" }}
      >
      <defs>
        <filter id={`${gradientId}-text-shadow`} x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.65" />
        </filter>
      </defs>
      <image
        href={state.style}
        x="0"
        y="0"
        width="1440"
        height="810"
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: "none" }}
      />

      <text
        x={positions.title.x}
        y={positions.title.y}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize="72"
        fill="#f8fafc"
        stroke="#0b1220"
        strokeWidth="8"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="8"
        paintOrder="stroke fill"
        filter={`url(#${gradientId}-text-shadow)`}
        style={{
          cursor: readOnly ? "default" : "move",
          pointerEvents: "all",
          opacity: isDragging("title") ? 0.8 : 1,
        }}
        onMouseDown={(e) => handleMouseDown("title", e)}
      >
        {scoreboardTitle}
      </text>

      <text
        x={positions.a_side.x}
        y={positions.a_side.y}
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
        style={{
          cursor: readOnly ? "default" : "move",
          pointerEvents: "all",
          opacity: isDragging("a_side") ? 0.8 : 1,
        }}
        onMouseDown={(e) => handleMouseDown("a_side", e)}
      >
        {aLabel}
      </text>

      <text
        x={positions.b_side.x}
        y={positions.b_side.y}
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
        style={{
          cursor: readOnly ? "default" : "move",
          pointerEvents: "all",
          opacity: isDragging("b_side") ? 0.8 : 1,
        }}
        onMouseDown={(e) => handleMouseDown("b_side", e)}
      >
        {bLabel}
      </text>

      <text
        x={positions.a_score.x}
        y={positions.a_score.y}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize="110"
        fill={aLead ? "#ffffff" : "#f2f2f2"}
        stroke="#0b1220"
        fontWeight="800"
        textAnchor="middle"
        paintOrder="stroke fill"
        filter={`url(#${gradientId}-text-shadow)`}
        style={{
          cursor: readOnly ? "default" : "move",
          pointerEvents: "all",
          opacity: isDragging("a_score") ? 0.8 : 1,
        }}
        onMouseDown={(e) => handleMouseDown("a_score", e)}
      >
        {state.aScore}
      </text>

      <text
        x={positions.b_score.x}
        y={positions.b_score.y}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize="110"
        fill={bLead ? "#ffffff" : "#f2f2f2"}
        stroke="#0b1220"
        fontWeight="800"
        textAnchor="middle"
        paintOrder="stroke fill"
        filter={`url(#${gradientId}-text-shadow)`}
        style={{
          cursor: readOnly ? "default" : "move",
          pointerEvents: "all",
          opacity: isDragging("b_score") ? 0.8 : 1,
        }}
        onMouseDown={(e) => handleMouseDown("b_score", e)}
      >
        {state.bScore}
      </text>
    </svg>
    </div>
  );
}
