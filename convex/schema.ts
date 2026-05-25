import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const point = v.object({
  x: v.number(),
  y: v.number(),
});

const stroke = v.object({
  id: v.string(),
  color: v.string(),
  size: v.number(),
  points: v.array(point),
});

export default defineSchema({
  games: defineTable({
    code: v.string(),
    hostId: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("finished")
    ),
    currentRound: v.number(),
    maxRounds: v.number(),
    currentPhase: v.union(
      v.literal("drawing"),
      v.literal("guessing"),
      v.literal("voting"),
      v.literal("results")
    ),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    score: v.number(),
    isHost: v.boolean(),
    sessionId: v.string(),
    isConnected: v.boolean(),
    lastSeenAt: v.optional(v.number()),
    leftAt: v.optional(v.number()),
  })
    .index("by_game", ["gameId"])
    .index("by_session", ["sessionId"]),

  rounds: defineTable({
    gameId: v.id("games"),
    roundNumber: v.number(),
    drawerId: v.id("players"),
    prompt: v.string(),
    drawing: v.optional(v.string()), // Legacy base64 drawing kept for migration compatibility.
    strokes: v.optional(v.array(stroke)),
    strokeVersion: v.optional(v.number()),
    answerOrder: v.optional(v.array(v.id("guesses"))),
    phaseStartedAt: v.optional(v.number()),
    phaseEndsAt: v.optional(v.number()),
    scoredAt: v.optional(v.number()),
    status: v.union(
      v.literal("drawing"),
      v.literal("guessing"),
      v.literal("voting"),
      v.literal("results"),
      v.literal("complete")
    ),
    startedAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_and_round", ["gameId", "roundNumber"]),

  guesses: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    text: v.string(),
    isCorrectAnswer: v.boolean(),
    votes: v.array(v.id("players")),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_player", ["roundId", "playerId"]),
});
