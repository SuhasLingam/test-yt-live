"use client";

import { useState } from "react";
import Image from "next/image";

interface Viewer {
  author: string;
  authorImage: string;
  publishedAt: string;
  text: string;
}

interface FirstResponderSelectorProps {
  messages: Viewer[];
  firstResponders: Record<string, string[]>;
}

const FirstResponderSelector = ({
  messages,
  firstResponders,
}: FirstResponderSelectorProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const medalIcons = ["🥇", "🥈", "🥉"];

  const handleOptionSelect = (choice: string) => {
    setSelectedOption(choice);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
        First Responder Leaderboard
      </h2>

      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
          {["A", "B", "C", "D"].map((choice) => (
            <label key={choice} className="flex items-center space-x-2">
              <input
                type="radio"
                name="firstResponder"
                value={choice}
                onChange={() => handleOptionSelect(choice)}
                checked={selectedOption === choice}
                className="h-4 w-4 accent-blue-500"
              />
              <span className="text-lg text-gray-700">{choice}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedOption ? (
        <div className="rounded-lg bg-gray-200 p-4 shadow-md">
          <p className="mb-4 text-lg font-medium text-gray-800">
            Viewers who answered{" "}
            <span className="font-bold">{selectedOption}</span>:
          </p>
          <ul className="space-y-3">
            {firstResponders[selectedOption]?.map((viewer, index) => {
              const message = messages.find((msg) => msg.author === viewer);
              if (!message) return null;

              return (
                <li
                  key={index}
                  className="flex items-center space-x-4 rounded-lg bg-white p-3 shadow-sm hover:bg-gray-50"
                >
                  {index < 3 && (
                    <span className="text-2xl">{medalIcons[index]}</span>
                  )}
                  <Image
                    src={message.authorImage}
                    alt={viewer}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-blue-400"
                  />
                  <div className="flex-1">
                    <span className="block font-semibold text-gray-800">
                      {viewer}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-sm text-gray-500">
                    {new Date(message.publishedAt).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No responses yet. Select an option to view the leaderboard.
        </p>
      )}
    </div>
  );
};

export default FirstResponderSelector;
