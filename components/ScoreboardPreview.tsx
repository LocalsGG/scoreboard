"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCOREBOARD_OVERLAY_IMAGE, GAME_CONFIGS, getSupabaseStorageUrl } from "@/lib/assets";
import { createClient } from "@/lib/supabase/client";
import type { ElementPositions, ScoreboardPreviewProps } from "@/lib/types";
import { getMergedPositions, DEFAULT_POSITIONS, DEBOUNCE_MS, DEFAULT_CENTER_TEXT_COLOR } from "./scoreboard-preview/constants";
import { usePreviewState } from "./scoreboard-preview/usePreviewState";
import { usePreviewSubscriptions } from "./scoreboard-preview/usePreviewSubscriptions";
import type { PreviewState } from "./scoreboard-preview/types";

type Props = ScoreboardPreviewProps & { isAuthenticated?: boolean };

export function ScoreboardPreview({
  boardId,
  initialName,
  initialSubtitle,
  initialASide,
  initialBSide,
  initialAScore,
  initialBScore,
  initialUpdatedAt,
  initialStyle,
  initialPositions,
  initialTitleVisible = true,
  initialASideIcon,
  initialBSideIcon,
  initialCenterTextColor,
  initialCustomLogoUrl,
  initialScoreboardType,
  readOnly = false,
  onUndoRedoReady,
  isAuthenticated = false,
}: Props) {
  const [state, setState] = useState<PreviewState>({
    name: initialName,
    subtitle: initialSubtitle ?? null,
    aSide: initialASide,
    bSide: initialBSide,
    aScore: initialAScore ?? 0,
    bScore: initialBScore ?? 0,
    updatedAt: initialUpdatedAt,
    style: initialStyle || SCOREBOARD_OVERLAY_IMAGE,
    titleVisible: initialTitleVisible ?? true,
    aSideIcon: initialASideIcon ?? null,
    bSideIcon: initialBSideIcon ?? null,
    centerTextColor: initialCenterTextColor || DEFAULT_CENTER_TEXT_COLOR,
    customLogoUrl: initialCustomLogoUrl ?? null,
    scoreboardType: initialScoreboardType ?? null,
  });

  const [positions, setPositions] = useState<ElementPositions>(
    getMergedPositions(initialPositions, initialScoreboardType)
  );

  // Store the initial positions to restore on reset
  const initialPositionsRef = useRef<ElementPositions>(
    getMergedPositions(initialPositions, initialScoreboardType)
  );

  // Undo/Redo history
  type HistorySnapshot = {
    positions: ElementPositions;
    state: PreviewState;
  };
  const [history, setHistory] = useState<HistorySnapshot[]>([
    { positions: getMergedPositions(initialPositions, initialScoreboardType), state: { name: initialName, subtitle: initialSubtitle ?? null, aSide: initialASide, bSide: initialBSide, aScore: initialAScore ?? 0, bScore: initialBScore ?? 0, updatedAt: initialUpdatedAt, style: initialStyle || SCOREBOARD_OVERLAY_IMAGE, titleVisible: initialTitleVisible ?? true, aSideIcon: initialASideIcon ?? null, bSideIcon: initialBSideIcon ?? null, centerTextColor: initialCenterTextColor || DEFAULT_CENTER_TEXT_COLOR, customLogoUrl: initialCustomLogoUrl ?? null, scoreboardType: initialScoreboardType ?? null } },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

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
        const { error } = await supabase
          .from("scoreboards")
          .update({ element_positions: newPositions })
          .eq("id", boardId)
          .select();

        if (error) {
          return;
        }
      }, DEBOUNCE_MS);
    },
    [boardId, supabase, readOnly]
  );

  // Add to history
  const addToHistory = useCallback((newPositions: ElementPositions, newState: PreviewState) => {
    if (isUndoRedoRef.current) return;
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ positions: JSON.parse(JSON.stringify(newPositions)), state: JSON.parse(JSON.stringify(newState)) });
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && !readOnly) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      const snapshot = history[newIndex];
      setPositions(snapshot.positions);
      setState(snapshot.state);
      setHistoryIndex(newIndex);
      
      // Save to database
      savePositions(snapshot.positions);
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [history, historyIndex, readOnly, savePositions]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1 && !readOnly) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      const snapshot = history[newIndex];
      setPositions(snapshot.positions);
      setState(snapshot.state);
      setHistoryIndex(newIndex);
      
      // Save to database
      savePositions(snapshot.positions);
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [history, historyIndex, readOnly, savePositions]);

  // Keyboard shortcuts
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [readOnly, handleUndo, handleRedo]);


  // Handle drag start
  const handleMouseDown = useCallback(
    (elementId: keyof ElementPositions, event: React.MouseEvent) => {
      if (readOnly) return;
      event.preventDefault();
      const svgPoint = getSVGPoint(event);
      if (!svgPoint) return;

      const currentPos = positions[elementId] ?? DEFAULT_POSITIONS[elementId];
      if (!currentPos) return;

      setDragging(elementId);
      setDragOffset({
        x: svgPoint.x - currentPos.x,
        y: svgPoint.y - currentPos.y,
      });
    },
    [positions, getSVGPoint, readOnly]
  );

  // Handle logo drag start
  const handleLogoMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (readOnly) return;
      event.preventDefault();
      event.stopPropagation();
      
      const svgPoint = getSVGPoint(event);
      if (!svgPoint) return;

      const logo = positions.logo;
      if (!logo) return;

      setDragging("logo");
      setDragOffset({
        x: svgPoint.x - logo.x,
        y: svgPoint.y - logo.y,
      });
    },
    [positions, getSVGPoint, readOnly]
  );

  // Handle icon drag start
  const handleIconMouseDown = useCallback(
    (elementId: "a_side_icon" | "b_side_icon", event: React.MouseEvent) => {
      if (readOnly) return;
      event.preventDefault();
      event.stopPropagation();
      
      const svgPoint = getSVGPoint(event);
      if (!svgPoint) return;

      const icon = positions[elementId];
      if (!icon) return;

      setDragging(elementId);
      setDragOffset({
        x: svgPoint.x - icon.x,
        y: svgPoint.y - icon.y,
      });
    },
    [positions, getSVGPoint, readOnly]
  );

  // Handle drag
  useEffect(() => {
    if (!dragging || !dragOffset) return;

    let lastPositions: ElementPositions | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      const svgPoint = getSVGPoint(event);
      if (!svgPoint) return;

      setPositions((prev) => {
        const elementId = dragging as keyof ElementPositions;
        const currentElement = prev[elementId];
        if (!currentElement) return prev;
        
        const updatedElement = {
          ...currentElement,
          x: svgPoint.x - dragOffset.x,
          y: svgPoint.y - dragOffset.y,
        };
        
        const newPositions: ElementPositions = {
          ...prev,
        };
        (newPositions as any)[elementId] = updatedElement;
        
        lastPositions = newPositions;
        savePositions(newPositions);
        return newPositions;
      });
    };

    const handleMouseUp = () => {
      // Add to history when drag ends
      if (lastPositions) {
        addToHistory(lastPositions, state);
      }
      setDragging(null);
      setDragOffset(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset, getSVGPoint, savePositions, state, addToHistory]);


  // Update state when initial values change (excluding positions-related changes)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      name: initialName,
      subtitle: initialSubtitle ?? null,
      aSide: initialASide,
      bSide: initialBSide,
      aScore: initialAScore ?? 0,
      bScore: initialBScore ?? 0,
      updatedAt: initialUpdatedAt,
      style: initialStyle || SCOREBOARD_OVERLAY_IMAGE,
      titleVisible: initialTitleVisible ?? true,
      aSideIcon: initialASideIcon ?? null,
      bSideIcon: initialBSideIcon ?? null,
      centerTextColor: initialCenterTextColor || DEFAULT_CENTER_TEXT_COLOR,
      customLogoUrl: initialCustomLogoUrl ?? null,
      scoreboardType: initialScoreboardType ?? null,
    });
  }, [
    boardId,
    initialAScore,
    initialASide,
    initialBScore,
    initialBSide,
    initialName,
    initialSubtitle,
    initialUpdatedAt,
    initialStyle,
    initialTitleVisible,
    initialASideIcon,
    initialBSideIcon,
    initialCenterTextColor,
    initialCustomLogoUrl,
    initialScoreboardType,
  ]);

  // Update positions only when positions or scoreboard type change (NOT when name changes)
  useEffect(() => {
    // Merge initial positions with defaults to ensure logo position exists
    const positionsToUse = getMergedPositions(initialPositions, initialScoreboardType);
    setPositions(positionsToUse);
    // Update the ref to store the initial positions for reset
    initialPositionsRef.current = positionsToUse;
  }, [boardId, initialPositions, initialScoreboardType]);

  // Reset positions to initial (what they were when component loaded)
  const resetPositions = useCallback(() => {
    if (readOnly) return;
    const positionsToReset = initialPositionsRef.current;
    setPositions(positionsToReset);
    savePositions(positionsToReset);
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
            subtitle: typeof next.scoreboard_subtitle === "string" ? next.scoreboard_subtitle : prev.subtitle,
            aSide: typeof next.a_side === "string" ? next.a_side : prev.aSide,
            bSide: typeof next.b_side === "string" ? next.b_side : prev.bSide,
            aScore: typeof next.a_score === "number" ? next.a_score : prev.aScore,
            bScore: typeof next.b_score === "number" ? next.b_score : prev.bScore,
            updatedAt: typeof next.updated_at === "string" ? next.updated_at : prev.updatedAt,
            style:
              typeof next.scoreboard_style === "string"
                ? next.scoreboard_style
                : prev.style || SCOREBOARD_OVERLAY_IMAGE,
            titleVisible:
              typeof next.title_visible === "boolean" ? next.title_visible : prev.titleVisible ?? true,
            aSideIcon: typeof next.a_side_icon === "string" ? next.a_side_icon : prev.aSideIcon,
            bSideIcon: typeof next.b_side_icon === "string" ? next.b_side_icon : prev.bSideIcon,
            centerTextColor:
              typeof next.center_text_color === "string"
                ? next.center_text_color
                : prev.centerTextColor || DEFAULT_CENTER_TEXT_COLOR,
            customLogoUrl:
              typeof next.custom_logo_url === "string" ? next.custom_logo_url : prev.customLogoUrl ?? null,
            scoreboardType:
              typeof next.scoreboard_type === "string" ? next.scoreboard_type as "melee" | "ultimate" | "guilty-gear" | "generic" : prev.scoreboardType ?? null,
          }));

          // Update positions if they changed
          if (next.element_positions && typeof next.element_positions === "object") {
            const scoreboardType = typeof next.scoreboard_type === "string" 
              ? next.scoreboard_type as "melee" | "ultimate" | "guilty-gear" | "generic" 
              : state.scoreboardType;
            const newPositions = getMergedPositions(next.element_positions as ElementPositions, scoreboardType);
            setPositions(newPositions);
          }
        }
      )
      .subscribe();

    const handleBoardName = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setState((prev) => ({ ...prev, name: detail ?? prev.name }));
    };

    const handleBoardSubtitle = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setState((prev) => ({ ...prev, subtitle: detail ?? prev.subtitle }));
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

    const handleTitleVisibility = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      setState((prev) => ({ ...prev, titleVisible: detail }));
    };

    const handleCenterTextColor = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setState((prev) => ({ ...prev, centerTextColor: detail }));
      }
    };

    const handleCustomLogo = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail;
      setState((prev) => ({ ...prev, customLogoUrl: detail ?? null }));
    };

    const handleScoreboardType = (event: Event) => {
      const detail = (event as CustomEvent<"melee" | "ultimate" | "guilty-gear" | "generic" | null>).detail;
      setState((prev) => ({ ...prev, scoreboardType: detail ?? null }));
    };

    const handleScoreA = handleScore("aScore");
    const handleScoreB = handleScore("bScore");

    window.addEventListener(`board-name-local-${boardId}`, handleBoardName);
    window.addEventListener(`board-subtitle-local-${boardId}`, handleBoardSubtitle);
    window.addEventListener(`score-local-${boardId}-a_score`, handleScoreA);
    window.addEventListener(`score-local-${boardId}-b_score`, handleScoreB);
    window.addEventListener(`reset-positions-${boardId}`, handleResetPositions);
    window.addEventListener(`title-visibility-${boardId}`, handleTitleVisibility);
    window.addEventListener(`center-text-color-local-${boardId}`, handleCenterTextColor);
    window.addEventListener(`custom-logo-local-${boardId}`, handleCustomLogo);
    window.addEventListener(`scoreboard-type-local-${boardId}`, handleScoreboardType);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(`board-name-local-${boardId}`, handleBoardName);
      window.removeEventListener(`board-subtitle-local-${boardId}`, handleBoardSubtitle);
      window.removeEventListener(`score-local-${boardId}-a_score`, handleScoreA);
      window.removeEventListener(`score-local-${boardId}-b_score`, handleScoreB);
      window.removeEventListener(`reset-positions-${boardId}`, handleResetPositions);
      window.removeEventListener(`title-visibility-${boardId}`, handleTitleVisibility);
      window.removeEventListener(`center-text-color-local-${boardId}`, handleCenterTextColor);
      window.removeEventListener(`custom-logo-local-${boardId}`, handleCustomLogo);
      window.removeEventListener(`scoreboard-type-local-${boardId}`, handleScoreboardType);
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

  // Helper to safely get a number value, handling NaN
  const safeNumber = (value: number | undefined | null, fallback: number): number => {
    if (value == null || Number.isNaN(value)) return fallback;
    return value;
  };

  const aLead = state.aScore > state.bScore;
  const bLead = state.bScore > state.aScore;

  const scoreboardTitle = formatLabel(state.name, "SCOREBOARD", 24);
  const scoreboardSubtitle = formatLabel(state.subtitle, "", 32);
  const aLabel = formatLabel(state.aSide, "A", 16);
  const bLabel = formatLabel(state.bSide, "B", 16);
  // Use custom logo URL or default to generic logo
  const DEFAULT_LOGO_URL = `${getSupabaseStorageUrl()}/${GAME_CONFIGS.generic.icon}`;
  const gameIconUrl = state.customLogoUrl || DEFAULT_LOGO_URL;

  const isDragging = (elementId: keyof ElementPositions) => dragging === elementId;

  // Extract logo with defaults for type safety
  const logo: { x: number; y: number; width: number; height: number } | null = positions.logo ? {
    x: safeNumber(positions.logo.x, DEFAULT_POSITIONS.logo.x),
    y: safeNumber(positions.logo.y, DEFAULT_POSITIONS.logo.y),
    width: safeNumber(positions.logo.width, safeNumber(DEFAULT_POSITIONS.logo.width, 64)),
    height: safeNumber(positions.logo.height, safeNumber(DEFAULT_POSITIONS.logo.height, 64)),
  } : null;

  // Store latest handlers in ref
  const handlersRef = useRef({ onUndo: handleUndo, onRedo: handleRedo });
  handlersRef.current = { onUndo: handleUndo, onRedo: handleRedo };

  // Expose undo/redo handlers to parent
  const prevStateRef = useRef<{ canUndo: boolean; canRedo: boolean } | null>(null);

  useEffect(() => {
    if (!readOnly && onUndoRedoReady) {
      const canUndo = historyIndex > 0;
      const canRedo = historyIndex < history.length - 1;
      
      // Only call if canUndo/canRedo state actually changed
      const prevState = prevStateRef.current;
      if (
        !prevState ||
        prevState.canUndo !== canUndo ||
        prevState.canRedo !== canRedo
      ) {
        prevStateRef.current = { canUndo, canRedo };
        onUndoRedoReady({
          onUndo: handlersRef.current.onUndo,
          onRedo: handlersRef.current.onRedo,
          canUndo,
          canRedo,
        });
      }
    }
  }, [readOnly, onUndoRedoReady, historyIndex, history.length]);

  return (
    <div className="relative w-full">
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

      {state.titleVisible && state.name && state.name.trim() && (
        <text
          x={safeNumber(positions.title.x, DEFAULT_POSITIONS.title.x)}
          y={safeNumber(positions.title.y, DEFAULT_POSITIONS.title.y)}
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize={positions.title.fontSize ?? 72}
          fill={state.centerTextColor}
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
      )}

      {scoreboardSubtitle && (
        <text
          x={safeNumber(positions.subtitle?.x, safeNumber(DEFAULT_POSITIONS.subtitle?.x, 720))}
          y={safeNumber(positions.subtitle?.y, safeNumber(DEFAULT_POSITIONS.subtitle?.y, 600))}
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize={positions.subtitle?.fontSize ?? 48}
          fill={state.centerTextColor}
          stroke="#0b1220"
          strokeWidth="6"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="4"
          paintOrder="stroke fill"
          filter={`url(#${gradientId}-text-shadow)`}
          style={{
            cursor: readOnly ? "default" : "move",
            pointerEvents: "all",
            opacity: isDragging("subtitle") ? 0.8 : 1,
          }}
          onMouseDown={(e) => handleMouseDown("subtitle", e)}
        >
          {scoreboardSubtitle}
        </text>
      )}

      <text
        x={safeNumber(positions.a_side.x, DEFAULT_POSITIONS.a_side.x)}
        y={safeNumber(positions.a_side.y, DEFAULT_POSITIONS.a_side.y)}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize={positions.a_side.fontSize ?? 60}
        fill={state.centerTextColor}
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
        x={safeNumber(positions.b_side.x, DEFAULT_POSITIONS.b_side.x)}
        y={safeNumber(positions.b_side.y, DEFAULT_POSITIONS.b_side.y)}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize={positions.b_side.fontSize ?? 60}
        fill={state.centerTextColor}
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
        x={safeNumber(positions.a_score.x, DEFAULT_POSITIONS.a_score.x)}
        y={safeNumber(positions.a_score.y, DEFAULT_POSITIONS.a_score.y)}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize={positions.a_score.fontSize ?? 110}
        fill={state.centerTextColor}
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
        x={safeNumber(positions.b_score.x, DEFAULT_POSITIONS.b_score.x)}
        y={safeNumber(positions.b_score.y, DEFAULT_POSITIONS.b_score.y)}
        fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
        fontSize={positions.b_score.fontSize ?? 110}
        fill={state.centerTextColor}
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

      {logo && (
        <g>
          <image
            href={gameIconUrl}
            x={logo.x - (logo.width / 2)}
            y={logo.y - (logo.height / 2)}
            width={logo.width}
            height={logo.height}
            preserveAspectRatio="xMidYMid meet"
            style={{
              cursor: readOnly ? "default" : "move",
              pointerEvents: "all",
              opacity: isDragging("logo") ? 0.8 : 1,
            }}
            onMouseDown={(e) => {
              if (!readOnly) {
                handleLogoMouseDown(e);
              }
            }}
          />
        </g>
      )}

      {state.aSideIcon && (
        <image
          href={state.aSideIcon}
          x={safeNumber(positions.a_side_icon?.x, safeNumber(DEFAULT_POSITIONS.a_side_icon?.x, 200)) - (safeNumber(positions.a_side_icon?.width, safeNumber(DEFAULT_POSITIONS.a_side_icon?.width, 64)) / 2)}
          y={safeNumber(positions.a_side_icon?.y, safeNumber(DEFAULT_POSITIONS.a_side_icon?.y, 310)) - (safeNumber(positions.a_side_icon?.height, safeNumber(DEFAULT_POSITIONS.a_side_icon?.height, 64)) / 2)}
          width={safeNumber(positions.a_side_icon?.width, safeNumber(DEFAULT_POSITIONS.a_side_icon?.width, 64))}
          height={safeNumber(positions.a_side_icon?.height, safeNumber(DEFAULT_POSITIONS.a_side_icon?.height, 64))}
          preserveAspectRatio="xMidYMid meet"
          style={{
            cursor: readOnly ? "default" : "move",
            pointerEvents: "all",
            opacity: isDragging("a_side_icon") ? 0.8 : 1,
          }}
          onMouseDown={(e) => {
            if (!readOnly) {
              handleIconMouseDown("a_side_icon", e);
            }
          }}
        />
      )}

      {state.bSideIcon && (
        <image
          href={state.bSideIcon}
          x={safeNumber(positions.b_side_icon?.x, safeNumber(DEFAULT_POSITIONS.b_side_icon?.x, 1240)) - (safeNumber(positions.b_side_icon?.width, safeNumber(DEFAULT_POSITIONS.b_side_icon?.width, 64)) / 2)}
          y={safeNumber(positions.b_side_icon?.y, safeNumber(DEFAULT_POSITIONS.b_side_icon?.y, 310)) - (safeNumber(positions.b_side_icon?.height, safeNumber(DEFAULT_POSITIONS.b_side_icon?.height, 64)) / 2)}
          width={safeNumber(positions.b_side_icon?.width, safeNumber(DEFAULT_POSITIONS.b_side_icon?.width, 64))}
          height={safeNumber(positions.b_side_icon?.height, safeNumber(DEFAULT_POSITIONS.b_side_icon?.height, 64))}
          preserveAspectRatio="xMidYMid meet"
          style={{
            cursor: readOnly ? "default" : "move",
            pointerEvents: "all",
            opacity: isDragging("b_side_icon") ? 0.8 : 1,
          }}
          onMouseDown={(e) => {
            if (!readOnly) {
              handleIconMouseDown("b_side_icon", e);
            }
          }}
        />
      )}
    </svg>
    </div>
  );
}
