import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Bosnian drawing prompts
const PROMPTS = [
    "Kafa sa šlagom",
    "Planina Bjelašnica",
    "Sarajevska ruža",
    "Ćevapi u somunu",
    "Stari most Mostar",
    "Baščaršija",
    "Sebilj",
    "Bosanski lonac",
    "Tradicionalna nošnja",
    "Begova džamija",
    "Burek sa sirom",
    "Fildžan kafe",
    "Treska planina",
    "Una rijeka",
    "Bosanska kuća",
    "Sevdalinka",
    "Rakija",
    "Bosanski ćilim",
    "Avlija",
    "Zimska olimpijada",
    "Tulumbe",
    "Hurmasice",
    "Baklava",
    "Zeljanica",
    "Tufahije",
    "Šljivovica",
    "Bosanski konak",
    "Džezva",
    "Sahan",
    "Sinija",
];

function getRandomPrompt(): string {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export const create = mutation({
    args: {
        gameId: v.id("games"),
        roundNumber: v.number(),
        drawerId: v.id("players"),
    },
    handler: async (ctx, args) => {
        const prompt = getRandomPrompt();

        const roundId = await ctx.db.insert("rounds", {
            gameId: args.gameId,
            roundNumber: args.roundNumber,
            drawerId: args.drawerId,
            prompt,
            status: "drawing",
            startedAt: Date.now(),
        });

        // Create the correct answer as a guess
        await ctx.db.insert("guesses", {
            roundId,
            playerId: args.drawerId,
            text: prompt,
            isCorrectAnswer: true,
            votes: [],
        });

        return { roundId, prompt };
    },
});

export const getCurrent = query({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return null;

        return await ctx.db
            .query("rounds")
            .withIndex("by_game_and_round", (q) =>
                q.eq("gameId", args.gameId).eq("roundNumber", game.currentRound)
            )
            .first();
    },
});

export const submitDrawing = mutation({
    args: {
        roundId: v.id("rounds"),
        drawing: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roundId, {
            drawing: args.drawing,
            status: "guessing",
        });
    },
});

export const updateDrawingLive = mutation({
    args: {
        roundId: v.id("rounds"),
        drawing: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roundId, {
            drawing: args.drawing,
        });
    },
});

export const updateStatus = mutation({
    args: {
        roundId: v.id("rounds"),
        status: v.union(
            v.literal("drawing"),
            v.literal("guessing"),
            v.literal("voting"),
            v.literal("results"),
            v.literal("complete")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roundId, { status: args.status });
    },
});

export const getByGame = query({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("rounds")
            .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
            .collect();
    },
});
