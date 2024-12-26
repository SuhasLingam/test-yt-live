"use client";

import { api } from "@/utils/api";
import Link from "next/link";

type TopParticipant = {
  userId: string;
  userName: string;
  userImage: string | null;
  points: number;
  correctAnswers: number;
  totalAnswers: number;
};

type VideoSession = {
  videoId: string;
  startedAt: Date;
  endedAt: Date | null;
  totalPolls: number;
  totalParticipants: number;
  totalCorrectAnswers: number;
  totalAnswers: number;
  totalPoints: number;
  topParticipants: TopParticipant[];
};

export default function HistoryPage() {
  const { data: videoSessions } = api.leaderboard.getVideoLeaderboards.useQuery({ limit: 50 });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Video Session History</h1>
      
      <div className="grid gap-6">
        {videoSessions?.map((session: VideoSession) => (
          <div 
            key={session.videoId} 
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Video ID: {session.videoId}
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Started: {formatDate(session.startedAt)}</p>
                  {session.endedAt && (
                    <p>Ended: {formatDate(session.endedAt)}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium space-y-1">
                  <p>Total Polls: {session.totalPolls}</p>
                  <p>Total Participants: {session.totalParticipants}</p>
                </div>
              </div>
            </div>

            {session.topParticipants.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">Top Participants</h3>
                <div className="space-y-3">
                  {session.topParticipants.map((participant, index) => (
                    <div
                      key={participant.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                        <div className="relative w-8 h-8">
                          {participant.userImage ? (
                            <img
                              src={participant.userImage}
                              alt={participant.userName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {participant.userName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{participant.userName}</p>
                          <p className="text-sm text-gray-500">
                            {participant.correctAnswers} correct / {participant.totalAnswers} total
                          </p>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{participant.points} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Link
                href={`/history/${session.videoId}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Full Leaderboard →
              </Link>
            </div>
          </div>
        ))}
        
        {!videoSessions?.length && (
          <div className="text-center text-gray-500 py-8">
            No video sessions found
          </div>
        )}
      </div>
    </div>
  );
} 