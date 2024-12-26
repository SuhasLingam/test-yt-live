import { google } from "googleapis";
import { db } from "@/server/db";
import { pollResponses, pollState, sessions, polls, leaderboard } from "@/server/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Points for first 3 correct answers
const POINTS_MAPPING = [
  5,  // First correct answer
  3,  // Second correct answer
  1   // Third correct answer
] as const;

// Track correct responders to avoid duplicate points
const correctRespondersSet = new Set<string>();
let correctRespondersCount = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const liveChatId = searchParams.get("liveChatId");

  if (!liveChatId) {
    return new Response("Live chat ID is required", { status: 400 });
  }

  // Get session ID for the live chat
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.liveChatId, liveChatId))
    .limit(1);

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  // Get the latest poll for this session to get the correct option
  const [currentPoll] = await db
    .select()
    .from(polls)
    .where(eq(polls.sessionId, session.youtubeVideoId))
    .orderBy(desc(polls.startedAt))
    .limit(1);

  if (!currentPoll) {
    return new Response("Poll not found", { status: 404 });
  }

  const correctOption = currentPoll.correctOption;
  if (!correctOption) {
    return new Response("Correct option not set", { status: 400 });
  }

  // Reset trackers for new poll
  correctRespondersSet.clear();
  correctRespondersCount = 0;

  // Initialize poll state if not exists
  try {
    const [existingState] = await db
      .select()
      .from(pollState)
      .where(eq(pollState.sessionId, session.id))
      .limit(1);

    if (!existingState) {
      await db.insert(pollState).values({
        sessionId: session.id,
        liveChatId,
        chartData: {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
        },
        firstResponders: {
          A: [],
          B: [],
          C: [],
          D: [],
        },
        isFetching: true,
      });
    }
  } catch (error) {
    console.error("Error initializing poll state:", error);
  }

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      let nextPageToken: string | null = null;
      const startTime = new Date();
      let isControllerClosed = false;

      try {
        const fetchMessages = async () => {
          if (isControllerClosed) return;

          try {
            const response = await youtube.liveChatMessages.list({
              liveChatId,
              part: ["snippet", "authorDetails"],
              maxResults: 200,
              pageToken: nextPageToken ?? undefined,
            });

            const messages = response.data.items ?? [];
            nextPageToken = response.data.nextPageToken ?? null;

            for (const message of messages) {
              if (isControllerClosed) break;

              const publishedAt = message.snippet?.publishedAt;
              if (!publishedAt) continue;

              if (new Date(publishedAt) >= startTime) {
                const formattedMessage = {
                  author: message.authorDetails?.displayName ?? "",
                  authorImage: message.authorDetails?.profileImageUrl ?? "",
                  text: message.snippet?.displayMessage ?? "",
                  publishedAt,
                };

                // Process poll responses
                const text = formattedMessage.text.trim().toUpperCase();
                if (["A", "B", "C", "D"].includes(text)) {
                  try {
                    console.log("Processing response:", {
                      text,
                      author: formattedMessage.author,
                      correctOption,
                    });

                    // Check for existing response
                    const [existingResponse] = await db
                      .select()
                      .from(pollResponses)
                      .where(
                        sql`${pollResponses.userId} = ${message.authorDetails?.channelId ?? ""} 
                        AND ${pollResponses.pollId} = ${currentPoll.id}`
                      )
                      .limit(1);

                    if (existingResponse) {
                      // Update existing response
                      await db.update(pollResponses)
                        .set({ 
                          answer: text,
                          respondedAt: new Date()
                        })
                        .where(
                          sql`${pollResponses.userId} = ${message.authorDetails?.channelId ?? ""} 
                          AND ${pollResponses.pollId} = ${currentPoll.id}`
                        );
                    } else {
                      // Store new response
                      await db.insert(pollResponses).values({
                        userId: message.authorDetails?.channelId ?? "",
                        userName: formattedMessage.author,
                        userImage: formattedMessage.authorImage,
                        answer: text,
                        pollId: currentPoll.id
                      });
                    }

                    // Update poll state
                    const [currentState] = await db
                      .select()
                      .from(pollState)
                      .where(eq(pollState.sessionId, session.id))
                      .limit(1);

                    if (currentState) {
                      const updatedChartData = {
                        ...(currentState.chartData as Record<string, number>),
                        [text]:
                          ((currentState.chartData as Record<string, number>)[
                            text
                          ] ?? 0) + 1,
                      };

                      const updatedFirstResponders = {
                        ...(currentState.firstResponders as Record<
                          string,
                          string[]
                        >),
                        [text]: [
                          ...((currentState.firstResponders as Record<
                            string,
                            string[]
                          >)[text] ?? []),
                          formattedMessage.author,
                        ],
                      };

                      await db
                        .update(pollState)
                        .set({
                          chartData: updatedChartData,
                          firstResponders: updatedFirstResponders,
                          updatedAt: new Date(),
                        })
                        .where(eq(pollState.sessionId, session.id));

                      // Award points only if:
                      // 1. Answer matches correct option
                      // 2. User hasn't received points yet
                      // 3. We haven't awarded all points yet
                      const userId = message.authorDetails?.channelId;
                      if (
                        text === correctOption && 
                        userId && 
                        !correctRespondersSet.has(userId) && 
                        correctRespondersCount < POINTS_MAPPING.length
                      ) {
                        const points = POINTS_MAPPING[correctRespondersCount] as number;
                        correctRespondersSet.add(userId);
                        correctRespondersCount++;

                        // Update leaderboard with correct answer and bonus points
                        await db.transaction(async (tx) => {
                          const [existingEntry] = await tx
                            .select()
                            .from(leaderboard)
                            .where(
                              sql`${leaderboard.userId} = ${userId} 
                              AND ${leaderboard.videoId} = ${session.youtubeVideoId}
                              AND ${leaderboard.pollId} = ${currentPoll.id}`
                            )
                            .limit(1);

                          if (existingEntry) {
                            await tx
                              .update(leaderboard)
                              .set({
                                correctAnswers: existingEntry.correctAnswers + 1,
                                totalAnswers: existingEntry.totalAnswers + 1,
                                points: existingEntry.points + points, // Only bonus points
                                lastAnsweredAt: new Date(),
                                userName: formattedMessage.author,
                                userImage: formattedMessage.authorImage,
                              })
                              .where(
                                sql`${leaderboard.userId} = ${userId} 
                                AND ${leaderboard.videoId} = ${session.youtubeVideoId}
                                AND ${leaderboard.pollId} = ${currentPoll.id}`
                              );
                          } else {
                            await tx.insert(leaderboard).values({
                              userId,
                              userName: formattedMessage.author,
                              userImage: formattedMessage.authorImage,
                              videoId: session.youtubeVideoId,
                              pollId: currentPoll.id,
                              correctAnswers: 1,
                              totalAnswers: 1,
                              points: points, // Only bonus points
                              lastAnsweredAt: new Date(),
                            });
                          }

                          // Also insert into pollResponses table
                          await tx.insert(pollResponses).values({
                            userId,
                            userName: formattedMessage.author,
                            userImage: formattedMessage.authorImage,
                            answer: text,
                            respondedAt: new Date(),
                            pollId: currentPoll.id
                          });
                        });

                        console.log(`Awarded ${points} points to ${formattedMessage.author} for being #${correctRespondersCount} correct answer`);
                      } else if (userId && !correctRespondersSet.has(userId)) {
                        // Update total answers for incorrect responses
                        await db.transaction(async (tx) => {
                          const [existingEntry] = await tx
                            .select()
                            .from(leaderboard)
                            .where(
                              sql`${leaderboard.userId} = ${userId} 
                              AND ${leaderboard.videoId} = ${session.youtubeVideoId}
                              AND ${leaderboard.pollId} = ${currentPoll.id}`
                            )
                            .limit(1);

                          if (existingEntry) {
                            await tx
                              .update(leaderboard)
                              .set({
                                totalAnswers: existingEntry.totalAnswers + 1,
                                lastAnsweredAt: new Date(),
                                userName: formattedMessage.author,
                                userImage: formattedMessage.authorImage,
                              })
                              .where(
                                sql`${leaderboard.userId} = ${userId} 
                                AND ${leaderboard.videoId} = ${session.youtubeVideoId}
                                AND ${leaderboard.pollId} = ${currentPoll.id}`
                              );
                          } else {
                            await tx.insert(leaderboard).values({
                              userId,
                              userName: formattedMessage.author,
                              userImage: formattedMessage.authorImage,
                              videoId: session.youtubeVideoId,
                              pollId: currentPoll.id,
                              correctAnswers: 0,
                              totalAnswers: 1,
                              points: 0,
                              lastAnsweredAt: new Date(),
                            });
                          }

                          // Also insert into pollResponses table for incorrect answers
                          await tx.insert(pollResponses).values({
                            userId,
                            userName: formattedMessage.author,
                            userImage: formattedMessage.authorImage,
                            answer: text,
                            respondedAt: new Date(),
                            pollId: currentPoll.id
                          });
                        });
                      }
                    }
                  } catch (error) {
                    console.error("Error processing poll response:", error);
                  }
                }

                const encodedMessage = encoder.encode(
                  `data: ${JSON.stringify(formattedMessage)}\n\n`,
                );
                controller.enqueue(encodedMessage);
              }
            }
          } catch (error) {
            console.error("Error fetching messages:", error);
            if (!isControllerClosed) {
              isControllerClosed = true;
              controller.close();
            }
          }
        };

        // Initial fetch
        await fetchMessages();

        // Set up interval for subsequent fetches
        const interval = setInterval(() => {
          void fetchMessages();
        }, 5000);

        // Clean up on disconnect
        const abortHandler = (_: Event) => {
          clearInterval(interval);
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }
        };
        req.signal.addEventListener("abort", abortHandler);
      } catch (error) {
        console.error("Stream error:", error);
        if (!isControllerClosed) {
          isControllerClosed = true;
          controller.close();
        }
      }
    },
  });

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
