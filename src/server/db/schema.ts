import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  timestamp,
  varchar,
  serial,
  json,
  text,
  unique,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `yt-next-live_${name}`);

// Main session table
export const sessions = createTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    youtubeVideoId: varchar("youtube_video_id", { length: 256 }).notNull().unique(),
    liveChatId: varchar("live_chat_id", { length: 256 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => ({
    videoIdIndex: index("video_id_idx").on(table.youtubeVideoId),
    chatIdIndex: index("chat_id_idx").on(table.liveChatId),
  }),
);
// Individual polls within a session
export const polls = createTable(
  "polls",
  {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 256 })
      .notNull()
      .references(() => sessions.youtubeVideoId),
    startedAt: timestamp("started_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    duration: integer("duration").notNull(),
    videoStartTimestamp: integer("video_start_timestamp").notNull(),
    videoEndTimestamp: integer("video_end_timestamp"),
    correctOption: varchar("correct_option", { length: 1 }),
  },
  (table) => ({
    sessionIndex: index("poll_session_idx").on(table.sessionId),
  }),
);

// Poll responses from users
export const pollResponses = createTable(
  "poll_responses",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    userName: varchar("user_name", { length: 256 }).notNull(),
    userImage: text("user_image"),
    answer: varchar("answer", { length: 1 }).notNull(), // A, B, C, or D
    respondedAt: timestamp("responded_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id),
  },
  (table) => ({
    pollUserIndex: index("poll_user_idx").on(table.userId),
    uniqueResponse: unique("unique_response").on(table.userId, table.pollId),
  }),
);

// Poll state table to store all context data
export const pollState = createTable(
  "poll_state",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id),
    liveChatId: varchar("live_chat_id", { length: 256 }).notNull(),
    chartData: json("chart_data").notNull().default({
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    }),
    firstResponders: json("first_responders").notNull().default({
      A: [],
      B: [],
      C: [],
      D: [],
    }),
    selectedOption: varchar("selected_option", { length: 1 }),
    isFetching: boolean("is_fetching").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("poll_state_session_idx").on(table.sessionId),
    chatIdIdx: index("poll_state_chat_id_idx").on(table.liveChatId),
  }),
);

// Leaderboard table to track user scores
export const leaderboard = createTable(
  "leaderboard",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    userName: varchar("user_name", { length: 256 }).notNull(),
    userImage: text("user_image"),
    videoId: varchar("video_id", { length: 256 })
      .notNull()
      .references(() => sessions.youtubeVideoId),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id),
    correctAnswers: integer("correct_answers").notNull().default(0),
    totalAnswers: integer("total_answers").notNull().default(0),
    points: integer("points").notNull().default(0),
    lastAnsweredAt: timestamp("last_answered_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("leaderboard_user_id_idx").on(table.userId),
    videoIdIdx: index("leaderboard_video_id_idx").on(table.videoId),
    pollIdIdx: index("leaderboard_poll_id_idx").on(table.pollId),
    uniqueUserPoll: unique("unique_user_poll").on(table.userId, table.pollId),
  }),
);
