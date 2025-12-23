import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
    args: {
        roundId: v.id("rounds"),
        playerId: v.id("players"),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if already submitted
        const existing = await ctx.db
            .query("guesses")
            .withIndex("by_round_and_player", (q) =>
                q.eq("roundId", args.roundId).eq("playerId", args.playerId)
            )
            .first();

        if (existing) {
            throw new Error("Već si poslao/la odgovor");
        }

        await ctx.db.insert("guesses", {
            roundId: args.roundId,
            playerId: args.playerId,
            text: args.text,
            isCorrectAnswer: false,
            votes: [],
        });
    },
});

export const getByRound = query({
    args: { roundId: v.id("rounds") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("guesses")
            .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
            .collect();
    },
});

export const vote = mutation({
    args: {
        guessId: v.id("guesses"),
        playerId: v.id("players"),
    },
    handler: async (ctx, args) => {
        const guess = await ctx.db.get(args.guessId);
        if (!guess) throw new Error("Odgovor nije pronađen");

        // Can't vote for your own guess
        if (guess.playerId === args.playerId) {
            throw new Error("Ne možeš glasati za svoj odgovor");
        }

        // Check if already voted on this round
        const roundGuesses = await ctx.db
            .query("guesses")
            .withIndex("by_round", (q) => q.eq("roundId", guess.roundId))
            .collect();

        for (const g of roundGuesses) {
            if (g.votes.includes(args.playerId)) {
                throw new Error("Već si glasao/la");
            }
        }

        await ctx.db.patch(args.guessId, {
            votes: [...guess.votes, args.playerId],
        });
    },
});

export const calculateScores = mutation({
    args: { roundId: v.id("rounds") },
    handler: async (ctx, args) => {
        const guesses = await ctx.db
            .query("guesses")
            .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
            .collect();

        const round = await ctx.db.get(args.roundId);
        if (!round) throw new Error("Runda nije pronađena");

        const scoreUpdates: { playerId: string; points: number; reason: string }[] = [];

        for (const guess of guesses) {
            if (guess.isCorrectAnswer) {
                // Points for players who voted correctly
                for (const voterId of guess.votes) {
                    scoreUpdates.push({
                        playerId: voterId,
                        points: 1000,
                        reason: "correct_guess",
                    });
                }
                // Bonus for drawer if someone got it right
                if (guess.votes.length > 0) {
                    scoreUpdates.push({
                        playerId: round.drawerId,
                        points: 500 * guess.votes.length,
                        reason: "good_drawing",
                    });
                }
            } else {
                // Points for fooling others with fake answers
                for (const _voterId of guess.votes) {
                    scoreUpdates.push({
                        playerId: guess.playerId,
                        points: 500,
                        reason: "fooled_player",
                    });
                }
            }
        }

        // Apply score updates
        for (const update of scoreUpdates) {
            const player = await ctx.db.get(update.playerId as any);
            if (player) {
                await ctx.db.patch(update.playerId as any, {
                    score: player.score + update.points,
                });
            }
        }

        return scoreUpdates;
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
