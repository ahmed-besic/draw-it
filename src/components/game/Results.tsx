"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameHeader } from "@/components/game/GameHeader";
import { bs } from "@/lib/i18n/bs";
import { Trophy, Star, ArrowRight, Home, Crown } from "lucide-react";
import { Game, Round, Player, Guess } from "@/lib/types";

interface ResultsProps {
    game: Game;
    players: Player[];
    currentPlayer: Player | null | undefined;
    round: Round | null | undefined;
    guesses: Guess[];
    isGameOver: boolean;
    onNextRound: () => void;
    onEndGame?: () => void;
}

export function Results({
    game,
    players,
    currentPlayer,
    round,
    guesses,
    isGameOver,
    onNextRound,
    onEndGame,
}: ResultsProps) {
    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const isHost = currentPlayer?.isHost || false;

    // Find correct answer
    const correctAnswer = guesses.find((g) => g.isCorrectAnswer);

    // Get player name by ID
    const getPlayerName = (playerId: string) => {
        const player = players.find((p) => p._id === playerId);
        return player?.name || "Nepoznat";
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 pt-16">
            <GameHeader gameCode={game.code} isHost={isHost} showEndGame={!isGameOver} onEndGame={onEndGame} />
            <div className="w-full max-w-md mx-auto space-y-4">
                {/* Header */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="py-4 text-center">
                        {isGameOver ? (
                            <>
                                <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-2" />
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {bs.results.gameOver}
                                </h1>
                            </>
                        ) : (
                            <>
                                <Star className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                                <h1 className="text-xl font-bold text-gray-800">
                                    {bs.results.roundResults}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {bs.common.round} {game.currentRound} {bs.common.of}{" "}
                                    {game.maxRounds}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Correct Answer (only for round results) */}
                {!isGameOver && round && (
                    <Card className="bg-green-50 border-green-200 shadow-lg">
                        <CardContent className="py-4 text-center">
                            <p className="text-sm text-green-600 mb-1">
                                {bs.results.correctAnswer}
                            </p>
                            <p className="text-2xl font-bold text-green-700">{round.prompt}</p>
                            {correctAnswer && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {correctAnswer.votes.length > 0
                                        ? `${correctAnswer.votes.length} igrač(a) pogodilo!`
                                        : bs.results.noOneGuessed}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Winner Announcement (game over) */}
                {isGameOver && winner && (
                    <Card className="bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg border-0">
                        <CardContent className="py-6 text-center">
                            <Crown className="w-12 h-12 text-white mx-auto mb-2" />
                            <p className="text-white/80 text-sm">{bs.results.winner}</p>
                            <p className="text-3xl font-bold text-white">{winner.name}</p>
                            <p className="text-white/80 text-lg mt-1">
                                {winner.score} {bs.results.points}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Scoreboard */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-center">
                            {isGameOver ? bs.results.finalScores : bs.common.score}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {sortedPlayers.map((player, index) => (
                                <li
                                    key={player._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${player._id === currentPlayer?._id
                                        ? "bg-violet-100"
                                        : "bg-gray-50"
                                        }`}
                                >
                                    <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0
                                            ? "bg-amber-400 text-white"
                                            : index === 1
                                                ? "bg-gray-400 text-white"
                                                : index === 2
                                                    ? "bg-amber-600 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                            }`}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className="font-medium flex-1">{player.name}</span>
                                    {player._id === currentPlayer?._id && (
                                        <span className="text-sm text-gray-500">{bs.lobby.you}</span>
                                    )}
                                    <Badge
                                        variant={index === 0 ? "default" : "secondary"}
                                        className="ml-auto"
                                    >
                                        {player.score} {bs.results.points}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Guess Breakdown (round results only) */}
                {!isGameOver && guesses.length > 0 && (
                    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-center text-lg">Svi odgovori</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {guesses.map((guess) => (
                                    <li
                                        key={guess._id}
                                        className={`p-3 rounded-lg ${guess.isCorrectAnswer
                                            ? "bg-green-100 border border-green-300"
                                            : "bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`font-medium ${guess.isCorrectAnswer ? "text-green-700" : ""
                                                    }`}
                                            >
                                                {guess.text}
                                            </span>
                                            <Badge variant="outline">
                                                {guess.votes.length} glas(a)
                                            </Badge>
                                        </div>
                                        {!guess.isCorrectAnswer && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                od: {getPlayerName(guess.playerId)}
                                            </p>
                                        )}
                                        {guess.isCorrectAnswer && (
                                            <p className="text-sm text-green-600 mt-1">
                                                ✓ Tačan odgovor
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Next Button */}
                {isHost && (
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-purple-600"
                        onClick={onNextRound}
                    >
                        {isGameOver ? (
                            <>
                                <Home className="w-5 h-5 mr-2" />
                                {bs.results.playAgain}
                            </>
                        ) : (
                            <>
                                <ArrowRight className="w-5 h-5 mr-2" />
                                {bs.results.nextRound}
                            </>
                        )}
                    </Button>
                )}

                {!isHost && (
                    <Card className="bg-white/20 backdrop-blur-sm border-0">
                        <CardContent className="py-4 text-center text-white">
                            <p>
                                {isGameOver
                                    ? "Čeka se domaćin..."
                                    : "Čeka se domaćin za sljedeću rundu..."}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
