import { api } from "@/utils/api";
import { usePollContext } from "@/contexts/PollContext";

type LeaderboardUser = {
  userId: string;
  userName: string;
  userImage: string | null;
  correctAnswers: number;
  totalAnswers: number;
  points: number;
};

export function Leaderboard() {
  const { videoId } = usePollContext();
  const { data: leaderboardData } = api.leaderboard.getTopUsers.useQuery(
    { 
      limit: 5,
      videoId: videoId ?? undefined
    },
    { 
      refetchInterval: 5000,
      enabled: !!videoId
    }
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Leaderboard</h2>
      </div>
      <div className="space-y-4">
        {leaderboardData?.map((user: LeaderboardUser, index: number) => (
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
                {/* <p className="text-xs text-gray-500">
                  {user.correctAnswers} correct / {user.totalAnswers} total
                </p> */}
              </div>
            </div>
            <div className="text-sm font-medium">{user.points} pts</div>
          </div>
        ))}
        {!leaderboardData?.length && (
          <div className="text-center text-gray-500 py-4">
            No participants yet
          </div>
        )}
      </div>
    </div>
  );
} 