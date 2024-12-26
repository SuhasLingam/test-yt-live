import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { pollState, polls, sessions } from "@/server/db/schema";
import { eq , desc } from "drizzle-orm";

export const pollRouter = createTRPCRouter({
  getState: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const [state] = await db
        .select()
        .from(pollState)
        .where(eq(pollState.sessionId, input.sessionId))
        .limit(1);

      if (!state) {
        throw new Error("Poll state not found");
      }

      return state;
    }),

  updateState: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        liveChatId: z.string(),
        chartData: z.record(z.string(), z.number()),
        firstResponders: z.record(z.string(), z.array(z.string())),
        selectedOption: z.string().nullable(),
        isFetching: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const [existingState] = await db
        .select()
        .from(pollState)
        .where(eq(pollState.sessionId, input.sessionId))
        .limit(1);

      if (existingState) {
        await db
          .update(pollState)
          .set({
            chartData: input.chartData,
            firstResponders: input.firstResponders,
            selectedOption: input.selectedOption,
            isFetching: input.isFetching,
            updatedAt: new Date(),
          })
          .where(eq(pollState.sessionId, input.sessionId));
      } else {
        await db.insert(pollState).values({
          sessionId: input.sessionId,
          liveChatId: input.liveChatId,
          chartData: input.chartData,
          firstResponders: input.firstResponders,
          selectedOption: input.selectedOption,
          isFetching: input.isFetching,
        });
      }

      return { success: true };
    }),

  updateCorrectOption: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        correctOption: z.enum(["A", "B", "C", "D"]),
      })
    )
    .mutation(async ({ input }) => {
      // First get the session to get the video ID
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session) {
        throw new Error("Session not found");
      }

      // Get the latest poll for this video ID
      const [poll] = await db
        .select()
        .from(polls)
        .where(eq(polls.sessionId, session.youtubeVideoId))
        .orderBy(desc(polls.startedAt))
        .limit(1);

      if (!poll) {
        throw new Error("Poll not found");
      }

      // Update the correct option
      await db
        .update(polls)
        .set({ correctOption: input.correctOption })
        .where(eq(polls.id, poll.id));

      return { success: true };
    }),
});
