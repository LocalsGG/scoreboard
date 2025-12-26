import React from "react";
import type { ElementPositions } from "@/lib/types";
import type { PreviewState } from "./types";
import { DEFAULT_POSITIONS } from "./constants";

interface ScoreboardCanvasProps {
  state: PreviewState;
  positions: ElementPositions;
  readOnly: boolean;
  dragging: string | null;
  gradientId: string;
  scoreboardTitle: string;
  scoreboardSubtitle: string | null;
  aLabel: string;
  bLabel: string;
  gameIconUrl: string;
  logo: { x: number; y: number; width: number; height: number } | null;
  scoreAnimations?: {
    aScore: { delta: number; id: number } | null;
    bScore: { delta: number; id: number } | null;
  };
  onMouseDown: (elementId: string, event: React.MouseEvent) => void;
  onLogoMouseDown?: (event: React.MouseEvent) => void;
}

function safeNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
}

export function ScoreboardCanvas({
  state,
  positions,
  readOnly,
  dragging,
  gradientId,
  scoreboardTitle,
  scoreboardSubtitle,
  aLabel,
  bLabel,
  gameIconUrl,
  logo,
  scoreAnimations,
  onMouseDown,
  onLogoMouseDown,
}: ScoreboardCanvasProps) {
  const isDragging = (elementId: string) => dragging === elementId;

  return (
    <svg
      width="1440"
      height="810"
      viewBox="0 0 1440 810"
      className="w-full h-auto border border-black/20 rounded-lg shadow-lg"
      style={{ aspectRatio: "1440/810" }}
    >
      {/* Background */}
      <image
        href={state.style}
        width="1440"
        height="810"
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Text shadow filter */}
      <defs>
        <filter id={`${gradientId}-text-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Title */}
      {state.titleVisible && (
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
          onMouseDown={(e) => onMouseDown("title", e)}
        >
          {scoreboardTitle}
        </text>
      )}

      {/* Subtitle */}
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
          onMouseDown={(e) => onMouseDown("subtitle", e)}
        >
          {scoreboardSubtitle}
        </text>
      )}

      {/* A Side */}
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
        onMouseDown={(e) => onMouseDown("a_side", e)}
      >
        {aLabel}
      </text>

      {/* B Side */}
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
        onMouseDown={(e) => onMouseDown("b_side", e)}
      >
        {bLabel}
      </text>

      {/* A Score */}
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
        onMouseDown={(e) => onMouseDown("a_score", e)}
      >
        {state.aScore}
      </text>

      {/* A Score Animation */}
      {scoreAnimations?.aScore && (
        <text
          key={`a-score-anim-${scoreAnimations.aScore.id}`}
          x={safeNumber(positions.a_score.x, DEFAULT_POSITIONS.a_score.x)}
          y={safeNumber(positions.a_score.y, DEFAULT_POSITIONS.a_score.y) - 20}
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="48"
          fill={scoreAnimations.aScore.delta > 0 ? "#22c55e" : "#ef4444"}
          fontWeight="800"
          textAnchor="middle"
          opacity="0"
          style={{
            animation: "scoreFloat 0.8s ease-out forwards"
          }}
        >
          {scoreAnimations.aScore.delta > 0 ? "+" : ""}{scoreAnimations.aScore.delta}
        </text>
      )}

      {/* B Score */}
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
        onMouseDown={(e) => onMouseDown("b_score", e)}
      >
        {state.bScore}
      </text>

      {/* B Score Animation */}
      {scoreAnimations?.bScore && (
        <text
          key={`b-score-anim-${scoreAnimations.bScore.id}`}
          x={safeNumber(positions.b_score.x, DEFAULT_POSITIONS.b_score.x)}
          y={safeNumber(positions.b_score.y, DEFAULT_POSITIONS.b_score.y) - 20}
          fontFamily="Impact, 'Anton', 'Bebas Neue', 'Arial Black', sans-serif"
          fontSize="48"
          fill={scoreAnimations.bScore.delta > 0 ? "#22c55e" : "#ef4444"}
          fontWeight="800"
          textAnchor="middle"
          opacity="0"
          style={{
            animation: "scoreFloat 0.8s ease-out forwards"
          }}
        >
          {scoreAnimations.bScore.delta > 0 ? "+" : ""}{scoreAnimations.bScore.delta}
        </text>
      )}

      {/* Logo */}
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
              if (!readOnly && onLogoMouseDown) {
                onLogoMouseDown(e);
              }
            }}
          />
        </g>
      )}
    </svg>
  );
}
