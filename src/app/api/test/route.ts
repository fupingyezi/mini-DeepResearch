import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    await pool.end();

    return NextResponse.json({
      message: "DB connect success!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("DB connect failed!:", error);
    return NextResponse.json(
      {
        message: "DB connect failed!",
        error: error,
      },
      { status: 500 }
    );
  }
}
