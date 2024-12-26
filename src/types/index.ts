export interface Message {
  text: string;
  author: string;
  authorImage: string;
  publishedAt: string;
}

export type Viewer = Message;

export interface ChartData {
  [key: string]: number;
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface FirstResponders {
  [key: string]: string[];
  A: string[];
  B: string[];
  C: string[];
  D: string[];
}

export interface ChatSession {
  id: string;
  live_chat_id: string;
  status: "initialized" | "active" | "stopped";
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}
