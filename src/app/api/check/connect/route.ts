import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib";
import redis from "@/lib/cache";
import minioClient from "@/lib/storage";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export async function POST(req: NextRequest) {
  try {
    await query("SELECT 1");
    await redis.ping();
    const bucketExists = await minioClient.bucketExists(
      process.env.MINIO_BUCKET as string
    );

    return NextResponse.json(
      {
        code: 0,
        database: "connected",
        redis: "connected",
        minio: "connected",
        bucketExists,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        code: 1,
        error: error,
      },
      { status: 500 }
    );
  }
}
