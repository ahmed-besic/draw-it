import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { INACTIVE_AFTER_MS, MAX_ROUNDS, MIN_PLAYERS, PHASE_DURATIONS, PROMPTS } from "./constants";
import { strokeValidator } from "./validators";

type Player = Doc<"players">;
type Round = Doc<"rounds">;
type Stroke = NonNullable<Round["strokes"]>[number];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function randomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

function phaseEndsAt(phase: "drawing" | "guessing" | "voting", now: number) {
  return now + PHASE_DURATIONS[phase];
}

function isActive(player: Player, now: number) {
  return !player.leftAt && (player.lastSeenAt ?? player._creationTime) >= now - INACTIVE_AFTER_MS;
}

async function getPlayers(ctx: QueryCtx | MutationCtx, gameId: Id<"games">) {
  return await ctx.db
    .query("players")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();
}

async function getPlayerBySession(ctx: QueryCtx | MutationCtx, gameId: Id<"games">, sessionId: string) {
  const players = await getPlayers(ctx, gameId);
  return players.find((player) => player.sessionId === sessionId) ?? null;
}

async function requirePlayer(ctx: MutationCtx, gameId: Id<"games">, sessionId: string) {
  const player = await getPlayerBySession(ctx, gameId, sessionId);
  if (!player || player.leftAt) throw new Error("Nisi u ovoj igri");
  await ctx.db.patch(player._id, { isConnected: true, lastSeenAt: Date.now() });
  return player;
}

function requireHost(game: Doc<"games">, sessionId: string) {
  if (game.hostId !== sessionId) throw new Error("Samo domaćin može uraditi ovu radnju");
}

async function getCurrentRound(ctx: QueryCtx | MutationCtx, game: Doc<"games">) {
  if (game.currentRound < 1) return null;
  return await ctx.db
    .query("rounds")
    .withIndex("by_game_and_round", (q) =>
      q.eq("gameId", game._id).eq("roundNumber", game.currentRound)
    )
    .first();
}

