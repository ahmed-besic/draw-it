"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameHeader } from "@/components/game/GameHeader";
import { bs } from "@/lib/i18n/bs";
import { Check, Vote, Users } from "lucide-react";
import { Game, Round, Player, Guess } from "@/lib/types";

interface VotingPanelProps {
    game: Game;
    currentRound: Round | null | undefined;
    currentPlayer: Player | null | undefined;
    guesses: Guess[];
    players: Player[];
    isDrawer: boolean;
    onVote: (guessId: string) => void;
    onShowResults: () => void;
    isHost: boolean;
    onEndGame?: () => void;
}

export function VotingPanel({
    game,
    currentRound,
    currentPlayer,
    guesses,
    players,
    isDrawer,
    onVote,
    onShowResults,
    isHost,
    onEndGame,
}: VotingPanelProps) {
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedGuess, setSelectedGuess] = useState<string | null>(
        null
    );

    // Shuffle guesses but keep it stable
    const shuffledGuesses = useMemo(() => {
        return [...guesses].sort(() => Math.random() - 0.5);
    }, [guesses.length]);

    // Check if player already voted
    const playerHasVoted =
        guesses.some((g) => g.votes.includes(currentPlayer?._id as string)) ||
        hasVoted;

    // Count total votes
    const totalVotes = guesses.reduce((sum, g) => sum + g.votes.length, 0);
    const eligibleVoters = players.length - 1; // Everyone except drawer
    const allVoted = totalVotes >= eligibleVoters;

    const handleVote = async (guessId: string) => {
        if (playerHasVoted || isDrawer) return;

        // Check if it's their own guess
        const guess = guesses.find((g) => g._id === guessId);
        if (guess?.playerId === currentPlayer?._id) {
            return;
        }

        setSelectedGuess(guessId);
        setHasVoted(true);
        await onVote(guessId);
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
                            {bs.voting.pickAnswer}
                        </p>
                    </CardContent>
                </Card>

                {/* Drawing Display */}
                <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                    {currentRound?.drawing && (
                        <img
                            src={currentRound.drawing}
                            alt="Drawing"
                            className="w-full aspect-square object-contain bg-white"
                        />
                    )}
                </Card>

                {/* Voting Options */}
                {isDrawer ? (
                    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                        <CardContent className="py-6 text-center">
                            <p className="text-gray-600">{bs.voting.waiting}</p>
                            <p className="text-sm text-gray-400 mt-2">
                                {bs.drawing.prompt} {currentRound?.prompt}
                            </p>
                        </CardContent>
                    </Card>
                ) : playerHasVoted ? (
                    <Card className="bg-green-50 border-green-200 shadow-lg">
                        <CardContent className="py-6 text-center">
                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="text-green-700 font-semibold">{bs.voting.youVoted}</p>
                            <p className="text-sm text-gray-500 mt-2">{bs.voting.waiting}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        <p className="text-center text-white/80 text-sm mb-2">
                            {bs.voting.selectOne}
                        </p>
                        {shuffledGuesses.map((guess) => {
                            const isOwnGuess = guess.playerId === currentPlayer?._id;
                            return (
                                <button
                                    key={guess._id}
                                    onClick={() => handleVote(guess._id)}
                                    disabled={isOwnGuess}
                                    className={`w-full p-4 rounded-lg text-left transition-all ${selectedGuess === guess._id
                                        ? "bg-violet-600 text-white shadow-lg scale-[1.02]"
                                        : isOwnGuess
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-white hover:bg-violet-50 hover:shadow-md"
                                        }`}
                                >
                                    <span className="text-lg font-medium">{guess.text}</span>
                                    {isOwnGuess && (
                                        <span className="ml-2 text-sm">(tvoj odgovor)</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Progress / Host Controls */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Vote className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-600">Glasovi:</span>
                            </div>
                            <Badge variant={allVoted ? "default" : "secondary"}>
                                {totalVotes} / {eligibleVoters}
                            </Badge>
                        </div>
                        {isHost && (
                            <Button
                                size="lg"
                                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500"
                                onClick={onShowResults}
                                disabled={totalVotes < 1}
                            >
                                Prikaži rezultate
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
