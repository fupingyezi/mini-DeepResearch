import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const { chat_messages } = await request.json();

    if (!Array.isArray(chat_messages) || chat_messages.length === 0) {
      return NextResponse.json(
        { error: "chat_messages must be a non-empty array" },
        { status: 400 }
      );
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");

      for (const message of chat_messages) {
        const insertMsgQuery = `
          insert into chat_message (
            id,
            session_id,
            role,
            content,
            file_count,
            accumulated_token_usage,
            mode
          ) values ($1, $2, $3, $4, $5, $6, $7);
        `;

        const msgValues = [
          message.id,
          message.sessionId,
          message.role,
          message.content,
          message.files?.length || 0,
          message.accumulatedTokenUsage || 0,
          message.mode || "chat",
        ];

        await client.query(insertMsgQuery, msgValues);

        if (message.mode === "deepResearch" && message.deepResearchResult) {
          const dr = message.deepResearchResult;

          // 插入 deep_research_result
          const insertDRQuery = `
            insert into deep_research_result (session_id, message_id, research_target, report)
            values ($1, $2, $3, $4)
            returning id;
          `;

          const drRes = await client.query(insertDRQuery, [
            message.sessionId,
            message.id,
            dr.researchTarget,
            dr.report || "",
          ]);

          const researchResultId = drRes.rows[0].id;

          // 插入对应的每个 task
          for (const task of dr.tasks || []) {
            const insertTaskQuery = `
              insert into research_task (
                id,
                research_result_id,
                description,
                status,
                need_search,
                result
              ) values ($1, $2, $3, $4, $5, $6);
            `;

            await client.query(insertTaskQuery, [
              task.id,
              researchResultId,
              task.description,
              task.status || "completed",
              !!task.needSearch,
              task.result || null,
            ]);

            // 插入该 task 的搜索结果
            for (const sr of task.searchResult || []) {
              const insertSRQuery = `
                insert into research_task_search_result (
                  task_id,
                  title,
                  source_url,
                  content,
                  relative_score
                ) values ($1, $2, $3, $4, $5);
              `;

              await client.query(insertSRQuery, [
                task.id,
                sr.title || null,
                sr.sourceUrl || null,
                sr.content || null,
                sr.relativeScore != null ? sr.relativeScore : null,
              ]);
            }
          }
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        inserted_count: chat_messages.length,
      });
    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Database transaction failed:", dbError);
      return NextResponse.json(
        {
          error: "Failed to save messages and research results",
          details: dbError,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