function shuffleIds(ids: Id<"guesses">[]) {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function syncHost(ctx: MutationCtx, game: Doc<"games">, players: Player[], now: number) {
  const currentHost = players.find((player) => player.sessionId === game.hostId);
  if (currentHost && isActive(currentHost, now)) return game;

  const nextHost = players
    .filter((player) => isActive(player, now))
    .sort((a, b) => a._creationTime - b._creationTime)[0];

  if (!nextHost) {
    await ctx.db.patch(game._id, { status: "finished" });
    return { ...game, status: "finished" as const };
  }

  await Promise.all(
    players.map((player) =>
      ctx.db.patch(player._id, { isHost: player._id === nextHost._id })
    )
  );
  await ctx.db.patch(game._id, { hostId: nextHost.sessionId });
  return { ...game, hostId: nextHost.sessionId };
}

async function createRound(ctx: MutationCtx, gameId: Id<"games">, roundNumber: number, drawerId: Id<"players">, now: number) {
  const prompt = randomPrompt();
  const roundId = await ctx.db.insert("rounds", {
    gameId,
    roundNumber,
    drawerId,
    prompt,
    status: "drawing",
    strokes: [],
    strokeVersion: 0,
    answerOrder: [],
    phaseStartedAt: now,
    phaseEndsAt: phaseEndsAt("drawing", now),
    startedAt: now,
  });

  await ctx.db.insert("guesses", {
    roundId,
    playerId: drawerId,
    text: prompt,
    isCorrectAnswer: true,
    votes: [],
  });

  return roundId;
}

async function startVotingInternal(ctx: MutationCtx, game: Doc<"games">, round: Round, now: number) {
  if (game.currentPhase !== "guessing" || round.status !== "guessing") return;

  const guesses = await ctx.db
    .query("guesses")
    .withIndex("by_round", (q) => q.eq("roundId", round._id))
    .collect();

  await ctx.db.patch(round._id, {
    status: "voting",
    answerOrder: shuffleIds(guesses.map((guess) => guess._id)),
    phaseStartedAt: now,
    phaseEndsAt: phaseEndsAt("voting", now),
  });
  await ctx.db.patch(game._id, { currentPhase: "voting" });
}

async function scoreRoundInternal(ctx: MutationCtx, game: Doc<"games">, round: Round, now: number) {
  if (round.scoredAt) return;

  const guesses = await ctx.db
    .query("guesses")
    .withIndex("by_round", (q) => q.eq("roundId", round._id))
    .collect();

  const pointsByPlayer = new Map<Id<"players">, number>();
  const addPoints = (playerId: Id<"players">, points: number) => {
    pointsByPlayer.set(playerId, (pointsByPlayer.get(playerId) ?? 0) + points);
  };

  for (const guess of guesses) {
    if (guess.isCorrectAnswer) {
      for (const voterId of guess.votes) addPoints(voterId, 1000);
      if (guess.votes.length > 0) addPoints(round.drawerId, 500 * guess.votes.length);
      continue;
    }

    addPoints(guess.playerId, 500 * guess.votes.length);
  }

  for (const [playerId, points] of pointsByPlayer) {
    const player = await ctx.db.get(playerId);
    if (player) await ctx.db.patch(playerId, { score: player.score + points });
  }

  await ctx.db.patch(round._id, {
    status: "results",
    scoredAt: now,
    phaseStartedAt: now,
    phaseEndsAt: now,
  });
  await ctx.db.patch(game._id, { currentPhase: "results" });
}

async function maybeAdvanceAfterGuess(ctx: MutationCtx, game: Doc<"games">, round: Round, now: number) {
  const players = await getPlayers(ctx, game._id);
  const activeNonDrawers = players.filter(
    (player) => player._id !== round.drawerId && isActive(player, now)
  );
  const guesses = await ctx.db
    .query("guesses")
    .withIndex("by_round", (q) => q.eq("roundId", round._id))
    .collect();
  const submitted = new Set(
    guesses.filter((guess) => !guess.isCorrectAnswer).map((guess) => guess.playerId)
  );

  if (activeNonDrawers.every((player) => submitted.has(player._id))) {
    await startVotingInternal(ctx, game, round, now);
  }
}

async function maybeAdvanceAfterVote(ctx: MutationCtx, game: Doc<"games">, round: Round, now: number) {
  const players = await getPlayers(ctx, game._id);
  const activeVoters = players.filter(
    (player) => player._id !== round.drawerId && isActive(player, now)
  );
  const guesses = await ctx.db
    .query("guesses")
    .withIndex("by_round", (q) => q.eq("roundId", round._id))
    .collect();
  const voters = new Set(guesses.flatMap((guess) => guess.votes));

  if (activeVoters.every((player) => voters.has(player._id))) {
    await scoreRoundInternal(ctx, game, round, now);
  }
}

async function advanceExpiredInternal(ctx: MutationCtx, game: Doc<"games">, round: Round | null, now: number) {
  if (!round || !round.phaseEndsAt || round.phaseEndsAt > now || game.status !== "playing") return;

  if (game.currentPhase === "drawing" && round.status === "drawing") {
    await ctx.db.patch(round._id, {
      status: "guessing",
      phaseStartedAt: now,
      phaseEndsAt: phaseEndsAt("guessing", now),
    });
    await ctx.db.patch(game._id, { currentPhase: "guessing" });
    return;
  }

  if (game.currentPhase === "guessing" && round.status === "guessing") {
    await startVotingInternal(ctx, game, round, now);
    return;
  }

  if (game.currentPhase === "voting" && round.status === "voting") {
    await scoreRoundInternal(ctx, game, round, now);
  }
}

export const create = mutation({
  args: {
    hostName: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
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

    const gameId = await ctx.db.insert("games", {
      code,
      hostId: args.sessionId,
      status: "lobby",
      currentRound: 0,
      maxRounds: MAX_ROUNDS,
      currentPhase: "drawing",
      createdAt: now,
    });

    await ctx.db.insert("players", {
      gameId,
      name: args.hostName.trim().slice(0, 20),
      score: 0,
      isHost: true,
      sessionId: args.sessionId,
      isConnected: true,
      lastSeenAt: now,
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
    const now = Date.now();
    const game = await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!game) throw new Error("Igra nije pronađena");
    if (game.status !== "lobby") throw new Error("Igra je već u toku");

    const existingPlayer = await getPlayerBySession(ctx, game._id, args.sessionId);
    if (existingPlayer) {
      await ctx.db.patch(existingPlayer._id, {
        name: args.playerName.trim().slice(0, 20),
        isConnected: true,
        lastSeenAt: now,
        leftAt: undefined,
      });
      return { gameId: game._id, playerId: existingPlayer._id };
    }

    const playerId = await ctx.db.insert("players", {
      gameId: game._id,
      name: args.playerName.trim().slice(0, 20),
      score: 0,
      isHost: false,
      sessionId: args.sessionId,
      isConnected: true,
      lastSeenAt: now,
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

export const startGame = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    requireHost(game, args.sessionId);
    if (game.status !== "lobby") throw new Error("Igra je već pokrenuta");

    const players = await getPlayers(ctx, args.gameId);
    const activePlayers = players.filter((player) => isActive(player, now));
    if (activePlayers.length < MIN_PLAYERS) throw new Error("Potrebna su najmanje 2 aktivna igrača");

    const firstDrawer = activePlayers.sort((a, b) => a._creationTime - b._creationTime)[0];
    await ctx.db.patch(args.gameId, {
      status: "playing",
      currentRound: 1,
      currentPhase: "drawing",
    });
    const roundId = await createRound(ctx, args.gameId, 1, firstDrawer._id, now);

    return { success: true, roundId, drawerId: firstDrawer._id };
  },
});

export const start = startGame;

export const heartbeat = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false };
    const player = await getPlayerBySession(ctx, args.gameId, args.sessionId);
    if (player && !player.leftAt) {
      await ctx.db.patch(player._id, { isConnected: true, lastSeenAt: now });
    }
    const players = await getPlayers(ctx, args.gameId);
    const syncedGame = await syncHost(ctx, game, players, now);
    const round = await getCurrentRound(ctx, syncedGame);
    await advanceExpiredInternal(ctx, syncedGame, round, now);
    return { success: true };
  },
});

