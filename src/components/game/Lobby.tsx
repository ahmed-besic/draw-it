"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameHeader } from "@/components/game/GameHeader";
import { bs } from "@/lib/i18n/bs";
import { Crown, Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Doc } from "../../../../convex/_generated/dataModel";

interface LobbyProps {
    game: Doc<"games">;
    players: Doc<"players">[];
    currentPlayer: Doc<"players"> | null | undefined;
    isHost: boolean;
    onStartGame: () => void;
    onEndGame?: () => void;
}

export function Lobby({
    game,
    players,
    currentPlayer,
    isHost,
    onStartGame,
    onEndGame,
}: LobbyProps) {
    const [copied, setCopied] = useState(false);

    const copyCode = async () => {
        await navigator.clipboard.writeText(game.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const canStart = players.length >= 2;

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4 pt-16">
            <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} />
            <div className="w-full max-w-md space-y-4">
                {/* Game Code Card */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                    <CardHeader className="text-center pb-2">
                        <p className="text-sm text-gray-500">{bs.lobby.gameCode}</p>
                        <CardTitle className="text-4xl font-mono tracking-[0.3em] text-violet-600">
                            {game.code}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-gray-500 mb-3">{bs.lobby.shareCode}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyCode}
                            className="gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-600" />
                                    Kopirano!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Kopiraj kod
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Players Card */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-violet-600" />
                            {bs.common.players}
                            <Badge variant="secondary" className="ml-auto">
                                {players.length} {bs.lobby.playersCount}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {players.map((player) => (
                                <li
                                    key={player._id}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${player._id === currentPlayer?._id
                                        ? "bg-violet-100"
                                        : "bg-gray-50"
                                        }`}
                                >
                                    {player.isHost && (
                                        <Crown className="w-4 h-4 text-amber-500" />
                                    )}
                                    <span className="font-medium">{player.name}</span>
                                    {player._id === currentPlayer?._id && (
                                        <span className="text-sm text-gray-500">{bs.lobby.you}</span>
                                    )}
                                    {player.isHost && (
                                        <Badge variant="outline" className="ml-auto text-xs">
                                            {bs.lobby.host}
                                        </Badge>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Start Game Button (Host Only) */}
                {isHost ? (
                    <div className="space-y-2">
                        <Button
                            size="lg"
                            className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                            onClick={onStartGame}
                            disabled={!canStart}
                        >
                            {bs.lobby.startGame}
                        </Button>
                        {!canStart && (
                            <p className="text-center text-white/80 text-sm">
                                {bs.lobby.minPlayers}
                            </p>
                        )}
                    </div>
                ) : (
                    <Card className="bg-white/20 backdrop-blur-sm border-0">
                        <CardContent className="py-4 text-center text-white">
                            <p>{bs.lobby.waiting}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
