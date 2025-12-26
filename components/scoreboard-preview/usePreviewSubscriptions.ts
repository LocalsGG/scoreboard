import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ElementPositions, ScoreboardType } from "@/lib/types";
import { getMergedPositions } from "./constants";
import type { PreviewState } from "./types";

interface UsePreviewSubscriptionsArgs {
  boardId?: string | null;
  supabase: SupabaseClient;
  setState: React.Dispatch<React.SetStateAction<PreviewState>>;
  setPositions: React.Dispatch<React.SetStateAction<ElementPositions>>;
  resetPositions: () => void;
}

export function usePreviewSubscriptions({
  boardId,
  supabase,
  setState,
  setPositions,
  resetPositions,
}: UsePreviewSubscriptionsArgs) {
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`scoreboard-preview-${boardId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scoreboards", filter: `id=eq.${boardId}` },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          setState((prev) => {
            const newState = {
              name: typeof next.name === "string" ? next.name : prev.name,
              subtitle:
                typeof next.scoreboard_subtitle === "string" ? next.scoreboard_subtitle : prev.subtitle,
              aSide: typeof next.a_side === "string" ? next.a_side : prev.aSide,
              bSide: typeof next.b_side === "string" ? next.b_side : prev.bSide,
              aScore: typeof next.a_score === "number" ? next.a_score : prev.aScore,
              bScore: typeof next.b_score === "number" ? next.b_score : prev.bScore,
              updatedAt: typeof next.updated_at === "string" ? next.updated_at : prev.updatedAt,
              style:
                typeof next.scoreboard_style === "string"
                  ? next.scoreboard_style
                  : prev.style,
              titleVisible:
                typeof next.title_visible === "boolean" ? next.title_visible : prev.titleVisible ?? true,
              aSideIcon: typeof next.a_side_icon === "string" ? next.a_side_icon : prev.aSideIcon,
              bSideIcon: typeof next.b_side_icon === "string" ? next.b_side_icon : prev.bSideIcon,
              centerTextColor:
                typeof next.center_text_color === "string"
                  ? next.center_text_color
                  : prev.centerTextColor,
              customLogoUrl:
                typeof next.custom_logo_url === "string" ? next.custom_logo_url : prev.customLogoUrl ?? null,
              scoreboardType:
                typeof next.scoreboard_type === "string" ? next.scoreboard_type as ScoreboardType : prev.scoreboardType ?? null,
            };

            // Dispatch animation events for score changes
            if (typeof next.a_score === "number" && next.a_score !== prev.aScore) {
              const delta = next.a_score - prev.aScore;
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent(`score-animation-${boardId}-a_score`, {
                  detail: { delta, score: next.a_score as number }
                }));
              }, 0);
            }

            if (typeof next.b_score === "number" && next.b_score !== prev.bScore) {
              const delta = next.b_score - prev.bScore;
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent(`score-animation-${boardId}-b_score`, {
                  detail: { delta, score: next.b_score as number }
                }));
              }, 0);
            }

            return newState;
          });

          if (next.element_positions && typeof next.element_positions === "object") {
            const scoreboardType = typeof next.scoreboard_type === "string" 
              ? next.scoreboard_type as ScoreboardType 
              : null;
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
      const detail = (event as CustomEvent<ScoreboardType | null>).detail;
      setState((prev) => ({ ...prev, scoreboardType: detail ?? null }));
    };

    const handleStyle = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setState((prev) => ({ ...prev, style: detail }));
      }
    };

    const handleResetPositions = () => {
      resetPositions();
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
    window.addEventListener(`style-local-${boardId}`, handleStyle);

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
      window.removeEventListener(`style-local-${boardId}`, handleStyle);
    };
  }, [boardId, supabase, resetPositions, setState, setPositions]);
}


