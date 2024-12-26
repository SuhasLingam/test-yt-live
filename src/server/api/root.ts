import { createTRPCRouter } from "@/server/api/trpc";
import { pollRouter } from "./routers/poll";
import { leaderboardRouter } from "./routers/leaderboard";
import { youtubeRouter } from "./routers/youtube";
import { chatRouter } from "./routers/chat";

export const appRouter = createTRPCRouter({
  poll: pollRouter,
  leaderboard: leaderboardRouter,
  youtube: youtubeRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
