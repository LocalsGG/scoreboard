"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScoreAdjuster } from "./ScoreAdjuster";
import { SideNameEditor } from "./SideNameEditor";
import { BoardNameEditor } from "./BoardNameEditor";
import { BoardSubtitleEditor } from "./BoardSubtitleEditor";
import { CompactStyleSelector } from "./CompactStyleSelector";
import { CharacterIconSelector } from "./CharacterIconSelector";
import { LogoSelector } from "./LogoSelector";
import { GameTypeIndicator } from "./GameTypeIndicator";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import type { ElementPositions, ScoreboardType } from "@/lib/types";

type Props = {
  boardId: string;
  initialLivestreamEnabled: boolean | null;
  isAuthenticated: boolean;
  // Scoreboard data
  name: string | null;
  scoreboardSubtitle: string | null;
  aSide: string | null;
  bSide: string | null;
  aScore: number | null;
  bScore: number | null;
  scoreboardStyle: string | null;
  elementPositions: ElementPositions | null;
  titleVisible: boolean | null;
  aSideIcon: string | null;
  bSideIcon: string | null;
  customLogoUrl: string | null;
  scoreboardType: ScoreboardType | null;
};

export function ScoreControlsPanel({
  boardId,
  initialLivestreamEnabled,
  isAuthenticated,
  name,
  scoreboardSubtitle,
  aSide,
  bSide,
  aScore,
  bScore,
  scoreboardStyle,
  elementPositions,
  titleVisible,
  aSideIcon,
  bSideIcon,
  customLogoUrl,
  scoreboardType,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [livestreamEnabled, setLivestreamEnabled] = useState<boolean>(
    initialLivestreamEnabled ?? false
  );

  // Listen for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`livestream-status-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "scoreboards",
          filter: `id=eq.${boardId}`,
        },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          if (typeof next.livestream_enabled === "boolean") {
            setLivestreamEnabled(next.livestream_enabled);
          }
        }
      )
      .subscribe();

    // Also listen for custom events from LivestreamLink component
    const handleLivestreamChange = (event: CustomEvent<boolean>) => {
      setLivestreamEnabled(event.detail);
    };

    window.addEventListener(
      `livestream-enabled-${boardId}`,
      handleLivestreamChange as EventListener
    );

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(
        `livestream-enabled-${boardId}`,
        handleLivestreamChange as EventListener
      );
    };
  }, [boardId, supabase]);

  return (
    <div className="rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <SaveStatusIndicator isAuthenticated={isAuthenticated} />
      </div>
      <div className="space-y-6">
        {/* Scoreboard Name - Centered above logo */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <BoardNameEditor
              boardId={boardId}
              initialName={name}
              initialTitleVisible={titleVisible ?? true}
              initialCustomLogoUrl={customLogoUrl}
              align="center"
              showLabel={false}
              initialPositions={elementPositions}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>

        {/* Top Row: A Side Name | A Side Score | Logo | B Side Score | B Side Name */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-3 items-start">
          {/* A Side Name */}
          <div className="space-y-2 min-w-0">
            <div className="flex items-start gap-2">
              {(scoreboardType === "melee" || scoreboardType === "ultimate") && (
                <CharacterIconSelector
                  boardId={boardId}
                  initialValue={aSideIcon}
                  column="a_side_icon"
                  placeholder="Select character icon"
                  compact={true}
                />
              )}
              <div className="flex-1 min-w-0">
                <SideNameEditor
                  boardId={boardId}
                  initialValue={aSide}
                  column="a_side"
                  placeholder="A Side Name"
                  initialPositions={elementPositions}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          </div>

          {/* A Side Score - Left Counter */}
          <div className="space-y-2 min-w-0">
            <ScoreAdjuster
              boardId={boardId}
              column="a_score"
              initialValue={aScore}
              initialPositions={elementPositions}
              isAuthenticated={isAuthenticated}
              disabled={livestreamEnabled}
            />
          </div>

          {/* Logo */}
          <div className="space-y-2 flex flex-col items-center min-w-0">
            <LogoSelector
              boardId={boardId}
              initialCustomLogoUrl={customLogoUrl}
              initialScoreboardType={scoreboardType}
              initialPositions={elementPositions}
            />
          </div>

          {/* B Side Score - Right Counter */}
          <div className="space-y-2 min-w-0">
            <ScoreAdjuster
              boardId={boardId}
              column="b_score"
              initialValue={bScore}
              initialPositions={elementPositions}
              isAuthenticated={isAuthenticated}
              disabled={livestreamEnabled}
            />
          </div>

          {/* B Side Name */}
          <div className="space-y-2 min-w-0">
            <div className="flex items-start gap-2">
              {(scoreboardType === "melee" || scoreboardType === "ultimate") && (
                <CharacterIconSelector
                  boardId={boardId}
                  initialValue={bSideIcon}
                  column="b_side_icon"
                  placeholder="Select character icon"
                  compact={true}
                />
              )}
              <div className="flex-1 min-w-0">
                <SideNameEditor
                  boardId={boardId}
                  initialValue={bSide}
                  column="b_side"
                  placeholder="B Side Name"
                  initialPositions={elementPositions}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Style Selector, Subtitle, and Game Type */}
        <div className="grid grid-cols-3 items-end gap-4">
          <div className="flex justify-start">
            <CompactStyleSelector
              boardId={boardId}
              initialStyle={scoreboardStyle}
              isAuthenticated={isAuthenticated}
            />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <div className="w-full max-w-[200px]">
              <BoardSubtitleEditor
                boardId={boardId}
                initialValue={scoreboardSubtitle}
                placeholder="Subtitle"
                align="center"
                initialPositions={elementPositions}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <GameTypeIndicator boardId={boardId} initialType={scoreboardType} />
          </div>
        </div>
      </div>
    </div>
  );
}

