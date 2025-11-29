"use client";
import { useEffect } from "react";
import { useConversationStore } from "@/store";

interface Props {
  initialData: any[];
}

export function ClientInitializer({ initialData }: Props) {
  const { intialChatSessions } = useConversationStore();

  useEffect(() => {
    if (initialData && initialData.length >= 0) {
      intialChatSessions(initialData);
    }
  }, []);

  return null;
}
