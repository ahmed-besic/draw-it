"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Lobby } from "@/components/game/Lobby";
import { DrawingCanvas } from "@/components/game/DrawingCanvas";
import { GuessingPanel } from "@/components/game/GuessingPanel";
import { VotingPanel } from "@/components/game/VotingPanel";
import { Results } from "@/components/game/Results";
import { bs } from "@/lib/i18n/bs";
import { Loader2 } from "lucide-react";
import { Stroke } from "@/lib/types";

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("drawit-session-id");
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [sessionId] = useState<string | null>(() => getSessionId());
  const [error, setError] = useState("");
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!sessionId) router.push("/");
  }, [router, sessionId]);

  const game = useQuery(api.games.getByCode, { code });
  const players = useQuery(api.players.getByGame, game ? { gameId: game._id } : "skip");
  const currentPlayer = useQuery(
    api.players.getBySessionAndGame,
    game && sessionId ? { sessionId, gameId: game._id } : "skip"
  );
  const currentRound = useQuery(api.rounds.getCurrent, game ? { gameId: game._id } : "skip");
  const guesses = useQuery(
    api.guesses.getByRound,
    currentRound ? { roundId: currentRound._id } : "skip"
  );

  const startGame = useMutation(api.games.startGame);
  const heartbeat = useMutation(api.games.heartbeat);
  const submitDrawing = useMutation(api.games.submitDrawing);
  const submitGuess = useMutation(api.games.submitGuess);
  const startVoting = useMutation(api.games.startVoting);
  const vote = useMutation(api.games.vote);
  const showResults = useMutation(api.games.showResults);
  const advanceRound = useMutation(api.games.advanceRound);
  const leaveGame = useMutation(api.games.leaveGame);
  const endGameMutation = useMutation(api.games.endGame);

  useEffect(() => {
    if (!game || !sessionId || game.status === "finished") return;

    const sendHeartbeat = () => {
      void heartbeat({ gameId: game._id, sessionId });
    };

    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 5_000);
    const handleVisible = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };

    window.addEventListener("focus", sendHeartbeat);
    window.addEventListener("pageshow", sendHeartbeat);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sendHeartbeat);
      window.removeEventListener("pageshow", sendHeartbeat);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [game, heartbeat, sessionId]);

  if (game === undefined || !sessionId) {
    return (
      <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--ink)] animate-spin" />
      </main>
    );
  }

  if (game === null) {
    return (
      <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
        <div className="sketch-card max-w-sm text-center">
          <h1 className="text-2xl font-black mb-4 text-[var(--ink)]">{bs.errors.gameNotFound}</h1>
          <button onClick={() => router.push("/")} className="sketch-button w-full">
            {bs.results.backToHome}
          </button>
        </div>
      </main>
    );
  }

  const isHost = game.hostId === sessionId;
  const isDrawer = currentRound?.drawerId === currentPlayer?._id;

  const handleError = (unknownError: unknown) => {
    setError(unknownError instanceof Error ? unknownError.message : "Nešto je pošlo po zlu");
  };

  const handleStartGame = async () => {
    try {
      setError("");
      await startGame({ gameId: game._id, sessionId });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleSubmitDrawing = async (strokes: Stroke[]) => {
    try {
      setError("");
      await submitDrawing({ gameId: game._id, sessionId, strokes, finish: true });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleLiveUpdate = async (strokes: Stroke[]) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 500) return;
    lastUpdateRef.current = now;

    try {
      await submitDrawing({ gameId: game._id, sessionId, strokes, finish: false });
    } catch {
      // Live updates are best-effort; final submit reports errors.
    }
  };

  const handleSubmitGuess = async (text: string) => {
    try {
      setError("");
      await submitGuess({ gameId: game._id, sessionId, text });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleVote = async (guessId: string) => {
    try {
      setError("");
      await vote({ gameId: game._id, sessionId, guessId: guessId as Id<"guesses"> });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleStartVoting = async () => {
    try {
      setError("");
      await startVoting({ gameId: game._id, sessionId });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleShowResults = async () => {
    try {
      setError("");
      await showResults({ gameId: game._id, sessionId });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleNextRound = async () => {
    try {
      setError("");
      await advanceRound({ gameId: game._id, sessionId });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleEndGame = async () => {
    try {
      await endGameMutation({ gameId: game._id, sessionId });
    } catch (unknownError) {
      handleError(unknownError);
    }
  };

  const handleLeaveGame = async () => {
    try {
      await leaveGame({ gameId: game._id, sessionId });
    } finally {
      router.push("/");
    }
  };

  const sharedProps = {
    game,
    currentRound,
    currentPlayer,
    isHost,
    error,
    onEndGame: handleEndGame,
    onLeaveGame: handleLeaveGame,
  };

  if (game.status === "lobby") {
    return (
      <Lobby
        game={game}
        players={players || []}
        currentPlayer={currentPlayer}
        isHost={isHost}
        error={error}
        onStartGame={handleStartGame}
        onEndGame={handleEndGame}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  if (game.status === "finished") {
    return (
      <Results
        {...sharedProps}
        players={players || []}
        round={currentRound}
        guesses={guesses || []}
        isGameOver={true}
        onNextRound={() => router.push("/")}
      />
    );
  }

  if (!currentPlayer) {
    return (
      <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
        <div className="sketch-card max-w-sm text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Nisi u ovoj igri</h1>
          <p className="mt-2 text-[var(--muted-ink)]">Vrati se na početnu i pridruži se kodom {game.code}.</p>
          <button onClick={() => router.push("/")} className="sketch-button mt-5 w-full">
            {bs.results.backToHome}
          </button>
        </div>
      </main>
    );
  }

  if (game.currentPhase === "drawing") {
    return (
      <DrawingCanvas
        key={currentRound?._id}
        {...sharedProps}
        players={players || []}
        isDrawer={isDrawer}
        onSubmitDrawing={handleSubmitDrawing}
        onLiveUpdate={handleLiveUpdate}
      />
    );
  }

  if (game.currentPhase === "guessing") {
    return (
      <GuessingPanel
        {...sharedProps}
        guesses={guesses || []}
        players={players || []}
        isDrawer={isDrawer}
        onSubmitGuess={handleSubmitGuess}
        onStartVoting={handleStartVoting}
      />
    );
  }

  if (game.currentPhase === "voting") {
    return (
      <VotingPanel
        {...sharedProps}
        guesses={guesses || []}
        players={players || []}
        isDrawer={isDrawer}
        onVote={handleVote}
        onShowResults={handleShowResults}
      />
    );
  }

  if (game.currentPhase === "results") {
    return (
      <Results
        {...sharedProps}
        players={players || []}
        round={currentRound}
        guesses={guesses || []}
        isGameOver={false}
        onNextRound={handleNextRound}
      />
    );
  }

  return null;
}
