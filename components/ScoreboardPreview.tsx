"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCOREBOARD_OVERLAY_IMAGE, getGameIcon } from "@/lib/assets";
import { createClient } from "@/lib/supabase/client";
import type { ElementPositions, ScoreboardPreviewProps } from "@/lib/types";

type Props = ScoreboardPreviewProps;

type PreviewState = {
  name: string | null;
  subtitle: string | null;
  aSide: string | null;
  bSide: string | null;
  aScore: number;
  bScore: number;
  updatedAt: string | null;
  style: string;
  titleVisible: boolean;
  aSideIcon: string | null;
  bSideIcon: string | null;
  centerTextColor: string;
  customLogoUrl: string | null;
};

const DEFAULT_POSITIONS: ElementPositions = {
  title: { x: 720, y: 200, fontSize: 72 },
  subtitle: { x: 720, y: 600, fontSize: 48 },
  logo: { x: 720, y: 405, width: 64, height: 64 },
  a_side: { x: 100, y: 310, fontSize: 60 },
  b_side: { x: 1200, y: 310, fontSize: 60 },
  a_score: { x: 540, y: 400, fontSize: 110 },
  b_score: { x: 910, y: 400, fontSize: 110 },
  a_side_icon: { x: 200, y: 310, width: 64, height: 64 },
  b_side_icon: { x: 1240, y: 310, width: 64, height: 64 },
};

// Merge positions with defaults to ensure logo position exists and fontSize is set
function getMergedPositions(positions: ElementPositions | null | undefined): ElementPositions {
  if (!positions) return DEFAULT_POSITIONS;
  
  const merged = { ...DEFAULT_POSITIONS, ...positions };
  // Ensure logo has width and height
  if (merged.logo && (!merged.logo.width || !merged.logo.height)) {
    merged.logo = {
      ...merged.logo,
      width: merged.logo.width ?? DEFAULT_POSITIONS.logo.width ?? 64,
      height: merged.logo.height ?? DEFAULT_POSITIONS.logo.height ?? 64,
    };
  }
  // Ensure fontSize is set for text elements
  if (merged.title && !merged.title.fontSize) {
    merged.title.fontSize = DEFAULT_POSITIONS.title.fontSize ?? 72;
  }
  if (merged.subtitle && !merged.subtitle.fontSize) {
    merged.subtitle.fontSize = DEFAULT_POSITIONS.subtitle?.fontSize ?? 48;
  }
  if (merged.a_side && !merged.a_side.fontSize) {
    merged.a_side.fontSize = DEFAULT_POSITIONS.a_side.fontSize ?? 60;
  }
  if (merged.b_side && !merged.b_side.fontSize) {
    merged.b_side.fontSize = DEFAULT_POSITIONS.b_side.fontSize ?? 60;
  }
  if (merged.a_score && !merged.a_score.fontSize) {
    merged.a_score.fontSize = DEFAULT_POSITIONS.a_score.fontSize ?? 110;
  }
  if (merged.b_score && !merged.b_score.fontSize) {
    merged.b_score.fontSize = DEFAULT_POSITIONS.b_score.fontSize ?? 110;
  }
  // Ensure icon sizes are set
  if (merged.a_side_icon && (!merged.a_side_icon.width || !merged.a_side_icon.height)) {
    merged.a_side_icon = {
      ...merged.a_side_icon,
      width: merged.a_side_icon.width ?? DEFAULT_POSITIONS.a_side_icon?.width ?? 64,
      height: merged.a_side_icon.height ?? DEFAULT_POSITIONS.a_side_icon?.height ?? 64,
    };
  }
  if (merged.b_side_icon && (!merged.b_side_icon.width || !merged.b_side_icon.height)) {
    merged.b_side_icon = {
      ...merged.b_side_icon,
      width: merged.b_side_icon.width ?? DEFAULT_POSITIONS.b_side_icon?.width ?? 64,
      height: merged.b_side_icon.height ?? DEFAULT_POSITIONS.b_side_icon?.height ?? 64,
    };
  }
  return merged;
}

const DEBOUNCE_MS = 500;

