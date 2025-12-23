"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Lobby } from "@/components/game/Lobby";
import { DrawingCanvas } from "@/components/game/DrawingCanvas";
import { GuessingPanel } from "@/components/game/GuessingPanel";
import { VotingPanel } from "@/components/game/VotingPanel";
import { Results } from "@/components/game/Results";
import { bs } from "@/lib/i18n/bs";
import { Loader2 } from "lucide-react";

function getSessionId(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("drawit-session-id") || "";
}

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const code = (params.code as string).toUpperCase();
    const [sessionId, setSessionId] = useState("");

    useEffect(() => {
        setSessionId(getSessionId());
        if (!getSessionId()) {
            router.push("/");
        }
    }, [router]);

    const game = useQuery(api.games.getByCode, { code });
    const players = useQuery(
        api.players.getByGame,
        game ? { gameId: game._id } : "skip"
    );
    const currentPlayer = useQuery(
        api.players.getBySessionAndGame,
        game && sessionId ? { sessionId, gameId: game._id } : "skip"
    );
    const currentRound = useQuery(
        api.rounds.getCurrent,
        game ? { gameId: game._id } : "skip"
    );
    const guesses = useQuery(
        api.guesses.getByRound,
        currentRound ? { roundId: currentRound._id } : "skip"
    );

    const startGame = useMutation(api.games.start);
    const createRound = useMutation(api.rounds.create);
    const submitDrawing = useMutation(api.rounds.submitDrawing);
    const updateDrawingLive = useMutation(api.rounds.updateDrawingLive);
    const submitGuess = useMutation(api.guesses.submit);
    const vote = useMutation(api.guesses.vote);
    const updateRoundStatus = useMutation(api.rounds.updateStatus);
    const updateGamePhase = useMutation(api.games.updatePhase);
    const calculateScores = useMutation(api.guesses.calculateScores);
    const nextRound = useMutation(api.games.nextRound);
    const endGameMutation = useMutation(api.games.endGame);

    // Handler for ending the game (host only)
    const handleEndGame = async () => {
        if (!game) return;
        try {
            await endGameMutation({ gameId: game._id, sessionId });
        } catch (error) {
            console.error("Error ending game:", error);
        }
    };

    // Loading state
    if (game === undefined || !sessionId) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </main>
        );
    }

    // Game not found
    if (game === null) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
                <div className="text-center text-white">
                    <h1 className="text-2xl font-bold mb-4">{bs.errors.gameNotFound}</h1>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-white text-violet-600 rounded-lg font-semibold"
                    >
                        {bs.results.backToHome}
                    </button>
                </div>
            </main>
        );
    }

    // Use game.hostId as primary host check (more reliable than player.isHost)
    const isHost = game.hostId === sessionId;
    const isDrawer = currentRound?.drawerId === currentPlayer?._id;

    const handleStartGame = async () => {
        try {
            // Round is now created automatically in the start mutation
            await startGame({ gameId: game._id, sessionId });
        } catch (error) {
            console.error("Error starting game:", error);
        }
    };

    const handleSubmitDrawing = async (drawingData: string) => {
        if (!currentRound) return;
        await submitDrawing({ roundId: currentRound._id, drawing: drawingData });
        await updateGamePhase({ gameId: game._id, phase: "guessing" });
    };

    // Throttled live update - only update every 500ms
    const lastUpdateRef = { current: 0 };
    const handleLiveUpdate = async (drawingData: string) => {
        if (!currentRound) return;
        const now = Date.now();
        if (now - lastUpdateRef.current < 500) return;
        lastUpdateRef.current = now;
        await updateDrawingLive({ roundId: currentRound._id, drawing: drawingData });
    };

    const handleSubmitGuess = async (text: string) => {
        if (!currentRound || !currentPlayer) return;
        await submitGuess({
            roundId: currentRound._id,
            playerId: currentPlayer._id,
            text,
        });
    };

    const handleVote = async (guessId: string) => {
        if (!currentPlayer) return;
        await vote({ guessId: guessId as any, playerId: currentPlayer._id });
    };

    const handleShowResults = async () => {
        if (!currentRound) return;
        await calculateScores({ roundId: currentRound._id });
        await updateRoundStatus({ roundId: currentRound._id, status: "results" });
        await updateGamePhase({ gameId: game._id, phase: "results" });
    };

    const handleNextRound = async () => {
        if (!players) return;
        const result = await nextRound({ gameId: game._id });
        if (!result.finished) {
            // Determine next drawer (round-robin)
            const nextDrawerIndex = (game.currentRound) % players.length;
            await createRound({
                gameId: game._id,
                roundNumber: result.round!,
                drawerId: players[nextDrawerIndex]._id,
            });
            await updateGamePhase({ gameId: game._id, phase: "drawing" });
        }
    };

    const handlePlayAgain = () => {
        router.push("/");
    };

    // Render based on game status
    if (game.status === "lobby") {
        return (
            <Lobby
                game={game}
                players={players || []}
                currentPlayer={currentPlayer}
                isHost={isHost}
                onStartGame={handleStartGame}
                onEndGame={handleEndGame}
            />
        );
    }

    if (game.status === "finished") {
        return (
            <Results
                game={game}
                players={players || []}
                currentPlayer={currentPlayer}
                round={currentRound}
                guesses={guesses || []}
                isGameOver={true}
                onNextRound={handlePlayAgain}
            />
        );
    }

    // Playing state - render based on phase
    if (game.currentPhase === "drawing") {
        return (
            <DrawingCanvas
                game={game}
                currentRound={currentRound}
                currentPlayer={currentPlayer}
                isDrawer={isDrawer}
                isHost={isHost}
                onSubmitDrawing={handleSubmitDrawing}
                onLiveUpdate={handleLiveUpdate}
                onEndGame={handleEndGame}
            />
        );
    }

    if (game.currentPhase === "guessing") {
        return (
            <GuessingPanel
                game={game}
                currentRound={currentRound}
                currentPlayer={currentPlayer}
                guesses={guesses || []}
                players={players || []}
                isDrawer={isDrawer}
                onSubmitGuess={handleSubmitGuess}
                onStartVoting={async () => {
                    await updateRoundStatus({
                        roundId: currentRound!._id,
                        status: "voting",
                    });
                    await updateGamePhase({ gameId: game._id, phase: "voting" });
                }}
                isHost={isHost}
                onEndGame={handleEndGame}
            />
        );
    }

    if (game.currentPhase === "voting") {
        return (
            <VotingPanel
                game={game}
                currentRound={currentRound}
                currentPlayer={currentPlayer}
                guesses={guesses || []}
                players={players || []}
                isDrawer={isDrawer}
                onVote={handleVote}
                onShowResults={handleShowResults}
                isHost={isHost}
                onEndGame={handleEndGame}
            />
        );
    }

    if (game.currentPhase === "results") {
        return (
            <Results
                game={game}
                players={players || []}
                currentPlayer={currentPlayer}
                round={currentRound}
                guesses={guesses || []}
                isGameOver={false}
                onNextRound={handleNextRound}
                onEndGame={handleEndGame}
            />
        );
    }

    return null;
}
