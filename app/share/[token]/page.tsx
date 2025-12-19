import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreboardPreview } from "@/components/ScoreboardPreview";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ElementPositions } from "@/lib/types";

export const dynamic = "force-dynamic";

type SharedBoard = {
  id: string;
  name: string | null;
  scoreboard_subtitle: string | null;
  created_at: string | null;
  a_side: string | null;
  b_side: string | null;
  a_score: number | null;
  b_score: number | null;
  updated_at: string | null;
  scoreboard_style: string | null;
  element_positions: ElementPositions | null;
  title_visible: boolean | null;
  a_side_icon: string | null;
  b_side_icon: string | null;
  center_text_color: string | null;
  custom_logo_url: string | null;
  scoreboard_type: string | null;
};

async function loadSharedBoard(token: string) {
  if (!token) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  // Select all columns, but handle element_positions gracefully if it doesn't exist
  let board: SharedBoard | null = null;
  let boardError: Error | null = null;
  
  try {
    const result = await supabase
      .from("scoreboards")
      .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, element_positions, title_visible, a_side_icon, b_side_icon, center_text_color, custom_logo_url, scoreboard_type")
      .eq("share_token", token)
      .maybeSingle<SharedBoard>();
    
    if (result.error) {
      // If error is about missing column, try without it
      if (result.error.message?.includes("element_positions") || result.error.message?.includes("column")) {
        const resultWithoutPos = await supabase
          .from("scoreboards")
          .select("id, name, scoreboard_subtitle, created_at, a_side, b_side, a_score, b_score, updated_at, scoreboard_style, title_visible, center_text_color, custom_logo_url, scoreboard_type")
          .eq("share_token", token)
          .maybeSingle<Omit<SharedBoard, "element_positions" | "a_side_icon" | "b_side_icon"> & { element_positions?: null; a_side_icon?: null; b_side_icon?: null }>();
        
        if (resultWithoutPos.error) {
          boardError = new Error(resultWithoutPos.error.message);
        } else {
          board = { 
            ...resultWithoutPos.data, 
            element_positions: null, 
            title_visible: resultWithoutPos.data?.title_visible ?? true,
            a_side_icon: null,
            b_side_icon: null,
          } as SharedBoard;
        }
      } else {
        boardError = new Error(result.error.message);
      }
    } else {
      board = result.data;
    }
  } catch (err) {
    boardError = err instanceof Error ? err : new Error("Unknown error");
  }

  if (boardError) {
    throw boardError;
  }

  if (!board) {
    notFound();
  }

  return { board };
}

export async function generateMetadata(
  props: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await props.params;
  const { board } = await loadSharedBoard(token);
  
  if (!board) {
    return {
      title: "Scoreboard Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const boardName = board.name || "Live Scoreboard";
  const description = board.scoreboard_subtitle 
    ? `${boardName} - ${board.scoreboard_subtitle} | Live scoreboard overlay on Scoreboardtools`
    : `${boardName} - Live scoreboard overlay on Scoreboardtools`;

  return {
    title: boardName,
    description,
    openGraph: {
      title: boardName,
      description,
      type: "website",
      siteName: "Scoreboardtools",
    },
    twitter: {
      card: "summary_large_image",
      title: boardName,
      description,
    },
  };
}

export default async function SharedScoreboardPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const { board } = await loadSharedBoard(token);

  return (
    <ScoreboardPreview
      boardId={board.id}
      initialName={board.name}
      initialSubtitle={board.scoreboard_subtitle}
      initialASide={board.a_side}
      initialBSide={board.b_side}
      initialAScore={board.a_score}
      initialBScore={board.b_score}
      initialUpdatedAt={board.updated_at}
      initialStyle={board.scoreboard_style}
      initialPositions={board.element_positions}
      initialTitleVisible={board.title_visible}
      initialASideIcon={board.a_side_icon}
      initialBSideIcon={board.b_side_icon}
      initialCenterTextColor={board.center_text_color}
      initialCustomLogoUrl={board.custom_logo_url}
      initialScoreboardType={board.scoreboard_type as "melee" | "ultimate" | "guilty-gear" | "generic" | null}
      readOnly={true}
    />
  );
}
