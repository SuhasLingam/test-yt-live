import { NextResponse } from "next/server";
import { google } from "googleapis";
import { z } from "zod";
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Define request body schema
const requestSchema = z.object({
  videoId: z.string(),
});

// Define error type for YouTube API errors
interface YouTubeAPIError extends Error {
  message: string;
  code?: number;
  errors?: Array<{ message: string; domain: string; reason: string }>;
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const { videoId } = requestSchema.parse(body);
    console.log("Received video ID:", videoId);

    // Fetch video details
    const response = await youtube.videos.list({
      id: [videoId],
      part: ["snippet", "liveStreamingDetails"],
    });

    console.log("YouTube API response:", response.data);

    const video = response.data.items?.[0];
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.snippet?.liveBroadcastContent !== "live") {
      return NextResponse.json(
        { error: "Video is not currently live" },
        { status: 400 },
      );
    }

    const liveChatId = video.liveStreamingDetails?.activeLiveChatId;
    console.log("Extracted live chat ID:", liveChatId);

    if (!liveChatId) {
      return NextResponse.json(
        { error: "Live chat is not available for this video" },
        { status: 404 },
      );
    }

    return NextResponse.json({ liveChatId });
  } catch (error) {
    console.error("YouTube API error:", error);
    const youtubeError = error as YouTubeAPIError;
    return NextResponse.json(
      {
        error: "YouTube API error",
        details: youtubeError.message,
        code: youtubeError.code,
        errors: youtubeError.errors,
      },
      { status: 500 },
    );
  }
}
