export interface taskType {
  id: string;
  description: string;
  status: "pending" | "searched" | "processed";
  needSearch?: boolean;
  searchResult?: string[];
  result?: string[];
}