const DEFAULT_CENTER_TEXT_COLOR = "#f8fafc";

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
  readOnly = false,
  onUndoRedoReady,
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
  });

  const [positions, setPositions] = useState<ElementPositions>(
    getMergedPositions(initialPositions)
  );

  // Store the initial positions to restore on reset
  const initialPositionsRef = useRef<ElementPositions>(
    getMergedPositions(initialPositions)
  );

  // Undo/Redo history
  type HistorySnapshot = {
    positions: ElementPositions;
    state: PreviewState;
  };
  const [history, setHistory] = useState<HistorySnapshot[]>([
    { positions: getMergedPositions(initialPositions), state: { name: initialName, subtitle: initialSubtitle ?? null, aSide: initialASide, bSide: initialBSide, aScore: initialAScore ?? 0, bScore: initialBScore ?? 0, updatedAt: initialUpdatedAt, style: initialStyle || SCOREBOARD_OVERLAY_IMAGE, titleVisible: initialTitleVisible ?? true, aSideIcon: initialASideIcon ?? null, bSideIcon: initialBSideIcon ?? null, centerTextColor: initialCenterTextColor || DEFAULT_CENTER_TEXT_COLOR, customLogoUrl: initialCustomLogoUrl ?? null } },
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
    });

    // Merge initial positions with defaults to ensure logo position exists
    const positionsToUse = getMergedPositions(initialPositions);
    setPositions(positionsToUse);
    // Update the ref to store the initial positions for reset
    initialPositionsRef.current = positionsToUse;
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
    initialPositions,
    initialTitleVisible,
    initialASideIcon,
    initialBSideIcon,
    initialCenterTextColor,
    initialCustomLogoUrl,
  ]);

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
          }));

          // Update positions if they changed
          if (next.element_positions && typeof next.element_positions === "object") {
            const newPositions = getMergedPositions(next.element_positions as ElementPositions);
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
  const scoreboardSubtitle = formatLabel(state.subtitle, "", 32);
  const aLabel = formatLabel(state.aSide, "A", 16);
  const bLabel = formatLabel(state.bSide, "B", 16);
  const gameIconUrl = state.customLogoUrl || getGameIcon(state.name);

  const isDragging = (elementId: keyof ElementPositions) => dragging === elementId;

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
          x={positions.title.x}
          y={positions.title.y}
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
          x={positions.subtitle?.x ?? DEFAULT_POSITIONS.subtitle?.x ?? 720}
          y={positions.subtitle?.y ?? DEFAULT_POSITIONS.subtitle?.y ?? 600}
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
        x={positions.a_side.x}
        y={positions.a_side.y}
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
        x={positions.b_side.x}
        y={positions.b_side.y}
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
        x={positions.a_score.x}
        y={positions.a_score.y}
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
        x={positions.b_score.x}
        y={positions.b_score.y}
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

      <g>
        <image
          href={gameIconUrl}
          x={(positions.logo?.x ?? DEFAULT_POSITIONS.logo.x) - ((positions.logo?.width ?? DEFAULT_POSITIONS.logo.width ?? 64) / 2)}
          y={(positions.logo?.y ?? DEFAULT_POSITIONS.logo.y) - ((positions.logo?.height ?? DEFAULT_POSITIONS.logo.height ?? 64) / 2)}
          width={positions.logo?.width ?? DEFAULT_POSITIONS.logo.width ?? 64}
          height={positions.logo?.height ?? DEFAULT_POSITIONS.logo.height ?? 64}
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

      {state.aSideIcon && (
        <image
          href={state.aSideIcon}
          x={(positions.a_side_icon?.x ?? DEFAULT_POSITIONS.a_side_icon?.x ?? 200) - ((positions.a_side_icon?.width ?? DEFAULT_POSITIONS.a_side_icon?.width ?? 64) / 2)}
          y={(positions.a_side_icon?.y ?? DEFAULT_POSITIONS.a_side_icon?.y ?? 310) - ((positions.a_side_icon?.height ?? DEFAULT_POSITIONS.a_side_icon?.height ?? 64) / 2)}
          width={positions.a_side_icon?.width ?? DEFAULT_POSITIONS.a_side_icon?.width ?? 64}
          height={positions.a_side_icon?.height ?? DEFAULT_POSITIONS.a_side_icon?.height ?? 64}
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
          x={(positions.b_side_icon?.x ?? DEFAULT_POSITIONS.b_side_icon?.x ?? 1240) - ((positions.b_side_icon?.width ?? DEFAULT_POSITIONS.b_side_icon?.width ?? 64) / 2)}
          y={(positions.b_side_icon?.y ?? DEFAULT_POSITIONS.b_side_icon?.y ?? 310) - ((positions.b_side_icon?.height ?? DEFAULT_POSITIONS.b_side_icon?.height ?? 64) / 2)}
          width={positions.b_side_icon?.width ?? DEFAULT_POSITIONS.b_side_icon?.width ?? 64}
          height={positions.b_side_icon?.height ?? DEFAULT_POSITIONS.b_side_icon?.height ?? 64}
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