export const submitDrawing = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    strokes: v.array(strokeValidator),
    finish: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    const player = await requirePlayer(ctx, args.gameId, args.sessionId);
    const round = await getCurrentRound(ctx, game);
    if (!round) throw new Error("Runda nije pronađena");
    if (game.currentPhase !== "drawing" || round.status !== "drawing") throw new Error("Crtanje nije aktivno");
    if (round.drawerId !== player._id) throw new Error("Samo crtač može slati crtež");

    await ctx.db.patch(round._id, {
      strokes: args.strokes as Stroke[],
      strokeVersion: (round.strokeVersion ?? 0) + 1,
    });

    if (args.finish) {
      const players = await getPlayers(ctx, game._id);
      const activeGuessers = players.filter(
        (candidate) => candidate._id !== round.drawerId && isActive(candidate, now)
      );

      if (activeGuessers.length === 0) {
        await scoreRoundInternal(ctx, game, round, now);
      } else {
        await ctx.db.patch(round._id, {
          status: "guessing",
          phaseStartedAt: now,
          phaseEndsAt: phaseEndsAt("guessing", now),
        });
        await ctx.db.patch(game._id, { currentPhase: "guessing" });
      }
    }

    return { success: true };
  },
});

export const submitGuess = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    const player = await requirePlayer(ctx, args.gameId, args.sessionId);
    const round = await getCurrentRound(ctx, game);
    if (!round) throw new Error("Runda nije pronađena");
    if (game.currentPhase !== "guessing" || round.status !== "guessing") throw new Error("Pogađanje nije aktivno");
    if (round.drawerId === player._id) throw new Error("Crtač ne šalje lažni odgovor");

    const cleanText = args.text.trim().slice(0, 60);
    if (!cleanText) throw new Error("Odgovor ne može biti prazan");

    const existing = await ctx.db
      .query("guesses")
      .withIndex("by_round_and_player", (q) => q.eq("roundId", round._id).eq("playerId", player._id))
      .first();
    if (existing) throw new Error("Već si poslao/la odgovor");

    await ctx.db.insert("guesses", {
      roundId: round._id,
      playerId: player._id,
      text: cleanText,
      isCorrectAnswer: false,
      votes: [],
    });

    await maybeAdvanceAfterGuess(ctx, game, round, now);
    return { success: true };
  },
});

