import { NextRequest, NextResponse } from "next/server";
import { initialDB } from "@/lib";

export async function POST(req: NextRequest) {
  try {
    await initialDB();
    return NextResponse.json(
      { message: "DB initialized success!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DB initialized failed!:", error);
    return NextResponse.json(
      { message: "DB initialized failed!", error: error },
      { status: 500 }
    );
  }
}
