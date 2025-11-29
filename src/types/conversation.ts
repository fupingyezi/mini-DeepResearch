import { ContentBlock } from "langchain";
import { UUIDTypes } from "uuid";

export interface ChatMessageType {
  id: number;
  sessionId: UUIDTypes;
  role: string;
  content: string | ContentBlock[];
  files?: any[];
  accumulatedTokenUsage?: number;
}

export interface ChatSessionType {
  id: UUIDTypes;
  seqId: number;
  title: string;
  created_at: number;
  updated_at: number;
}
