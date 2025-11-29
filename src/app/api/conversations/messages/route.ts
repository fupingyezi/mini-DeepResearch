import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        {
          message: "Session ID is required",
        },
        { status: 400 }
      );
    }

    const queryText = `
      select * from chat_message 
      where session_id = $1 
      order by id
    `;

    const response = await query(queryText, [sessionId]);
    console.log("query messages response:", response);

    return NextResponse.json(
      {
        message: "Get messages success!",
        data: response.rows || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      {
        message: "Get messages failed!",
        error: error,
      },
      { status: 500 }
    );
  }
}
