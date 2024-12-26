import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export const youtubeRouter = createTRPCRouter({
  getLiveChatId: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("Getting live chat ID for video:", input.videoId);
      
      const response = await youtube.videos.list({
        id: [input.videoId],
        part: ["snippet", "liveStreamingDetails"],
      });

      const video = response.data.items?.[0];
      if (!video) {
        throw new Error("Video not found");
      }

      if (video.snippet?.liveBroadcastContent !== "live") {
        throw new Error("Video is not currently live");
      }

      const liveChatId = video.liveStreamingDetails?.activeLiveChatId;
      if (!liveChatId) {
        throw new Error("Live chat is not available for this video");
      }

      console.log("Found live chat ID:", liveChatId, "for video:", input.videoId);

      return { 
        videoId: input.videoId,
        liveChatId 
      };
    }),
});
