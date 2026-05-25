"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameHeader } from "@/components/game/GameHeader";
import { PhaseStatus } from "@/components/game/PhaseStatus";
import { StrokePreview } from "@/components/game/StrokePreview";
import { bs } from "@/lib/i18n/bs";
import { Check, Send, Users } from "lucide-react";
import { Game, Guess, Player, Round } from "@/lib/types";
import { isPlayerActive } from "@/lib/game";

interface GuessingPanelProps {
  game: Game;
  currentRound: Round | null | undefined;
  currentPlayer: Player | null | undefined;
  guesses: Guess[];
  players: Player[];
  isDrawer: boolean;
  isHost: boolean;
  error?: string;
  onSubmitGuess: (text: string) => void;
  onStartVoting: () => void;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
}

export function GuessingPanel({
  game,
  currentRound,
  currentPlayer,
  guesses,
  players,
  isDrawer,
  isHost,
  error,
  onSubmitGuess,
  onStartVoting,
  onEndGame,
  onLeaveGame,
}: GuessingPanelProps) {
  const [guess, setGuess] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const activeNonDrawers = players.filter(
    (player) => player._id !== currentRound?.drawerId && isPlayerActive(player)
  );
  const submittedCount = guesses.filter((item) => !item.isCorrectAnswer).length;
  const playerGuess = guesses.find(
    (item) => item.playerId === currentPlayer?._id && !item.isCorrectAnswer
  );
  const hasPlayerSubmitted = !!playerGuess || hasSubmitted;

  const handleSubmit = async () => {
    if (guess.trim().length < 1) return;
    setHasSubmitted(true);
    await onSubmitGuess(guess.trim());
    setGuess("");
  };

  return (
    <main className="app-shell p-4 pt-20">
      <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} onLeaveGame={onLeaveGame} />
      <div className="mx-auto max-w-md space-y-4">
        <PhaseStatus
          round={currentRound}
          players={players}
          label="Lažni odgovori"
          submitted={submittedCount}
          total={activeNonDrawers.length}
        />
        {error && <div className="error-card">{error}</div>}

        <Card className="overflow-hidden border-4 border-[var(--ink)] bg-[#fffaf0] p-0 shadow-[8px_8px_0_var(--ink)]">
          <StrokePreview strokes={currentRound?.strokes} />
        </Card>

        {isDrawer ? (
          <div className="sketch-card text-center">
            <p className="text-lg font-black text-[var(--ink)]">{bs.guessing.cantGuessOwn}</p>
            <p className="mt-2 text-sm font-bold text-[var(--muted-ink)]">{bs.drawing.prompt} {currentRound?.prompt}</p>
          </div>
        ) : hasPlayerSubmitted ? (
          <div className="sketch-card border-[var(--mint)] bg-[var(--mint)]/30 text-center">
            <Check className="mx-auto mb-2 h-12 w-12 text-[var(--leaf)]" />
            <p className="font-black text-[var(--ink)]">{bs.guessing.submitted}</p>
            <p className="mt-1 text-sm font-bold text-[var(--muted-ink)]">{bs.guessing.waiting}</p>
          </div>
        ) : (
          <div className="sketch-card space-y-3">
            <Input
              placeholder={bs.guessing.enterGuess}
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              className="h-13 border-[3px] border-[var(--ink)] bg-white text-lg font-bold"
              maxLength={60}
              onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            />
            <Button className="sketch-button w-full" onClick={handleSubmit} disabled={guess.trim().length < 1}>
              <Send className="h-5 w-5" />
              {bs.guessing.submitGuess}
            </Button>
          </div>
        )}

        <div className="sketch-card flex items-center justify-between p-3">
          <span className="flex items-center gap-2 font-black text-[var(--ink)]"><Users className="h-5 w-5" /> Odgovori</span>
          {isHost && (
            <Button className="sketch-button bg-[var(--sun)] text-[var(--ink)]" onClick={onStartVoting} disabled={submittedCount < 1}>
              Počni glasanje
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
