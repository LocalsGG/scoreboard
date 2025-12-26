"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl border border-black/5 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-[0_22px_65px_rgba(12,18,36,0.12)] relative"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="absolute top-4 left-4 sm:top-6 sm:left-6"
      >
        <SaveStatusIndicator isAuthenticated={isAuthenticated} />
      </motion.div>
      <div className="space-y-6">
        {/* Scoreboard Name - Centered above logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="w-full max-w-md">
            <BoardNameEditor
              boardId={boardId}
              initialName={name}
              initialTitleVisible={titleVisible ?? true}
              align="center"
              showLabel={false}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </motion.div>

        {/* Top Row: A Side Name | A Side Score | Logo | B Side Score | B Side Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, staggerChildren: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-3 items-start"
        >
          {/* A Side Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="space-y-2 min-w-0"
          >
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
          </motion.div>

          {/* A Side Score - Left Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4, type: "spring", stiffness: 200 }}
            className="space-y-2 min-w-0"
          >
            <ScoreAdjuster
              boardId={boardId}
              column="a_score"
              initialValue={aScore}
              initialPositions={elementPositions}
              isAuthenticated={isAuthenticated}
              disabled={livestreamEnabled}
            />
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5, type: "spring", stiffness: 150 }}
            className="space-y-2 flex flex-col items-center min-w-0"
          >
            <LogoSelector
              boardId={boardId}
              initialCustomLogoUrl={customLogoUrl}
              initialScoreboardType={scoreboardType}
              initialPositions={elementPositions}
            />
          </motion.div>

          {/* B Side Score - Right Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4, type: "spring", stiffness: 200 }}
            className="space-y-2 min-w-0"
          >
            <ScoreAdjuster
              boardId={boardId}
              column="b_score"
              initialValue={bScore}
              initialPositions={elementPositions}
              isAuthenticated={isAuthenticated}
              disabled={livestreamEnabled}
            />
          </motion.div>

          {/* B Side Name */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="space-y-2 min-w-0"
          >
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
          </motion.div>
        </motion.div>

        {/* Bottom Row: Style Selector, Subtitle, and Game Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="grid grid-cols-3 items-end gap-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="flex justify-start"
          >
            <CompactStyleSelector
              boardId={boardId}
              initialStyle={scoreboardStyle}
              isAuthenticated={isAuthenticated}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="space-y-2 flex flex-col items-center"
          >
            <div className="w-full max-w-[200px]">
              <BoardSubtitleEditor
                boardId={boardId}
                initialValue={scoreboardSubtitle}
                placeholder="Subtitle"
                align="center"
                isAuthenticated={isAuthenticated}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.4 }}
            className="flex justify-end"
          >
            <GameTypeIndicator boardId={boardId} initialType={scoreboardType} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

