export interface searchResultItem {
  title: string;
  sourceUrl: string;
  content: string;
  relativeScore: number;
}

export interface taskType {
  id: string;
  description: string;
  // status: "pending" | "searched" | "failed_attempt" | "processed";
  status: string;
  needSearch?: boolean;
  searchResult?: searchResultItem[];
  result?: string;
  // feedback: string;
}
