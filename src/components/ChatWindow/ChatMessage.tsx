import Image from "next/image";
import Markdown from "react-markdown";
import { Button, Spin, Tooltip, message as antdMessage } from "antd";
import { LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";

import { ChatMessagesProps, ChatMessageBubbleProps } from "@/types";
import React, { useState, useRef, useEffect, useCallback } from "react";
import copy from "copy-to-clipboard";
import {
  useConversationStore,
  useChatSelectStore,
  useDeepResearchProcessStore,
} from "@/store";

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const { status } = useDeepResearchProcessStore();
  const { selectedAgent } = useChatSelectStore();
  const [isShowOtherOperators, setIsShowOtherOperators] =
    useState<boolean>(false);
  const [showCopySuccess, setShowCopySuccess] = useState<boolean>(false);
  const renderContent = () => {
    if (typeof message.content === "string") {
      return message.content;
    }
    return JSON.stringify(message.content);
  };

  useEffect(() => {
    if (showCopySuccess) {
      antdMessage.success("Copy Success!");
      const timer = setTimeout(() => {
        setShowCopySuccess(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [showCopySuccess]);

  // 处理复制等其他操作
  const renderAdditionalOperator = (role: string) => {
    const userMessagesOperators: ("copy" | "edit")[] = ["copy", "edit"];
    const aiMessagesOperators: ("copy" | "recall" | "download")[] = [
      "copy",
      "recall",
      "download",
    ];
    const operatorToTextMap = (op: "copy" | "edit" | "recall" | "download") => {
      switch (op) {
        case "copy":
          return "复制";
        case "edit":
          return "编辑";
        case "recall":
          return "重新生成";
        case "download":
          return "下载";
      }
    };

    const handleOperator = (op: "copy" | "edit" | "recall" | "download") => {
      switch (op) {
        case "copy": {
          copy(renderContent());
          setShowCopySuccess(true);
          return;
        }
      }
    };

    return (
      <div
        className={`absolute -bottom-10  flex transition-all  ${
          role === "user" ? "justify-end" : "justify-start"
        } ${isShowOtherOperators ? "opacity-100" : "opacity-0"}`}
        onMouseEnter={() => setIsShowOtherOperators(true)}
        onMouseLeave={() => setIsShowOtherOperators(false)}
      >
        {(role === "user" ? userMessagesOperators : aiMessagesOperators).map(
          (op, index) => {
            return (
              <Tooltip
                key={index}
                title={`${operatorToTextMap(op)}`}
                placement="bottom"
              >
                <Image
                  src={`/${op}.svg`}
                  alt={`${op}`}
                  width={20}
                  height={20}
                  className="w-7 h-7 rounded-xl p-1 m-0.5 mb-2 hover:bg-[#e7e7e7] hover:cursor-pointer"
                  onClick={() => handleOperator(op)}
                ></Image>
              </Tooltip>
            );
          }
        )}
      </div>
    );
  };

  // user
  if (message.role === "user") {
    return (
      <div className="w-full px-3 mb-5 flex justify-end relative">
        <div
          className="max-w-2/3 p-3 rounded-3xl bg-sky-100"
          onMouseEnter={() => setIsShowOtherOperators(true)}
          onMouseLeave={() => setIsShowOtherOperators(false)}
        >
          {renderContent()}
        </div>
        {renderAdditionalOperator(message.role)}
      </div>
    );
  }

  // loading
  if (
    message.role === "assistant" &&
    (message.content === "" ||
      (Array.isArray(message) && !message.content.length))
  ) {
    return (
      <Spin
        indicator={<LoadingOutlined style={{ color: "#828282" }} />}
        size="large"
      ></Spin>
    );
  }

  // ai
  return (
    <div className="w-full flex px-3 mb-5 justify-start flex-wrap relative">
      <div
        className="max-w-2/3 p-3 rounded-3xl bg-white flex flex-col"
        onMouseEnter={() => setIsShowOtherOperators(true)}
        onMouseLeave={() => setIsShowOtherOperators(false)}
      >
        <Markdown>{renderContent()}</Markdown>
        {status !== "notCall" && (
          <Button className="h-4 w-2xs rounded-2xl">
            {status === "processing" ? (
              <>
                <LoadingOutlined />
                正在进行深度研究
              </>
            ) : (
              <>
                <CheckCircleOutlined style={{ color: "green" }} /> 深度研究完成
              </>
            )}
          </Button>
        )}
      </div>
      {renderAdditionalOperator(message.role)}
    </div>
  );
};

const ChatMessage: React.FC<ChatMessagesProps> = ({
  messages,
  emptyStateComponent,
  shouldAutoScroll,
  setShouldAutoScroll,
  className,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !shouldAutoScroll) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [shouldAutoScroll]);

  const checkShouldAutoScroll = useCallback(
    (wheelEvent?: React.WheelEvent<HTMLDivElement>) => {
      if (!messagesContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      if (wheelEvent && wheelEvent.deltaY < 0 && !isAtBottom) {
        setShouldAutoScroll(false);
        return;
      }
      if (isAtBottom) {
        setShouldAutoScroll(true);
      }
    },
    [setShouldAutoScroll]
  );

  useEffect(() => {
    if (messagesContainerRef.current && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  if (!messages || messages.length === 0) {
    return <div className={className}>{emptyStateComponent}</div>;
  }

  return (
    <div
      className={`space-y-4 ${
        className || ""
      } h-full overflow-y-scroll scrollbar-hide`}
      ref={messagesContainerRef}
      onScroll={() => checkShouldAutoScroll()}
      onWheel={(e) => checkShouldAutoScroll(e)}
    >
      {messages.map((msg, index) => (
        <ChatMessageBubble key={index} message={msg} />
      ))}
    </div>
  );
};

export default ChatMessage;
