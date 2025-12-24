import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a random 5-character alphanumeric code
function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars: I, O, 0, 1
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export const create = mutation({
    args: {
        hostName: v.string(),
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        // Generate unique code
        let code = generateCode();
        let existing = await ctx.db
            .query("games")
            .withIndex("by_code", (q) => q.eq("code", code))
            .first();

        while (existing) {
            code = generateCode();
            existing = await ctx.db
                .query("games")
                .withIndex("by_code", (q) => q.eq("code", code))
                .first();
        }

        // Create game
        const gameId = await ctx.db.insert("games", {
            code,
            hostId: args.sessionId,
            status: "lobby",
            currentRound: 0,
            maxRounds: 3,
            currentPhase: "drawing",
            createdAt: Date.now(),
        });

        // Create host player
        await ctx.db.insert("players", {
            gameId,
            name: args.hostName,
            score: 0,
            isHost: true,
            sessionId: args.sessionId,
            isConnected: true,
        });

        return { code, gameId };
    },
});

export const join = mutation({
    args: {
        code: v.string(),
        playerName: v.string(),
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const game = await ctx.db
            .query("games")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!game) {
            throw new Error("Igra nije pronađena");
        }

        if (game.status !== "lobby") {
            throw new Error("Igra je već u toku");
        }

        // Check if player already exists (reconnecting)
        const existingPlayer = await ctx.db
            .query("players")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (existingPlayer && existingPlayer.gameId === game._id) {
            // Update connection status
            await ctx.db.patch(existingPlayer._id, { isConnected: true });
            return { gameId: game._id, playerId: existingPlayer._id };
        }

        // Create new player
        const playerId = await ctx.db.insert("players", {
            gameId: game._id,
            name: args.playerName,
            score: 0,
            isHost: false,
            sessionId: args.sessionId,
            isConnected: true,
        });

        return { gameId: game._id, playerId };
    },
});

export const getByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("games")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();
    },
});

export const get = query({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.gameId);
    },
});

export const start = mutation({
    args: {
        gameId: v.id("games"),
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) throw new Error("Igra nije pronađena");
        if (game.hostId !== args.sessionId) throw new Error("Samo domaćin može pokrenuti igru");

        const players = await ctx.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
            .collect();

        if (players.length < 2) {
            throw new Error("Potrebna su najmanje 2 igrača");
        }

        // Update game status
        await ctx.db.patch(args.gameId, {
            status: "playing",
            currentRound: 1,
            currentPhase: "drawing",
        });

        // Create the first round with the first player as drawer
        const firstDrawer = players[0];

        // Get random prompt
        const PROMPTS = [
            "Kafa sa šlagom", "Bjelašnica", "Baščaršija",
            "Ćevapi u somunu", "Stari most Mostar", "Janje na ražnju",
            "Sebilj", "Kengur", "Tradicionalna nošnja",
            "Begova džamija", "Sirnica", "Fildžan",
            "Treska planina", "Una rijeka", "Bosanska kuća",
            "Sevdalinka", "Rakija", "Bosanski ćilim",
            "Avlija", "Zimska olimpijada", "Tulumbe",
            "Hurmasice", "Baklava", "Željeznica",
            "Tufahije",
            "Džezva", "Vijećnica",
            "Uštipci", "Kozji most",
            "Vrelo Bosne", "Šadrvan",
            "Sarma", "Punjena paprika", "Grah",
            "Krempita", "Oklagija", "Vrelo Bune",
            "Bobovac", "Vodopad",
            "Sutjeska"
        ];
        const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

        const roundId = await ctx.db.insert("rounds", {
            gameId: args.gameId,
            roundNumber: 1,
            drawerId: firstDrawer._id,
            prompt,
            status: "drawing",
            startedAt: Date.now(),
        });

        // Create the correct answer as a guess
        await ctx.db.insert("guesses", {
            roundId,
            playerId: firstDrawer._id,
            text: prompt,
            isCorrectAnswer: true,
            votes: [],
        });

        return { success: true, roundId, drawerId: firstDrawer._id };
    },
});

export const updatePhase = mutation({
    args: {
        gameId: v.id("games"),
        phase: v.union(
            v.literal("drawing"),
            v.literal("guessing"),
            v.literal("voting"),
            v.literal("results")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, { currentPhase: args.phase });
    },
});

export const nextRound = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) throw new Error("Igra nije pronađena");

        if (game.currentRound >= game.maxRounds) {
            await ctx.db.patch(args.gameId, { status: "finished" });
            return { finished: true };
        }

        await ctx.db.patch(args.gameId, {
            currentRound: game.currentRound + 1,
            currentPhase: "drawing",
        });

        return { finished: false, round: game.currentRound + 1 };
    },
});

export const endGame = mutation({
    args: {
        gameId: v.id("games"),
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) throw new Error("Igra nije pronađena");

        // Only host can end the game
        if (game.hostId !== args.sessionId) {
            throw new Error("Samo domaćin može završiti igru");
        }

        await ctx.db.patch(args.gameId, { status: "finished" });
        return { success: true };
    },
});
