"use client";

import {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { type Message, type ChartData, type FirstResponders } from "@/types";
import { DEFAULT_CHART_DATA, DEFAULT_FIRST_RESPONDERS } from "@/utils";

interface PollContextType {
  liveChatId: string | null;
  videoId: string | null;
  setLiveChatId: (liveChatId: string | null, videoId: string | null) => void;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  fetching: boolean;
  setFetching: (fetching: boolean) => void;
  eventSourceRef: React.MutableRefObject<EventSource | null>;
  chartData: ChartData;
  setChartData: (data: ChartData) => void;
  firstResponders: FirstResponders;
  setFirstResponders: (responders: FirstResponders) => void;
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;
  processMessage: (message: Message) => void;
  resetPoll: () => void;
  sessionId: number | null;
  setSessionId: (id: number | null) => void;
}

// Create a proper noop function that satisfies the linter
function noop<T>(..._args: unknown[]): T | void {
  /* intentionally empty */
}

// Create default context with noop functions
const defaultContext: PollContextType = {
  liveChatId: null,
  videoId: null,
  setLiveChatId: noop,
  messages: [],
  setMessages: noop,
  fetching: false,
  setFetching: noop,
  eventSourceRef: { current: null },
  chartData: DEFAULT_CHART_DATA,
  setChartData: noop,
  firstResponders: DEFAULT_FIRST_RESPONDERS,
  setFirstResponders: noop,
  selectedOption: null,
  setSelectedOption: noop,
  processMessage: noop,
  resetPoll: noop,
  sessionId: null,
  setSessionId: noop,
};

export const PollContext = createContext<PollContextType>(defaultContext);

export const PollProvider = ({ children }: { children: ReactNode }) => {
  const [liveChatId, setLiveChatIdState] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetching, setFetching] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [chartData, setChartData] = useState<ChartData>(DEFAULT_CHART_DATA);
  const [firstResponders, setFirstResponders] = useState<FirstResponders>(
    DEFAULT_FIRST_RESPONDERS,
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const setLiveChatId = useCallback((liveChatId: string | null, videoId: string | null) => {
    setLiveChatIdState(liveChatId);
    setVideoId(videoId);
  }, []);

  const processMessage = useCallback((message: Message) => {
    if (!message?.text) return;
    const text = message.text.trim().toUpperCase();
    if (["A", "B", "C", "D"].includes(text)) {
      setChartData((prevData) => ({
        ...prevData,
        [text]: (prevData[text] ?? 0) + 1,
      }));

      setFirstResponders((prev) => {
        const updatedResponders = { ...prev };
        updatedResponders[text] = updatedResponders[text] ?? [];
        if (!updatedResponders[text].includes(message.author)) {
          updatedResponders[text] = [
            ...updatedResponders[text],
            message.author,
          ];
        }
        return updatedResponders;
      });
    }
  }, []);

  const resetPoll = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLiveChatId(null, null);
    setChartData(DEFAULT_CHART_DATA);
    setMessages([]);
    setFirstResponders(DEFAULT_FIRST_RESPONDERS);
    setSelectedOption(null);
    setFetching(false);
    setSessionId(null);
  }, [setLiveChatId, setChartData, setMessages, setFirstResponders, setSelectedOption, setFetching, setSessionId]);

  const value = {
    liveChatId,
    videoId,
    setLiveChatId,
    messages,
    setMessages,
    fetching,
    setFetching,
    eventSourceRef,
    chartData,
    setChartData,
    firstResponders,
    setFirstResponders,
    selectedOption,
    setSelectedOption,
    processMessage,
    resetPoll,
    sessionId,
    setSessionId,
  };

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
};

export const usePollContext = () => {
  const context = useContext(PollContext);
  if (context === undefined) {
    throw new Error("usePollContext must be used within a PollProvider");
  }
  return context;
};
