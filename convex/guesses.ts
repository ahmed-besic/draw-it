import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByRound = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guesses")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
  },
});

export const getPlayerGuess = query({
  args: {
    roundId: v.id("rounds"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guesses")
      .withIndex("by_round_and_player", (q) =>
        q.eq("roundId", args.roundId).eq("playerId", args.playerId)
      )
      .first();
  },
});
