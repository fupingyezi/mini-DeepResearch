"use client";

import { PlusCircleOutlined, EllipsisOutlined } from "@ant-design/icons";

import { useEffect, useState } from "react";
import { ChatSessionType } from "@/types";
import apiClient from "@/utils/request/api";
import { useConversationStore } from "@/store";
import { UUIDTypes, v4 as uuidv4 } from "uuid";

async function getConversationSessions() {
  try {
    const data = await apiClient.get("/conversations/get_all_sessions");
    return data;
  } catch (error) {
    console.error("Failed to fetch conversation sessions:", error);
    return { data: [] };
  }
}

const SessionBubble: React.FC<{
  chatSession: ChatSessionType;
  isShowDate: boolean;
}> = ({ chatSession, isShowDate = false }) => {
  const [isHover, setIsHover] = useState<boolean>(false);
  const { currentSession, setCurrentSession, setCurrentMessages } =
    useConversationStore();
  const date = new Date(chatSession.updated_at);
  const showDate = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;

  const handleSelectSession = async (sessionId: UUIDTypes) => {
    setCurrentSession(sessionId);
    try {
      const response = await apiClient.post(
        "/conversations/get_current_messages",
        { sessionId }
      );
      // console.log(response.data);
      setCurrentMessages(response.data);
    } catch (error) {
      console.error("error:", error);
    }
  };

  return (
    <>
      {isShowDate && (
        <div className="w-full px-3 text-[12px] text-[#81858c]">{showDate}</div>
      )}
      <div
        className="w-full px-3 min-h-10 leading-10 rounded-2xl relative overflow-hidden text-ellipsis whitespace-nowrap hover:bg-[#ebedef] hover:cursor-pointer"
        style={{
          backgroundColor: chatSession.id === currentSession ? "#e4ecfc" : "",
          color: chatSession.id === currentSession ? "blue" : "",
        }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onClick={() => handleSelectSession(chatSession.id)}
      >
        {chatSession.title}
        {isHover && (
          <div
            className={`w-9 h-full flex items-center justify-center absolute right-0 top-1/2 transform -translate-y-1/2  ${
              chatSession.id === currentSession
                ? "bg-[#e4ecfc]"
                : "bg-[#ebedef]"
            }`}
          >
            <EllipsisOutlined
              className={`w-6 h-6 rounded-4xl p-0.5 ${
                chatSession.id === currentSession
                  ? "hover:bg-[#d9e3f3]"
                  : "hover:bg-[#e5e8eb]"
              } transition`}
              style={{ fontSize: 20 }}
            />
          </div>
        )}
      </div>
    </>
  );
};

const SiderContent = () => {
  const {
    intialChatSessions,
    chatSessions,
    setCurrentSession,
    setCurrentMessages,
  } = useConversationStore();

  const checkDifferentDay = (session: ChatSessionType, index: number) => {
    const date = new Date(session.updated_at);
    const showDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    let lastDate;
    if (index > 0) {
      const date = new Date(chatSessions[index - 1].updated_at);
      lastDate = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;
    }

    return index === 0 || showDate !== lastDate;
  };

  const handleCreateNewSession = () => {
    setCurrentMessages([]);
    setCurrentSession("");
  };

  useEffect(() => {
    const fetchSessions = async () => {
      const response = await getConversationSessions();
      intialChatSessions(response.data || []);
    };

    fetchSessions();
  }, []);

  return (
    <div className="w-full flex h-full flex-col gap-6 items-center">
      <div
        className="w-[92%] h-10 rounded-2xl flex justify-center gap-2 items-center cursor-pointer bg-white border border-transparent shadow-[0px_-2px_2px_rgba(72,104,178,0.04),0px_2px_2px_rgba(106,111,117,0.09),0px_1px_2px_rgba(72,104,178,0.08)] hover:shadow-[0_4px_4px_rgba(72,104,178,0.04),0_-3px_4px_rgba(72,104,178,0.04),0_6px_6px_rgba(106,111,117,0.1)]"
        onClick={() => handleCreateNewSession()}
      >
        <PlusCircleOutlined style={{ color: "black", fontSize: 20 }} />
        开启新对话
      </div>
      <div className="w-[92%] h-4/5 overflow-y-scroll flex flex-col scrollbar-hide">
        {chatSessions.map((session, index) => (
          <SessionBubble
            key={index}
            chatSession={session}
            isShowDate={checkDifferentDay(session, index)}
          />
        ))}
      </div>
    </div>
  );
};

export default SiderContent;
