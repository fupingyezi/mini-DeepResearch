export interface taskType {
  id: string;
  description: string;
  status: "pending" | "searched" | "failed_attempt" | "processed";
  needSearch?: boolean;
  searchResult?: string[];
  result?: string;
  feedback: string;
}
