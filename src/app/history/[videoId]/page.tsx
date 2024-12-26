"use client";

import { api } from "@/utils/api";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VideoHistoryPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  
  const { data: leaderboardData } = api.leaderboard.getTopUsers.useQuery(
    { 
      limit: 100,
      videoId
    },
    {
      enabled: !!videoId
    }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Session Details</h1>
        <Link
          href="/history"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to History
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Video ID: {videoId}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>
        <div className="space-y-4">
          {leaderboardData?.map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-4">
                  {index + 1}
                </span>
                <div className="relative w-8 h-8">
                  {user.userImage ? (
                    <img
                      src={user.userImage}
                      alt={user.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.userName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {user.userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.correctAnswers} correct / {user.totalAnswers} total
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium">{user.points} pts</div>
            </div>
          ))}
          {!leaderboardData?.length && (
            <div className="text-center text-gray-500 py-4">
              No participants found
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 