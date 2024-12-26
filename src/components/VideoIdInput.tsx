"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePollContext } from "../contexts/PollContext";

interface LiveChatResponse {
  videoId: string;
  liveChatId: string;
  error?: string;
}

interface ErrorResponse {
  error: string;
}

const VideoIdInput = () => {
  const [videoId, setVideoId] = useState("");
  const router = useRouter();
  const { resetPoll, setLiveChatId } = usePollContext();

  const handleGetLiveChatId = async () => {
    if (!videoId.trim()) {
      alert("⚠️ Please enter a valid YouTube Video ID.");
      return;
    }

    try {
      resetPoll();
      const response = await fetch("/api/youtube/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = (await response.json()) as LiveChatResponse | ErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in data ? data.error : "Failed to retrieve live chat ID",
        );
      }

      if ("liveChatId" in data) {
        setLiveChatId(data.liveChatId, videoId);
        alert("✅ Live chat ID retrieved successfully!");
        router.push("/poll-time");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      alert(`❌ ${errorMessage}`);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center rounded-lg bg-white p-8 shadow-lg">
        <label
          htmlFor="videoId"
          className="mb-2 text-lg font-medium text-gray-700"
        >
          YouTube Video ID
        </label>
        <input
          id="videoId"
          type="text"
          placeholder="Enter YouTube Video ID"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="w-64 rounded-lg border px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => void handleGetLiveChatId()}
          className="mt-4 rounded-lg bg-black px-6 py-2 text-white transition hover:bg-gray-800"
        >
          Get Live Chat
        </button>
      </div>
    </div>
  );
};

export default VideoIdInput;
