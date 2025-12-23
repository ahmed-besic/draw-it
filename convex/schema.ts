import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
  })
    .index("by_game", ["gameId"])
    .index("by_session", ["sessionId"]),

  rounds: defineTable({
    gameId: v.id("games"),
    roundNumber: v.number(),
    drawerId: v.id("players"),
    prompt: v.string(),
    drawing: v.optional(v.string()), // Base64 canvas data
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
    isCorrectAnswer: v.boolean(), // True if this is the actual prompt
    votes: v.array(v.id("players")),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_player", ["roundId", "playerId"]),
});
