export interface searchResultItem {
  title: string;
  sourceUrl: string;
  content: string;
  relativeScore: number;
}

export interface taskType {
  id: string; // AI生成的步骤标识，如 "step1_understand_ecma"
  taskId?: string; // 数据库用的UUID
  description: string;
  // status: "pending" | "searched" | "failed_attempt" | "processed";
  status: string;
  needSearch?: boolean;
  searchResult?: searchResultItem[];
  result?: string;
  // feedback: string;
}
