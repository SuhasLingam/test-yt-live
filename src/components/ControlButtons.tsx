"use client";

import { useRouter } from "next/navigation";
import { usePollContext } from "@/contexts/PollContext";
import type { Message } from "@/types";
import { DEFAULT_CHART_DATA, DEFAULT_FIRST_RESPONDERS } from "@/utils";
import { api } from "@/utils/api";
import { useRef } from "react";

interface ControlButtonsProps {
  setIsLoading: (loading: boolean) => void;
  selectedTime: number;
  disabled?: boolean;
  correctOption: string;
}

// Type guard for Message
const isValidMessage = (msg: unknown): msg is Message => {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "text" in msg &&
    typeof msg.text === "string" &&
    "author" in msg &&
    typeof msg.author === "string" &&
    "authorImage" in msg &&
    typeof msg.authorImage === "string" &&
    "publishedAt" in msg &&
    typeof msg.publishedAt === "string"
  );
};

const ControlButtons = ({
  setIsLoading,
  selectedTime,
  disabled = false,
  correctOption,
}: ControlButtonsProps) => {
  const router = useRouter();
  const {
    liveChatId,
    videoId,
    fetching,
    setFetching,
    eventSourceRef,
    setMessages,
    processMessage,
    resetPoll,
    setSessionId,
    setChartData,
    setFirstResponders,
    setSelectedOption,
  } = usePollContext();

  const startMutation = api.chat.start.useMutation();
  const stopMutation = api.chat.stop.useMutation();
  const playerRef = useRef<YT.Player | null>(null);

  // Function to get current video timestamp
  const getCurrentTimestamp = () => {
    if (!playerRef.current) {
      console.warn("YouTube player not initialized");
      return 0;
    }
    return Math.floor(playerRef.current.getCurrentTime());
  };

  const handleStart = async () => {
    if (!liveChatId || !videoId || !correctOption) return;

    try {
      setIsLoading(true);
      setFetching(true);

      const result = await startMutation.mutateAsync({
        videoId,
        liveChatId,
        duration: selectedTime,
        videoTimestamp: getCurrentTimestamp(),
        correctOption: correctOption as "A" | "B" | "C" | "D",
      });

      setSessionId(result.sessionId);

      // Open new EventSource
      eventSourceRef.current = new EventSource(
        `/api/stream-chat?liveChatId=${encodeURIComponent(liveChatId)}`,
      );
      eventSourceRef.current.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") {
            console.error("Invalid event data type");
            return;
          }

          let parsedData: unknown;
          try {
            parsedData = JSON.parse(event.data);
          } catch {
            console.error("Failed to parse message data");
            return;
          }

          if (!isValidMessage(parsedData)) {
            console.error("Invalid message format");
            return;
          }

          setMessages((prevMessages: Message[]) => [
            ...prevMessages,
            parsedData,
          ]);
          processMessage(parsedData);
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      eventSourceRef.current.onerror = () => {
        console.error("EventSource failed");
        eventSourceRef.current?.close();
        setFetching(false);
      };

      // Adjust timeout based on user input
      void setTimeout(() => {
        void handleStop();
        setIsLoading(false);
      }, selectedTime * 1000);
    } catch (error) {
      console.error("Start error:", error);
      alert("Failed to start fetching chats");
      setIsLoading(false);
      setFetching(false);
    }
  };

  const handleStop = async () => {
    try {
      if (!liveChatId) return;

      await stopMutation.mutateAsync({
        liveChatId,
        videoTimestamp: getCurrentTimestamp(),
      });

      setFetching(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    } catch (error) {
      console.error("Stop error:", error);
      alert("Failed to stop fetching chats");
    }
  };

  const handleNextPoll = async () => {
    try {
      // Only stop the current EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Reset poll data but keep liveChatId and videoId
      setMessages([]);
      setChartData(DEFAULT_CHART_DATA);
      setFirstResponders(DEFAULT_FIRST_RESPONDERS);
      setSelectedOption(null);
      setFetching(false);

      // Reload the page with the same time parameter to reset the poll
      const currentTime = new URLSearchParams(window.location.search).get("time") ?? "30";
      router.push(`/home?time=${currentTime}`);
    } catch (error) {
      console.error("Next poll error:", error);
      alert("Failed to start next poll. Please try again.");
    }
  };

  const handleEndSession = async () => {
    try {
      if (!liveChatId) return;

      await stopMutation.mutateAsync({
        liveChatId,
        videoTimestamp: getCurrentTimestamp(),
      });

      resetPoll(); // This will clear everything including liveChatId
      router.push("/");
    } catch (error) {
      console.error("End session error:", error);
      alert("Failed to end session. Please try again.");
    }
  };

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <button
        onClick={() => void handleStart()}
        disabled={fetching}
        className={`rounded-lg px-4 py-2 transition ${
          fetching
            ? "cursor-not-allowed bg-gray-400"
            : "bg-black text-white hover:bg-black/80"
        }`}
      >
        Start
      </button>
      <button
        onClick={() => void handleNextPoll()}
        disabled={fetching}
        className={`rounded-lg px-4 py-2 transition ${
          fetching
            ? "cursor-not-allowed bg-gray-400"
            : "bg-black text-white hover:bg-black/80"
        }`}
      >
        Next Poll
      </button>
      <button
        onClick={() => void handleEndSession()}
        className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
      >
        End Session
      </button>
    </div>
  );
};

export default ControlButtons;
