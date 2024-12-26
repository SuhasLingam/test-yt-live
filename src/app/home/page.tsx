"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { usePollContext } from "@/contexts/PollContext";
import ControlButtons from "@/components/ControlButtons";
import PollChart from "@/components/PollChart";
import TestLoadingAnimation from "@/components/TestLoadingAnimation";
import FirstResponderSelector from "@/components/FirstResponderSelector";
import { api } from "@/utils/api";
import { Leaderboard } from "@/components/Leaderboard";
import Link from "next/link";

function HomeContent() {
  const searchParams = useSearchParams();
  const selectedTime = parseInt(searchParams.get("time") ?? "30");
  const {
    chartData,
    messages,
    firstResponders,
    liveChatId,
    selectedOption,
    fetching,
    sessionId,
  } = usePollContext();
  const [isLoading, setIsLoading] = useState(false);
  const [correctOption, setCorrectOption] = useState<string>("");
  const updateCorrectOption = api.poll.updateCorrectOption.useMutation();

  useEffect(() => {
    const updatePollState = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch("/api/poll/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            liveChatId,
            chartData,
            firstResponders,
            selectedOption,
            isFetching: fetching,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update poll state");
        }
      } catch (error) {
        console.error("Error updating poll state:", error);
      }
    };

    // Update immediately
    if (sessionId) {
      void updatePollState();
    }

    // Set up periodic updates
    const interval = setInterval(() => {
      if (sessionId) {
        void updatePollState();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    chartData,
    firstResponders,
    selectedOption,
    fetching,
    liveChatId,
    sessionId,
  ]);

  const handleCorrectOptionChange = async (option: string) => {
    console.log("Selected option:", option);
    
    if (!["A", "B", "C", "D"].includes(option)) {
      console.log("Invalid option");
      return;
    }
    
    // Always update local state
    setCorrectOption(option);
    console.log("Local state updated:", option);

    // Only update database if session exists
    if (sessionId) {
      try {
        const result = await updateCorrectOption.mutateAsync({
          sessionId,
          correctOption: option as "A" | "B" | "C" | "D",
        });
        console.log("Database updated successfully:", result);
      } catch (error) {
        console.error("Failed to update correct option:", error);
        // Don't revert local state on error, just show alert
        alert("Failed to update correct answer in database, but your selection is saved locally.");
      }
    } else {
      console.log("No session yet, option saved locally");
    }
  };

  return (  
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Live Poll</h1>
        <Link
          href="/history"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          View History
        </Link>
      </div>

      {isLoading ? (
        <TestLoadingAnimation initialTime={selectedTime} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <PollChart chartData={chartData} />
            </div>
            <div className="md:col-span-1">
              <Leaderboard />
            </div>
          </div>
          <FirstResponderSelector
            messages={messages}
            firstResponders={firstResponders}
          />
        </>
      )}
      <ControlButtons
        setIsLoading={setIsLoading}
        selectedTime={selectedTime}
        disabled={!correctOption}
        correctOption={correctOption}
      />

      <div className="mt-6">
        <div className="flex flex-col space-y-2">
          <p className="font-medium text-2xl text-gray-700">Select Correct Answer:</p>
          <div className="flex flex-wrap gap-6">
            {["A", "B", "C", "D"].map((option) => (
              <label 
                key={option} 
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
                onClick={() => void handleCorrectOptionChange(option)}
              >
                <input
                  type="radio"
                  name="correctAnswer"
                  value={option}
                  checked={correctOption === option}
                  onChange={(e) => void handleCorrectOptionChange(e.target.value)}
                  className="h-5 w-5 accent-black cursor-pointer"
                />
                <span className="text-lg font-medium select-none">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
