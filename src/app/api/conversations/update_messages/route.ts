import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const { chat_messages } = await request.json();

    if (!Array.isArray(chat_messages) || chat_messages.length === 0) {
      return NextResponse.json(
        { error: "chat_messages must be a non-empty array" },
        { status: 400 }
      );
    }

    try {
      const results = [];

      for (const message of chat_messages) {
        const queryText = `insert into chat_message (id, session_id, role, content, file_count, accumulated_token_usage)
                          values ($1, $2, $3, $4, $5, $6)
                          returning *`;

        const values = [
          message.id,
          message.sessionId,
          message.role,
          message.content,
          message.files?.length || 0,
          message.accumulatedTokenUsage || 0,
        ];

        const response = await query(queryText, values);

        results.push(response.rows[0]);
      }

      // console.log(`Successfully inserted ${results.length} messages`);
      return NextResponse.json({
        success: true,
        inserted_count: results.length,
        messages: results,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to insert chat messages", details: dbError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
