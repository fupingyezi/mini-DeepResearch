import { NextRequest, NextResponse } from "next/server";
import {
  ConvertRawMessagesToLangChainMessage,
  ConvertLangChainMessageToRoleMessage,
} from "@/utils";
import { chatAgent, chatAgentStream } from "@/app/agents";
import type { chunkMessageType, ChatMessageType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { messages, stream = false } = await request.json();

    if (!messages) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const LangChainMessages = messages.map((msg: ChatMessageType) =>
      ConvertRawMessagesToLangChainMessage(msg)
    );

    if (!stream) {
      const response = await chatAgent(LangChainMessages);
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
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "start",
              timeStamp: Date.now(),
            })}\n\n`
          )
        );

        try {
          for await (const chunk of chatAgentStream(
            LangChainMessages,
            "messages"
          )) {
            const data: chunkMessageType = {
              type: "content",
              content: chunk.content || "",
              role: chunk.role,
              id: chunk.id,
              done: false,
            };

            const sseData = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }

          const endData: chunkMessageType = {
            type: "done",
            done: true,
          };
          const sseEnd = `data: ${JSON.stringify(endData)}\n\n`;
          controller.enqueue(encoder.encode(sseEnd));
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = {
            type: "error",
            content: "Stream error occurred",
            done: true,
          };
          const sseError = `data: ${JSON.stringify(errorData)}\n\n`;
          controller.enqueue(encoder.encode(sseError));
        } finally {
          controller.close();
        }
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
