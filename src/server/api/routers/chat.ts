import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { sessions, polls } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

export const chatRouter = createTRPCRouter({
  start: publicProcedure
    .input(
      z.object({
        videoId: z.string(),
        liveChatId: z.string(),
        duration: z.number(),
        videoTimestamp: z.number(),
        correctOption: z.enum(["A", "B", "C", "D"]),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("Starting chat session with:", {
        videoId: input.videoId,
        liveChatId: input.liveChatId,
        correctOption: input.correctOption,
      });

      // Create session first
      const [session] = await db
        .insert(sessions)
        .values({
          youtubeVideoId: input.videoId,
          liveChatId: input.liveChatId,
          startedAt: new Date(),
        })
        .returning();

      if (!session) {
        throw new Error("Failed to create session");
      }

      console.log("Created session:", session);

      // Then create poll with video timestamp and correct option
      const [poll] = await db
        .insert(polls)
        .values({
          sessionId: session.youtubeVideoId,
          duration: input.duration,
          startedAt: new Date(),
          videoStartTimestamp: input.videoTimestamp,
          correctOption: input.correctOption,
        })
        .returning();

      console.log("Created poll with correct option:", poll);

      return { success: true, sessionId: session.id };
    }),

  stop: publicProcedure
    .input(
      z.object({
        liveChatId: z.string(),
        videoTimestamp: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      // First get the session
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.liveChatId, input.liveChatId))
        .limit(1);

      if (!session) {
        throw new Error("Session not found");
      }

      // Update the latest poll's end timestamp
      await db
        .update(polls)
        .set({
          endedAt: new Date(),
          videoEndTimestamp: input.videoTimestamp,
        })
        .where(
          sql`${polls.sessionId} = ${session.id} AND ${polls.endedAt} IS NULL`,
        );

      // Update session end time
      await db
        .update(sessions)
        .set({
          endedAt: new Date(),
        })
        .where(eq(sessions.liveChatId, input.liveChatId));

      return { success: true };
    }),
});
