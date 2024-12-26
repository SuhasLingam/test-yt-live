import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { desc, eq, sql } from "drizzle-orm";
import { leaderboard, sessions, polls, pollResponses } from "@/server/db/schema";
import { db } from "@/server/db";

export const leaderboardRouter = createTRPCRouter({
  updateLeaderboard: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        userName: z.string(),
        userImage: z.string().optional(),
        videoId: z.string(),
        pollId: z.number(),
        isCorrect: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // First, try to find existing entry for this user, video, and poll
      const existingEntry = await db
        .select()
        .from(leaderboard)
        .where(
          sql`${leaderboard.userId} = ${input.userId} 
          AND ${leaderboard.videoId} = ${input.videoId} 
          AND ${leaderboard.pollId} = ${input.pollId}`
        )
        .limit(1);

      if (existingEntry.length === 0) {
        // Create new entry if doesn't exist
        await db.insert(leaderboard).values({
          userId: input.userId,
          userName: input.userName,
          userImage: input.userImage ?? null,
          videoId: input.videoId,
          pollId: input.pollId,
          correctAnswers: input.isCorrect ? 1 : 0,
          totalAnswers: 1,
          points: input.isCorrect ? 10 : 0, // Award 10 points for correct answer
        });
      }
    }),

  getTopUsers: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        videoId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.videoId) {
        return [];
      }

      try {
        // First check if session exists
        const session = await db
          .select()
          .from(sessions)
          .where(eq(sessions.youtubeVideoId, input.videoId))
          .limit(1);

        console.log("Session check result:", session);

        if (!session.length) {
          console.error("No session found for videoId:", input.videoId);
          throw new Error("No session found for this video ID");
        }

        const users = await db
          .select({
            userId: leaderboard.userId,
            userName: leaderboard.userName,
            userImage: leaderboard.userImage,
            correctAnswers: sql<number>`sum(${leaderboard.correctAnswers})::integer`,
            totalAnswers: sql<number>`sum(${leaderboard.totalAnswers})::integer`,
            points: sql<number>`sum(${leaderboard.points})::integer`,
          })
          .from(leaderboard)
          .where(eq(leaderboard.videoId, input.videoId))
          .groupBy(leaderboard.userId, leaderboard.userName, leaderboard.userImage)
          .orderBy(desc(sql<number>`sum(${leaderboard.points})`))
          .limit(input.limit);

        console.log("Users query result:", users);
        return users;
      } catch (error) {
        console.error("Error in getTopUsers:", error);
        throw error;
      }
    }),

  getUserHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const history = await db
        .select({
          videoId: leaderboard.videoId,
          pollId: leaderboard.pollId,
          correctAnswers: sql<number>`sum(${leaderboard.correctAnswers})::integer`,
          totalAnswers: sql<number>`sum(${leaderboard.totalAnswers})::integer`,
          points: sql<number>`sum(${leaderboard.points})::integer`,
          lastAnsweredAt: sql<Date>`max(${leaderboard.lastAnsweredAt})`,
          pollStartedAt: polls.startedAt,
          pollEndedAt: polls.endedAt,
        })
        .from(leaderboard)
        .innerJoin(polls, eq(leaderboard.pollId, polls.id))
        .where(eq(leaderboard.userId, input.userId))
        .groupBy(leaderboard.videoId, leaderboard.pollId, polls.startedAt, polls.endedAt)
        .orderBy(desc(sql<Date>`max(${leaderboard.lastAnsweredAt})`))
        .limit(input.limit);

      return history;
    }),

  getVideoLeaderboards: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      // First, get unique video sessions with their first and last timestamps
      const videoSessions = await db
        .select({
          videoId: sessions.youtubeVideoId,
          startedAt: sql<Date>`min(${sessions.startedAt})`,
          endedAt: sql<Date>`max(${sessions.endedAt})`,
          totalPolls: sql<number>`count(distinct ${polls.id})::integer`,
          totalParticipants: sql<number>`count(distinct ${leaderboard.userId})::integer`,
          totalCorrectAnswers: sql<number>`sum(${leaderboard.correctAnswers})::integer`,
          totalAnswers: sql<number>`sum(${leaderboard.totalAnswers})::integer`,
          totalPoints: sql<number>`sum(${leaderboard.points})::integer`,
        })
        .from(sessions)
        .leftJoin(polls, eq(sessions.youtubeVideoId, polls.sessionId))
        .leftJoin(leaderboard, eq(sessions.youtubeVideoId, leaderboard.videoId))
        .groupBy(sessions.youtubeVideoId)
        .orderBy(desc(sql<Date>`min(${sessions.startedAt})`))
        .limit(input.limit);

      // For each video session, get the top 3 participants
      const sessionsWithTopParticipants = await Promise.all(
        videoSessions.map(async (session) => {
          const topParticipants = await db
            .select({
              userId: leaderboard.userId,
              userName: leaderboard.userName,
              userImage: leaderboard.userImage,
              points: sql<number>`sum(${leaderboard.points})::integer`,
              correctAnswers: sql<number>`sum(${leaderboard.correctAnswers})::integer`,
              totalAnswers: sql<number>`sum(${leaderboard.totalAnswers})::integer`,
            })
            .from(leaderboard)
            .where(eq(leaderboard.videoId, session.videoId))
            .groupBy(leaderboard.userId, leaderboard.userName, leaderboard.userImage)
            .orderBy(desc(sql<number>`sum(${leaderboard.points})`))
            .limit(3);

          return {
            ...session,
            topParticipants,
          };
        })
      );

      return sessionsWithTopParticipants;
    }),
}); 