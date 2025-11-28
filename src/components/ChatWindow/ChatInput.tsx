import React, { useState } from "react";
import Image from "next/image";
import { ChatInputProps } from "@/types";

const ChatInput: React.FC<ChatInputProps> = ({
  placeholder,
  onSend,
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onSend && !disabled) {
      onSend(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 p-4 border-2 border-[#e5e5e5] rounded-4xl ${
        className || ""
      }`}
    >
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="w-full px-3 py-2 border border-transparent rounded-md focus:outline-none resize-none overflow-y-auto scrollbar-hide"
        style={{
          minHeight: "40px",
          maxHeight: "100px",
          height: "auto",
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = Math.min(target.scrollHeight, 100) + "px";
        }}
      />
      <div className="flex w-full justify-between px-2">
        <Image
          src="/add.svg"
          alt="添加附件"
          width={30}
          height={30}
          className="p-2 w-10 h-10 rounded-3xl hover:bg-[#e7e7e7] hover:cursor-pointer"
        ></Image>
        <button
          type="submit"
          disabled={!inputValue.trim() || disabled}
          className={`p-2 rounded-[50%]  ${
            !disabled
              ? "bg-black hover:cursor-pointer"
              : "bg-[#aeabab] hover:cursor-not-allowed"
          }`}
        >
          <Image src="/send.svg" alt="发送" width={25} height={25}></Image>
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
