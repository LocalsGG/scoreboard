import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      );
    }

    // Fetch scoreboard data using Supabase MCP
    // First verify ownership
    const { data: board, error: boardError } = await supabase
      .from('scoreboards')
      .select('id, livestream_url, livestream_enabled')
      .eq('id', boardId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (boardError) {
      console.error('Error fetching scoreboard:', boardError);
      return NextResponse.json(
        { error: 'Failed to fetch scoreboard data' },
        { status: 500 }
      );
    }

    if (!board) {
      return NextResponse.json(
        { error: 'Scoreboard not found or access denied' },
        { status: 404 }
      );
    }

    if (!board.livestream_enabled) {
      return NextResponse.json(
        { error: 'Livestream is not enabled for this scoreboard' },
        { status: 400 }
      );
    }

    if (!board.livestream_url) {
      return NextResponse.json(
        { error: 'Livestream URL is not set' },
        { status: 400 }
      );
    }

    // Send request to Railway endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let railwayResponse: Response;
    try {
      railwayResponse = await fetch('https://auto-scoreboard-production.up.railway.app/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: board.id,
          url: board.livestream_url,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Railway API request timed out');
        return NextResponse.json(
          { error: 'Railway API request timed out' },
          { status: 504 }
        );
      }
      console.error('Railway API request failed:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Railway API', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Read the response text first (can only be read once)
    const responseText = await railwayResponse.text();
    console.log('Railway API response status:', railwayResponse.status);
    console.log('Railway API response text:', responseText);

    let railwayData;
    try {
      railwayData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Railway API response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Railway API', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Check if Railway returned an error status
    if (!railwayResponse.ok) {
      // Try to parse the error details
      let errorDetails = responseText;
      try {
        if (railwayData.details) {
          // Handle nested JSON strings in details
          try {
            const nestedDetails = JSON.parse(railwayData.details);
            errorDetails = nestedDetails.detail || railwayData.details;
          } catch {
            errorDetails = railwayData.details;
          }
        } else {
          errorDetails = railwayData.error || responseText;
        }
      } catch {
        // Keep original error text if parsing fails
      }
      
      console.warn('Railway API returned error status:', railwayResponse.status, errorDetails);
      
      // Even if Railway returned an error, check if we have valid score data
      // Sometimes Railway might return error but still include the scores
      if (
        typeof railwayData.left_stocks === 'number' &&
        typeof railwayData.right_stocks === 'number'
      ) {
        console.log('Railway returned error but has valid scores, proceeding with update');
        // Continue to update scores below
      } else {
        // No valid scores, return the error
        return NextResponse.json(
          { error: 'Failed to process livestream request', details: errorDetails },
          { status: railwayResponse.status }
        );
      }
    }

    // Handle Railway response format:
    // {
    //   "id": "test-001",
    //   "left_stocks": 3,
    //   "right_stocks": 2,
    //   "error": null
    // }
    
    // If there's an error in the response, return it
    if (railwayData.error) {
      return NextResponse.json(
        { error: 'Livestream processing error', details: railwayData.error },
        { status: 400 }
      );
    }

    // Update scoreboard with the scores from Railway
    // Map left_stocks -> a_score, right_stocks -> b_score
    if (
      typeof railwayData.left_stocks === 'number' &&
      typeof railwayData.right_stocks === 'number'
    ) {
      console.log('Updating scoreboard scores:', {
        boardId: board.id,
        a_score: railwayData.left_stocks,
        b_score: railwayData.right_stocks,
      });

      const { data: updatedBoard, error: updateError } = await supabase
        .from('scoreboards')
        .update({
          a_score: railwayData.left_stocks,
          b_score: railwayData.right_stocks,
        })
        .eq('id', boardId)
        .eq('owner_id', user.id)
        .select('a_score, b_score')
        .maybeSingle();

      if (updateError) {
        console.error('Error updating scores from livestream:', updateError);
        return NextResponse.json(
          { error: 'Failed to update scoreboard', details: updateError.message },
          { status: 500 }
        );
      }

      if (updatedBoard) {
        console.log('Successfully updated scoreboard:', {
          boardId: board.id,
          a_score: updatedBoard.a_score,
          b_score: updatedBoard.b_score,
        });
      } else {
        console.warn('Update completed but no data returned for board:', board.id);
      }
    } else {
      console.warn('Railway response missing valid scores:', {
        left_stocks: railwayData.left_stocks,
        right_stocks: railwayData.right_stocks,
        left_stocks_type: typeof railwayData.left_stocks,
        right_stocks_type: typeof railwayData.right_stocks,
      });
    }

    console.log('Successfully processed livestream update:', {
      boardId: board.id,
      left_stocks: railwayData.left_stocks,
      right_stocks: railwayData.right_stocks,
    });

    return NextResponse.json({
      success: true,
      data: railwayData,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing livestream:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

