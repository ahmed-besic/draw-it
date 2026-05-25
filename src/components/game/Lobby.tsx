"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameHeader } from "@/components/game/GameHeader";
import { bs } from "@/lib/i18n/bs";
import { Check, Copy, Crown, Users } from "lucide-react";
import { Game, Player } from "@/lib/types";
import { isPlayerActive } from "@/lib/game";

interface LobbyProps {
  game: Game;
  players: Player[];
  currentPlayer: Player | null | undefined;
  isHost: boolean;
  error?: string;
  onStartGame: () => void;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
}

export function Lobby({
  game,
  players,
  currentPlayer,
  isHost,
  error,
  onStartGame,
  onEndGame,
  onLeaveGame,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const activePlayers = players.filter((player) => isPlayerActive(player));
  const canStart = activePlayers.length >= 2;

  const copyCode = async () => {
    await navigator.clipboard.writeText(game.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="app-shell flex items-center justify-center p-4 pt-20">
      <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} onLeaveGame={onLeaveGame} />
      <div className="w-full max-w-md space-y-4">
        <section className="sketch-card text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--muted-ink)]">{bs.lobby.gameCode}</p>
          <h1 className="mt-2 font-mono text-5xl font-black tracking-[0.25em] text-[var(--ink)]">{game.code}</h1>
          <p className="mt-3 text-sm font-bold text-[var(--muted-ink)]">{bs.lobby.shareCode}</p>
          <Button variant="outline" size="sm" onClick={copyCode} className="mt-4 border-[3px] border-[var(--ink)] bg-white font-black shadow-[3px_3px_0_var(--ink)]">
            {copied ? <Check className="h-4 w-4 text-[var(--leaf)]" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopirano!" : "Kopiraj kod"}
          </Button>
        </section>

        {error && <div className="error-card">{error}</div>}

        <section className="sketch-card">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--tomato)]" />
            <h2 className="text-xl font-black text-[var(--ink)]">{bs.common.players}</h2>
            <Badge className="ml-auto border-2 border-[var(--ink)] bg-[var(--mint)] text-[var(--ink)]">
              {activePlayers.length} aktivno
            </Badge>
          </div>
          <ul className="space-y-2">
            {players.map((player) => {
              const active = isPlayerActive(player);
              return (
                <li
                  key={player._id}
                  className={`flex items-center gap-2 rounded-xl border-2 border-[var(--ink)] p-3 font-bold ${
                    player._id === currentPlayer?._id ? "bg-[var(--sun)]/40" : "bg-white"
                  } ${!active ? "opacity-50" : ""}`}
                >
                  {player.isHost && <Crown className="h-4 w-4 text-[var(--sun-dark)]" />}
                  <span className="flex-1 text-[var(--ink)]">{player.name}</span>
                  {player._id === currentPlayer?._id && <span className="text-sm text-[var(--muted-ink)]">{bs.lobby.you}</span>}
                  <Badge variant="outline" className="border-[var(--ink)] bg-white text-xs">
                    {active ? (player.isHost ? bs.lobby.host : "spreman/na") : "offline"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>

        {isHost ? (
          <div className="space-y-2">
            <Button className="sketch-button h-14 w-full text-lg" onClick={onStartGame} disabled={!canStart}>
              {bs.lobby.startGame}
            </Button>
            {!canStart && <p className="text-center text-sm font-bold text-[var(--muted-ink)]">{bs.lobby.minPlayers}</p>}
          </div>
        ) : (
          <div className="sketch-card text-center font-black text-[var(--ink)]">{bs.lobby.waiting}</div>
        )}
      </div>
    </main>
  );
}