export const startVoting = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    requireHost(game, args.sessionId);
    const round = await getCurrentRound(ctx, game);
    if (!round) throw new Error("Runda nije pronađena");
    await startVotingInternal(ctx, game, round, now);
    return { success: true };
  },
});

export const vote = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    guessId: v.id("guesses"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    const player = await requirePlayer(ctx, args.gameId, args.sessionId);
    const round = await getCurrentRound(ctx, game);
    if (!round) throw new Error("Runda nije pronađena");
    if (game.currentPhase !== "voting" || round.status !== "voting") throw new Error("Glasanje nije aktivno");
    if (round.drawerId === player._id) throw new Error("Crtač ne glasa");

    const guess = await ctx.db.get(args.guessId);
    if (!guess || guess.roundId !== round._id) throw new Error("Odgovor nije pronađen");
    if (guess.playerId === player._id) throw new Error("Ne možeš glasati za svoj odgovor");

    const roundGuesses = await ctx.db
      .query("guesses")
      .withIndex("by_round", (q) => q.eq("roundId", round._id))
      .collect();
    if (roundGuesses.some((roundGuess) => roundGuess.votes.includes(player._id))) {
      throw new Error("Već si glasao/la");
    }

    await ctx.db.patch(args.guessId, { votes: [...guess.votes, player._id] });
    await maybeAdvanceAfterVote(ctx, game, round, now);
    return { success: true };
  },
});

export const showResults = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    requireHost(game, args.sessionId);
    const round = await getCurrentRound(ctx, game);
    if (!round) throw new Error("Runda nije pronađena");
    if (game.currentPhase !== "voting" && game.currentPhase !== "results") {
      throw new Error("Rezultati još nisu spremni");
    }
    await scoreRoundInternal(ctx, game, round, now);
    return { success: true };
  },
});

export const advanceRound = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Igra nije pronađena");
    requireHost(game, args.sessionId);
    if (game.status === "finished") return { finished: true };
    if (game.currentPhase !== "results") throw new Error("Prvo prikaži rezultate runde");

    if (game.currentRound >= game.maxRounds) {
      await ctx.db.patch(args.gameId, { status: "finished" });
      return { finished: true };
    }

    const players = await getPlayers(ctx, args.gameId);
    const activePlayers = players.filter((player) => isActive(player, now));
    if (activePlayers.length < MIN_PLAYERS) {
      await ctx.db.patch(args.gameId, { status: "finished" });
      return { finished: true };
    }

    const orderedPlayers = activePlayers.sort((a, b) => a._creationTime - b._creationTime);
    const nextDrawerIndex = game.currentRound % orderedPlayers.length;
    const nextRoundNumber = game.currentRound + 1;
    await ctx.db.patch(args.gameId, {
      currentRound: nextRoundNumber,
      currentPhase: "drawing",
    });
    await createRound(ctx, args.gameId, nextRoundNumber, orderedPlayers[nextDrawerIndex]._id, now);
    return { finished: false, round: nextRoundNumber };
  },
});

export const advanceExpiredPhase = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false };
    const round = await getCurrentRound(ctx, game);
    await advanceExpiredInternal(ctx, game, round, now);
    return { success: true };
  },
});

export const leaveGame = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false };
    const player = await getPlayerBySession(ctx, args.gameId, args.sessionId);
    if (player) {
      await ctx.db.patch(player._id, { isConnected: false, leftAt: now, lastSeenAt: now });
    }
    const players = await getPlayers(ctx, args.gameId);
    await syncHost(ctx, game, players, now);
    return { success: true };
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
    requireHost(game, args.sessionId);
    await ctx.db.patch(args.gameId, { status: "finished" });
    return { success: true };
  },
});
