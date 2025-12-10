import { ChatAgentWithSearchTool } from "@/app/agents";
import { NextRequest, NextResponse } from "next/server";
import { ConvertLangChainMessageToRoleMessage } from "@/utils";
import { ChatMessageType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { input, sessionId, stream = true } = await request.json();

    if (!input) {
      return NextResponse.json({ error: "input is empty" }, { status: 400 });
    }

    const response = await ChatAgentWithSearchTool(input, {
      configuration: { thread_id: sessionId },
    });

    if (!stream) {
      return NextResponse.json(
        {
          messages: response.messages.map((msg) =>
            ConvertLangChainMessageToRoleMessage(msg)
          ),
        },
        {
          status: 200,
        }
      );
    }

    const encoder = new TextEncoder();
    const assistantMessage = response.messages[response.messages.length - 1];
    const responseContent = assistantMessage.content;

    const readableStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "start",
              id: Date.now(),
            })}\n\n`
          )
        );

        try {
          const chunks = splitContentToChunks(responseContent as string);

          for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 200));

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "content",
                  content: chunks[i],
                  role: "assistant",
                  id: i,
                  done: false,
                })}\n\n`
              )
            );
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                id: Date.now(),
              })}\n\n`
            )
          );
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: err instanceof Error ? err.message : "Unknown error",
                id: Date.now(),
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

function splitContentToChunks(
  content: string,
  wordsPerChunk: number = 1
): string[] {
  const words = content.split(" ");
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk).join(" ");
    if (chunk) chunks.push(chunk + " ");
  }

  return chunks;
}
