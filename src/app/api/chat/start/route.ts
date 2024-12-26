import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sessions, polls } from "@/server/db/schema";
import { z } from "zod";

// Define the request body schema
const requestSchema = z.object({
  videoId: z.string(),
  liveChatId: z.string(),
  duration: z.number(),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const { videoId, liveChatId, duration } = requestSchema.parse(body);
    
    console.log("Received video ID:", videoId);
    console.log("Received live chat ID:", liveChatId);

    // Create session first
    const [session] = await db
      .insert(sessions)
      .values({
        youtubeVideoId: videoId,
        liveChatId,
        startedAt: new Date(),
      })
      .returning();

    if (!session) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    console.log("Created session ID:", session.id);

    // Then create poll
    await db.insert(polls).values({
      sessionId: session.youtubeVideoId,
      duration,
      startedAt: new Date(),
      videoStartTimestamp: 0,
      videoEndTimestamp: duration,
      correctOption: null,
    });

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error("Error starting chat:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to start chat" },
      { status: 500 },
    );
  }
}
