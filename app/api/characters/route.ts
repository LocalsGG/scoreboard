import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Map game types to Supabase storage folder names
function getCharacterFolder(gameType: string | null): string {
  switch (gameType) {
    case "ultimate":
      return "ssbucharactericons";
    case "melee":
      return "ssbmcharactericons";
    case "guilty-gear":
      return "ggscharactericons";
    default:
      // Default to ultimate for backwards compatibility
      return "ssbucharactericons";
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType");
    const folder = getCharacterFolder(gameType);
    
    // Use admin client to access storage (has better permissions)
    const supabase = createAdminSupabaseClient();
    
    const { data: listData, error: listError } = await supabase.storage
      .from("public images")
      .list(folder, {
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (listError) {
      console.error("Error fetching characters:", listError);
      return NextResponse.json({ 
        error: listError.message || "Failed to fetch characters",
        details: listError 
      }, { status: 500 });
    }

    if (!listData || listData.length === 0) {
      return NextResponse.json({ characters: [] });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const encodedBucket = encodeURIComponent("public images");
    const encodedPath = encodeURIComponent(folder);
    
    const characters = listData
      .filter((file) => file.name && !file.name.startsWith("."))
      .map((file) => {
        const fileName = file.name || "";
        const url = `${SUPABASE_URL}/storage/v1/object/public/${encodedBucket}/${encodedPath}/${encodeURIComponent(fileName)}`;
        
        return {
          name: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
          url,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Return with cache headers for client-side caching
    // Extended cache time to reduce egress: 24 hours with 7 day stale-while-revalidate
    return NextResponse.json(
      { characters },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800", // Cache for 24 hours, serve stale for 7 days
          "CDN-Cache-Control": "public, s-maxage=86400",
        },
      }
    );
  } catch (err) {
    console.error("Error in characters API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch characters" },
      { status: 500 }
    );
  }
}

