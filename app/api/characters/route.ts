import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Use admin client to access storage (has better permissions)
    const supabase = createAdminSupabaseClient();
    
    const { data: listData, error: listError } = await supabase.storage
      .from("public images")
      .list("supersmashbroscharactericons", {
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
    const encodedPath = encodeURIComponent("supersmashbroscharactericons");
    
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

    return NextResponse.json({ characters });
  } catch (err) {
    console.error("Error in characters API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch characters" },
      { status: 500 }
    );
  }
}

