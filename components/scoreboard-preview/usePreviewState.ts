import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCOREBOARD_OVERLAY_IMAGE } from "@/lib/assets";
import { createClient } from "@/lib/supabase/client";
import type { ElementPositions } from "@/lib/types";
import { DEBOUNCE_MS, DEFAULT_CENTER_TEXT_COLOR, getMergedPositions } from "./constants";
import type { PreviewProps, PreviewState } from "./types";
import { usePreviewSubscriptions } from "./usePreviewSubscriptions";

interface UsePreviewStateResult {
  state: PreviewState;
  setState: React.Dispatch<React.SetStateAction<PreviewState>>;
  positions: ElementPositions;
  setPositions: React.Dispatch<React.SetStateAction<ElementPositions>>;
  resetPositions: () => void;
  savePositions: (next: ElementPositions) => void;
}

export function usePreviewState({
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
}: PreviewProps): UsePreviewStateResult {
  const supabase = useMemo(() => createClient(), []);
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
  const initialPositionsRef = useRef<ElementPositions>(
    getMergedPositions(initialPositions, initialScoreboardType)
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const savePositions = useCallback(
    (newPositions: ElementPositions) => {
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

        if (error) return;
      }, DEBOUNCE_MS);
    },
    [boardId, supabase, readOnly]
  );

  const resetPositions = useCallback(() => {
    if (readOnly) return;
    const positionsToReset = initialPositionsRef.current;
    setPositions(positionsToReset);
    savePositions(positionsToReset);
  }, [readOnly, savePositions]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update state when initial values change (excluding positions-related changes)
  useEffect(() => {
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
    const positionsToUse = getMergedPositions(initialPositions, initialScoreboardType);
    setPositions(positionsToUse);
    initialPositionsRef.current = positionsToUse;
  }, [initialPositions, initialScoreboardType]);

  usePreviewSubscriptions({ boardId, supabase, setState, setPositions, resetPositions });

  return { state, setState, positions, setPositions, resetPositions, savePositions };
}
