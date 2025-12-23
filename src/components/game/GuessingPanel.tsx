"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GameHeader } from "@/components/game/GameHeader";
import { bs } from "@/lib/i18n/bs";
import { Send, Check, Users } from "lucide-react";
import { Game, Round, Player, Guess } from "@/lib/types";

interface GuessingPanelProps {
    game: Game;
    currentRound: Round | null | undefined;
    currentPlayer: Player | null | undefined;
    guesses: Guess[];
    players: Player[];
    isDrawer: boolean;
    onSubmitGuess: (text: string) => void;
    onStartVoting: () => void;
    isHost: boolean;
    onEndGame?: () => void;
}

export function GuessingPanel({
    game,
    currentRound,
    currentPlayer,
    guesses,
    players,
    isDrawer,
    onSubmitGuess,
    onStartVoting,
    isHost,
    onEndGame,
}: GuessingPanelProps) {
    const [guess, setGuess] = useState("");
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const playerGuess = guesses.find(
        (g) => g.playerId === currentPlayer?._id && !g.isCorrectAnswer
    );
    const hasPlayerSubmitted = !!playerGuess || hasSubmitted;

    // Count how many players have submitted (excluding drawer and correct answer)
    const submittedCount = guesses.filter((g) => !g.isCorrectAnswer).length;
    const totalNonDrawers = players.length - 1;
    const allSubmitted = submittedCount >= totalNonDrawers;

    const handleSubmit = async () => {
        if (guess.trim().length < 1) return;
        setHasSubmitted(true);
        await onSubmitGuess(guess.trim());
        setGuess("");
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 pt-16">
            <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} />
            <div className="w-full max-w-md mx-auto space-y-4">
                {/* Header */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="py-3 text-center">
                        <p className="text-sm text-gray-500">
                            {bs.common.round} {game.currentRound} {bs.common.of}{" "}
                            {game.maxRounds}
                        </p>
                        <p className="text-lg font-semibold text-gray-800">
                            {bs.guessing.whatIsIt}
                        </p>
                    </CardContent>
                </Card>

                {/* Drawing Display */}
                <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                    {currentRound?.drawing ? (
                        <img
                            src={currentRound.drawing}
                            alt="Drawing to guess"
                            className="w-full aspect-square object-contain bg-white"
                        />
                    ) : (
                        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                            <p className="text-gray-400">{bs.drawing.waiting}</p>
                        </div>
                    )}
                </Card>

                {/* Guess Input - Only for non-drawers who haven't submitted */}
                {isDrawer ? (
                    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                        <CardContent className="py-6 text-center">
                            <p className="text-gray-600">{bs.guessing.cantGuessOwn}</p>
                            <p className="text-sm text-gray-400 mt-2">
                                {bs.drawing.prompt} {currentRound?.prompt}
                            </p>
                        </CardContent>
                    </Card>
                ) : hasPlayerSubmitted ? (
                    <Card className="bg-green-50 border-green-200 shadow-lg">
                        <CardContent className="py-6 text-center">
                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="text-green-700 font-semibold">
                                {bs.guessing.submitted}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                {bs.guessing.waiting}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                        <CardContent className="py-4 space-y-3">
                            <Input
                                placeholder={bs.guessing.enterGuess}
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                className="text-lg h-12"
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                            <Button
                                size="lg"
                                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600"
                                onClick={handleSubmit}
                                disabled={guess.trim().length < 1}
                            >
                                <Send className="w-5 h-5 mr-2" />
                                {bs.guessing.submitGuess}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Progress / Host Controls */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-600">Odgovori:</span>
                            </div>
                            <Badge variant={allSubmitted ? "default" : "secondary"}>
                                {submittedCount} / {totalNonDrawers}
                            </Badge>
                        </div>
                        {isHost && (
                            <Button
                                size="lg"
                                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500"
                                onClick={onStartVoting}
                                disabled={submittedCount < 1}
                            >
                                Počni glasanje
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
