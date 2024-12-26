"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const TimeSelector = () => {
  const [seconds, setSeconds] = useState(30);
  const [isOptionSelected, setIsOptionSelected] = useState(false);
  const router = useRouter();

  const adjustTime = (amount: number) => {
    setSeconds((prev) => Math.max(5, prev + amount));
  };

  const handleNextClick = () => {
    if (!isOptionSelected) {
      alert("Please select an option.");
      return;
    }
    router.push(`/home?time=${seconds}`);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-gray-100 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-semibold text-gray-800">
          Poll for the Question
        </h1>

        <div className="mb-6 flex items-center gap-6">
          <label className="text-lg font-medium text-gray-700"> A/B/C/D</label>
          <input
            type="radio"
            className="h-6 w-6 accent-blue-500"
            onChange={() => setIsOptionSelected(true)}
          />
        </div>

        <div className="mb-6 flex items-center justify-between space-x-4 rounded-lg bg-white p-2 shadow-lg">
          <button
            onClick={() => adjustTime(-5)}
            className="rounded-full bg-blue-100 p-2 transition-all duration-300 hover:bg-blue-200"
          >
            <Minus className="h-4 w-4 text-blue-500" />
          </button>

          <div className="text-xl font-semibold text-gray-700">
            {seconds} sec
          </div>

          <button
            onClick={() => adjustTime(5)}
            className="rounded-full bg-blue-100 p-2 transition-all duration-300 hover:bg-blue-200"
          >
            <Plus className="h-4 w-4 text-blue-500" />
          </button>
        </div>

        <button
          onClick={handleNextClick}
          className="h-12 w-32 rounded-lg bg-gray-600 font-semibold text-white shadow-md transition-all duration-300 hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TimeSelector;
