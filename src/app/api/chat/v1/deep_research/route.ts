import { createDeepResearchWorkflow } from "@/app/agents";
import { extractDelta } from "@/utils/streamUtils";

export async function POST(request: Request) {
  const { input, sessionId } = await request.json();
  const deepResearchWorkflow = await createDeepResearchWorkflow();
  if (!input) {
    return new Response(JSON.stringify({ error: "Missing input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let lastState: any = null;

  // 创建 ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const state of await deepResearchWorkflow.stream(
          { input, messages: [], tasks: [], summary: "" },
          { configurable: { thread_id: sessionId }, streamMode: "values" }
        )) {
          console.log("state:", state);
          const delta = extractDelta(lastState, state);
          console.log("delta:", delta);
          if (delta) {
            const message = `data: ${JSON.stringify(delta)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
            lastState = state;
          }
        }

        controller.enqueue(
          new TextEncoder().encode('data: {"type":"done"}\n\n')
        );
        controller.close();
      } catch (error) {
        console.error("Workflow error:", error);
        const errMsg = `data: ${JSON.stringify({
          type: "error",
          payload: "生成失败",
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errMsg));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
