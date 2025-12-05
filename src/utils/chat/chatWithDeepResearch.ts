import apiClient from "../request/api";
import { v4 as uuidv4 } from "uuid";
import {
  ChatSessionType,
  ChatMessageType,
  chatWithDeepResearchProps,
} from "@/types";

export const chatWithDeepResearch = async (
  chatWithDeepResearchParams: chatWithDeepResearchProps
) => {
  const {
    inputValue,
    currentSession,
    chatSessions,
    currentMessages,
    setIsLoading,
    setShouldAutoScroll,
    updateChatSessions,
    setCurrentSession,
    setCurrentMessages,
    simpleAnalysis,
    setSimpleAnalysis,
    tasks,
    report,
    initialTasks,
    updateTasks,
    updateReport,
  } = chatWithDeepResearchParams;

  if (inputValue === "") return;

  let sessionId = currentSession;
  // 没有对话，创建新对话
  if (!currentSession) {
    sessionId = uuidv4();
    const chat_session: ChatSessionType = {
      id: sessionId,
      seq_id: chatSessions.length + 1,
      title: inputValue.slice(0, 15),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      const res = await apiClient.post("/conversations/create_session", {
        chat_session: chat_session,
      });
      // console.log("Session created:", res);
      if (res.success) {
        updateChatSessions(chat_session);
        setCurrentSession(chat_session.id);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      return;
    }
  }

  // 当前对话里对话
  setIsLoading(true);
  const newUserMessage: ChatMessageType = {
    id: currentMessages.length + 1,
    sessionId: sessionId!,
    role: "user",
    content: inputValue,
  };

  const assistantMessageId = newUserMessage.id + 1;
  let accumulatedContent = "";

  const initialUpdateMessages = [
    ...currentMessages,
    newUserMessage,
    {
      id: assistantMessageId,
      sessionId: sessionId!,
      role: "assistant",
      content: "",
    },
  ];
  setCurrentMessages(JSON.parse(JSON.stringify(initialUpdateMessages)));
  setShouldAutoScroll(true);

  try {
    const response = await fetch("/api/chat/v1/deep_research", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: inputValue,
        sessionId: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    // 流式处理
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (
              (data.type === "start_analyse" || data.type === "summary") &&
              data.payload
            ) {
              accumulatedContent += data.payload;
              const updateMessages = initialUpdateMessages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              );
              setCurrentMessages(JSON.parse(JSON.stringify(updateMessages)));
              if (data.type === "start_analyse")
                setSimpleAnalysis(data.payload);
              if (data.type === "summary") updateReport(data.payload);
            } else {
              if (data.type === "tasks_initial" && data.payload) {
                initialTasks(data.payload);
              } else if (data.type === "task_update" && data.payload) {
                updateTasks(data.payload);
              }
            }

            if (data.type === "done") {
              console.log("done");
              break;
            }

            if (data.type === "error") {
              console.error("error:", data.content);
              break;
            }
          } catch (parseError) {
            console.error("解析JSON错误:", parseError);
          }
        }
      }
    }

    reader.releaseLock();
  } catch (error) {
    console.error("Error sending message:", error);

    const updateMessages = initialUpdateMessages.map((msg) =>
      msg.id === assistantMessageId
        ? { ...msg, content: "出错了，哎嘿。" }
        : msg
    );
    setCurrentMessages(JSON.parse(JSON.stringify(updateMessages)));
  } finally {
    setIsLoading(false);
    const new_Messages = [
      newUserMessage,
      {
        id: assistantMessageId,
        sessionId: sessionId!,
        role: "assistant",
        content: accumulatedContent || "出错了，哎嘿。",
      },
    ];
    try {
      const response = await apiClient.post("/conversations/update_messages", {
        chat_messages: new_Messages,
      });
      // console.log("update_messages:", response);
    } catch (error) {
      console.log("error:", error);
      console.error("Failed to save messages:", error);
    }
  }
};
