import { NextRequest, NextResponse } from "next/server";
import { ConvertLangChainMessageToRoleMessage } from "@/utils";
import { chatAgent, chatAgentStream } from "@/app/agents";
import type { chunkMessageType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { input, sessionId, stream = true } = await request.json();

    if (!input) {
      return NextResponse.json({ error: "input is required" }, { status: 400 });
    }

    if (!stream) {
      const response = await chatAgent(input, sessionId);
      return NextResponse.json(
        {
          messages: response.messages.map((msg) =>
            ConvertLangChainMessageToRoleMessage(msg)
          ),
        },
        { status: 200 }
      );
    }

    const encoder = new TextEncoder();

    const readabelStrem = new ReadableStream({
      async start(controller) {
        let streamAborted = false;

        const cleanup = () => {
          streamAborted = true;
        };

        request.signal?.addEventListener("abort", cleanup);

        const checkSafeEnqueue = (data: Uint8Array) => {
          if (streamAborted) return false;

          try {
            controller.enqueue(data);
            return true;
          } catch (error) {
            console.error("controller enqueue failed", error);
            streamAborted = true;
            return false;
          }
        };

        try {
          if (
            !checkSafeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "start",
                  timeStamp: Date.now(),
                })}\n\n`
              )
            )
          ) {
            return;
          }

          for await (const chunk of chatAgentStream(
            input,
            sessionId,
            "messages"
          )) {
            const data: chunkMessageType = {
              type: "content",
              content: chunk.content || "",
              role: chunk.role,
              id: chunk.id,
              done: false,
            };

            if (
              !checkSafeEnqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
              )
            ) {
              break;
            }
          }

          if (!streamAborted) {
            checkSafeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  done: true,
                })}\n\n`
              )
            );
          }
        } catch (error) {
          console.error("Stream error:", error);

          if (!streamAborted) {
            checkSafeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  content: "Stream error occurred",
                  done: true,
                })}\n\n`
              )
            );
          }
        } finally {
          if (request.signal) {
            request.signal.removeEventListener("abort", cleanup);
          }
          controller.close();
        }
      },

      cancel() {
        console.log("ReadableStream cancelled by client");
      },
    });

    return new Response(readabelStrem, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
