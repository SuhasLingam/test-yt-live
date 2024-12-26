import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { pollState } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define the request body schema
const requestSchema = z.object({
  sessionId: z.number(),
  liveChatId: z.string(),
  chartData: z.record(z.string(), z.number()),
  firstResponders: z.record(z.string(), z.array(z.string())),
  selectedOption: z.string().nullable(),
  isFetching: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const validatedData = requestSchema.parse(body);

    // First try to find existing state
    const [existingState] = await db
      .select()
      .from(pollState)
      .where(eq(pollState.sessionId, validatedData.sessionId))
      .limit(1);

    if (existingState) {
      // Update existing state
      await db
        .update(pollState)
        .set({
          chartData: validatedData.chartData,
          firstResponders: validatedData.firstResponders,
          selectedOption: validatedData.selectedOption,
          isFetching: validatedData.isFetching,
          updatedAt: new Date(),
        })
        .where(eq(pollState.sessionId, validatedData.sessionId));
    } else {
      // Insert new state
      await db.insert(pollState).values({
        sessionId: validatedData.sessionId,
        liveChatId: validatedData.liveChatId,
        chartData: validatedData.chartData,
        firstResponders: validatedData.firstResponders,
        selectedOption: validatedData.selectedOption,
        isFetching: validatedData.isFetching,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating poll state:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update poll state" },
      { status: 500 },
    );
  }
}

// Add GET endpoint to retrieve poll state
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400 },
      );
    }

    const parsedSessionId = parseInt(sessionId);
    if (isNaN(parsedSessionId)) {
      return NextResponse.json(
        { error: "Invalid sessionId parameter" },
        { status: 400 },
      );
    }

    const [state] = await db
      .select()
      .from(pollState)
      .where(eq(pollState.sessionId, parsedSessionId))
      .limit(1);

    if (!state) {
      return NextResponse.json(
        { error: "Poll state not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("Error retrieving poll state:", error);
    return NextResponse.json(
      { error: "Failed to retrieve poll state" },
      { status: 500 },
    );
  }
}
