"use client";

import { PlusCircleOutlined, EllipsisOutlined } from "@ant-design/icons";

import { useEffect, useState } from "react";
import { ChatSessionType, chunkMessageType } from "@/types";
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
  }-${date.getDay()}`;

  const handleSelectSession = async (sessionId: UUIDTypes) => {
    setCurrentSession(sessionId);
    try {
      const response = await apiClient.post(
        "/conversations/get_current_messages",
        { sessionId }
      );
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
  const [sessions, setSessions] = useState<ChatSessionType[]>([]);
  const { intialChatSessions, chatSessions } = useConversationStore();

  const checkDifferentDay = (session: ChatSessionType, index: number) => {
    const date = new Date(session.updated_at);
    const showDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
    let lastDate;
    if (index > 0) {
      const date = new Date(sessions[index - 1].updated_at);
      lastDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
    }

    return index === 0 || showDate !== lastDate;
  };

  useEffect(() => {
    const fetchSessions = async () => {
      const data = await getConversationSessions();
      setSessions(data.data || []);
      intialChatSessions(data.data || []);
    };

    fetchSessions();
  }, []);

  return (
    <div className="w-full flex h-full flex-col gap-6 items-center">
      <div className="w-[92%] h-10 rounded-2xl flex justify-center gap-2 items-center cursor-pointer bg-white border border-transparent shadow-[0px_-2px_2px_rgba(72,104,178,0.04),0px_2px_2px_rgba(106,111,117,0.09),0px_1px_2px_rgba(72,104,178,0.08)] hover:shadow-[0_4px_4px_rgba(72,104,178,0.04),0_-3px_4px_rgba(72,104,178,0.04),0_6px_6px_rgba(106,111,117,0.1)]">
        <PlusCircleOutlined style={{ color: "black", fontSize: 20 }} />
        开启新对话
      </div>
      <div className="w-[92%] h-4/5 overflow-y-scroll flex flex-col scrollbar-hide">
        {sessions.map((session, index) => (
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

// const mockChatSessions: ChatSessionType[] = [
//   {
//     id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
//     seqId: 1,
//     title: "项目启动会议讨论纪要1111111111111",
//     created_at: 1704067200000,
//     updated_at: 1704070800000,
//   },
//   {
//     id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
//     seqId: 2,
//     title: "技术架构设计方案评审111111111111",
//     created_at: 1704153600000,
//     updated_at: 1704157200000,
//   },
//   {
//     id: "c3d4e5f6-g7h8-9012-cdef-345678901234",
//     seqId: 3,
//     title: "用户反馈与需求收集整理",
//     created_at: 1704240000000,
//     updated_at: 1704243600000,
//   },
//   {
//     id: "d4e5f6g7-h8i9-0123-defg-456789012345",
//     seqId: 4,
//     title: "产品功能需求详细分析",
//     created_at: 1704326400000,
//     updated_at: 1704330000000,
//   },
//   {
//     id: "e5f6g7h8-i9j0-1234-efgh-567890123456",
//     seqId: 5,
//     title: "下周开发计划与任务分配",
//     created_at: 1704412800000,
//     updated_at: 1704416400000,
//   },
//   {
//     id: "f6g7h8i9-j0k1-2345-fghi-678901234567",
//     seqId: 6,
//     title: "前端组件库技术选型讨论",
//     created_at: 1704499200000,
//     updated_at: 1704502800000,
//   },
//   {
//     id: "g7h8i9j0-k1l2-3456-ghij-789012345678",
//     seqId: 7,
//     title: "后端API接口设计规范",
//     created_at: 1704585600000,
//     updated_at: 1704589200000,
//   },
//   {
//     id: "h8i9j0k1-l2m3-4567-hijk-890123456789",
//     seqId: 8,
//     title: "数据库表结构优化方案",
//     created_at: 1704672000000,
//     updated_at: 1704675600000,
//   },
//   {
//     id: "i9j0k1l2-m3n4-5678-ijkl-901234567890",
//     seqId: 9,
//     title: "测试用例编写与评审",
//     created_at: 1704758400000,
//     updated_at: 1704762000000,
//   },
//   {
//     id: "j0k1l2m3-n4o5-6789-jklm-012345678901",
//     seqId: 10,
//     title: "部署流程与CI/CD配置",
//     created_at: 1704844800000,
//     updated_at: 1704848400000,
//   },
//   {
//     id: "k1l2m3n4-o5p6-7890-klmn-123456789012",
//     seqId: 11,
//     title: "性能优化与缓存策略",
//     created_at: 1704931200000,
//     updated_at: 1704934800000,
//   },
//   {
//     id: "l2m3n4o5-p6q7-8901-lmno-234567890123",
//     seqId: 12,
//     title: "安全漏洞修复方案",
//     created_at: 1705017600000,
//     updated_at: 1705021200000,
//   },
//   {
//     id: "m3n4o5p6-q7r8-9012-mnop-345678901234",
//     seqId: 13,
//     title: "移动端适配问题讨论",
//     created_at: 1705104000000,
//     updated_at: 1705107600000,
//   },
//   {
//     id: "n4o5p6q7-r8s9-0123-nopq-456789012345",
//     seqId: 14,
//     title: "第三方服务集成方案",
//     created_at: 1705190400000,
//     updated_at: 1705194000000,
//   },
//   {
//     id: "o5p6q7r8-s9t0-1234-opqr-567890123456",
//     seqId: 15,
//     title: "代码审查与规范制定",
//     created_at: 1705276800000,
//     updated_at: 1705280400000,
//   },
//   {
//     id: "p6q7r8s9-t0u1-2345-pqrs-678901234567",
//     seqId: 16,
//     title: "团队协作工具使用指南",
//     created_at: 1705363200000,
//     updated_at: 1705366800000,
//   },
//   {
//     id: "q7r8s9t0-u1v2-3456-qrst-789012345678",
//     seqId: 17,
//     title: "项目进度汇报与总结",
//     created_at: 1705449600000,
//     updated_at: 1705453200000,
//   },
//   {
//     id: "r8s9t0u1-v2w3-4567-rstu-890123456789",
//     seqId: 18,
//     title: "技术债务清理计划",
//     created_at: 1705536000000,
//     updated_at: 1705539600000,
//   },
//   {
//     id: "s9t0u1v2-w3x4-5678-stuv-901234567890",
//     seqId: 19,
//     title: "新功能开发排期",
//     created_at: 1705622400000,
//     updated_at: 1705626000000,
//   },
//   {
//     id: "t0u1v2w3-x4y5-6789-tuvw-012345678901",
//     seqId: 20,
//     title: "用户体验改进建议",
//     created_at: 1705708800000,
//     updated_at: 1705712400000,
//   },
// ];
