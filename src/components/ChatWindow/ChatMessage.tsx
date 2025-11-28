import { ChatMessagesProps, ChatMessageBubbleProps } from "@/types";
import React, { useRef, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const renderContent = () => {
    if (typeof message.content === "string") {
      return message.content;
    }
    return JSON.stringify(message.content);
  };

  if (message.role === "user") {
    return (
      <div className="w-full flex px-3 justify-end">
        <div className="max-w-2/3 p-3 rounded-3xl bg-sky-100">
          {renderContent()}
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full flex px-3 justify-start">
      <div className="max-w-2/3 p-3 rounded-3xl bg-[#f4f4f4]">
        <Markdown>{renderContent()}</Markdown>
      </div>
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
