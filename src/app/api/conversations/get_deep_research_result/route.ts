import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log("Received request body:", requestBody);

    const { session_id, message_id } = requestBody;
    console.log("Extracted session_id:", session_id);
    console.log("Extracted message_id:", message_id);

    if (!session_id || !message_id) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: "session_id and message_id are required" },
        { status: 400 }
      );
    }

    //测试：
    // const getall = `select * from deep_research_result`;
    // const allInfo = await query(getall);
    // console.log(allInfo);

    // 深度研究结果
    const deepResearchQuery = `
      select
        dr.id,
        dr.session_id,
        dr.message_id,
        dr.research_target,
        dr.report,
        dr.created_at,
        dr.updated_at
      from deep_research_result dr
      where dr.session_id = $1 and dr.message_id = $2
    `;

    const deepResearchResult = await query(deepResearchQuery, [
      session_id,
      message_id,
    ]);

    if (deepResearchResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Deep research result not found" },
        { status: 404 }
      );
    }

    const drData = deepResearchResult.rows[0];

    // 相关的任务
    const tasksQuery = `
      select 
        rt.id,
        rt.description,
        rt.need_search,
        rt.result,
        rt.created_at,
        rt.updated_at
      from research_task rt
      where rt.research_result_id = $1
      order by rt.created_at asc
    `;

    const tasksResult = await query(tasksQuery, [drData.id]);

    // 为每个任务查询搜索结果
    const tasks = [];
    for (const task of tasksResult.rows) {
      const searchResultsQuery = `
        select 
          title,
          source_url,
          content,
          relative_score
        from research_task_search_result
        where task_id = $1
        order by relative_score desc
      `;

      const searchResults = await query(searchResultsQuery, [task.id]);

      tasks.push({
        id: task.id,
        description: task.description,
        needSearch: task.need_search,
        result: task.result,
        searchResult: searchResults.rows.map((sr) => ({
          title: sr.title,
          sourceUrl: sr.source_url,
          content: sr.content,
          relativeScore: sr.relative_score,
        })),
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      });
    }

    const deepResearchResultData = {
      id: drData.id,
      messageId: drData.message_id,
      sessionId: drData.session_id,
      researchTarget: drData.research_target,
      report: drData.report,
      tasks: tasks,
      createdAt: drData.created_at,
      updatedAt: drData.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: deepResearchResultData,
    });
  } catch (error) {
    console.error("Error fetching deep research result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
