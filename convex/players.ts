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
        // Find player with this session in this specific game
        const players = await ctx.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
            .collect();

        return players.find(p => p.sessionId === args.sessionId) || null;
    },
});

export const getGamesBySession = query({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        // Get all players for this session
        const players = await ctx.db
            .query("players")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        // Get unique game IDs and fetch games
        const gameIds = [...new Set(players.map(p => p.gameId))];
        const games = await Promise.all(
            gameIds.map(id => ctx.db.get(id))
        );

        // Filter out nulls and sort by createdAt descending
        return games
            .filter((g): g is NonNullable<typeof g> => g !== null)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 10); // Limit to 10 most recent
    },
});

export const updateScore = mutation({
    args: {
        playerId: v.id("players"),
        points: v.number(),
    },
    handler: async (ctx, args) => {
        const player = await ctx.db.get(args.playerId);
        if (!player) throw new Error("Igrač nije pronađen");

        await ctx.db.patch(args.playerId, {
            score: player.score + args.points,
        });
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
            await ctx.db.patch(player._id, { isConnected: false });
        }
    },
});

export const reconnect = mutation({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (player) {
            await ctx.db.patch(player._id, { isConnected: true });
            return player;
        }
        return null;
    },
});
