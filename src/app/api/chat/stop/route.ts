import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define the request body schema
const requestSchema = z.object({
  liveChatId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const validatedData = requestSchema.parse(body);

    // Update session end time
    await db
      .update(sessions)
      .set({
        endedAt: new Date(),
      })
      .where(eq(sessions.liveChatId, validatedData.liveChatId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error stopping chat:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to stop chat" }, { status: 500 });
  }
}
