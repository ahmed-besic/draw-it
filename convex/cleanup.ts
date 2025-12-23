import { mutation, query } from "./_generated/server";

// Get games older than specified hours
export const getOldGames = query({
    args: {},
    handler: async (ctx) => {
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000); // 4 hours in ms

        const games = await ctx.db
            .query("games")
            .collect();

        return games.filter(game => game.createdAt < fourHoursAgo);
    },
});

// Delete old games and their related data (players, rounds, guesses)
export const deleteOldGames = mutation({
    args: {},
    handler: async (ctx) => {
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000); // 4 hours in ms

        // Get all old games
        const games = await ctx.db
            .query("games")
            .collect();

        const oldGames = games.filter(game => game.createdAt < fourHoursAgo);

        let deletedCount = 0;

        for (const game of oldGames) {
            // Delete all players for this game
            const players = await ctx.db
                .query("players")
                .withIndex("by_game", (q) => q.eq("gameId", game._id))
                .collect();

            for (const player of players) {
                await ctx.db.delete(player._id);
            }

            // Delete all rounds for this game
            const rounds = await ctx.db
                .query("rounds")
                .withIndex("by_game", (q) => q.eq("gameId", game._id))
                .collect();

            for (const round of rounds) {
                // Delete all guesses for this round
                const guesses = await ctx.db
                    .query("guesses")
                    .withIndex("by_round", (q) => q.eq("roundId", round._id))
                    .collect();

                for (const guess of guesses) {
                    await ctx.db.delete(guess._id);
                }

                await ctx.db.delete(round._id);
            }

            // Delete the game
            await ctx.db.delete(game._id);
            deletedCount++;
        }

        return {
            deletedGames: deletedCount,
            timestamp: new Date().toISOString(),
        };
    },
});
