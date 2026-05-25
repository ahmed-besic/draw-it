import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const getBySessionAndGame = query({
  args: {
    sessionId: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return players.find((player) => player.sessionId === args.sessionId) ?? null;
  },
});

export const getGamesBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const gameIds = [...new Set(players.map((player) => player.gameId))];
    const games = await Promise.all(gameIds.map((id) => ctx.db.get(id)));

    return games
      .filter((game): game is NonNullable<typeof game> => game !== null)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  },
});

export const disconnect = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (player) {
      await ctx.db.patch(player._id, {
        isConnected: false,
        lastSeenAt: Date.now(),
      });
    }
  },
});
