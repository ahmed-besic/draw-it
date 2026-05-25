"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/game/GameHeader";
import { PhaseStatus } from "@/components/game/PhaseStatus";
import { StrokePreview } from "@/components/game/StrokePreview";
import { bs } from "@/lib/i18n/bs";
import { Check, Vote } from "lucide-react";
import { Game, Guess, Player, Round } from "@/lib/types";
import { isPlayerActive } from "@/lib/game";

interface VotingPanelProps {
  game: Game;
  currentRound: Round | null | undefined;
  currentPlayer: Player | null | undefined;
  guesses: Guess[];
  players: Player[];
  isDrawer: boolean;
  isHost: boolean;
  error?: string;
  onVote: (guessId: string) => void;
  onShowResults: () => void;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
}

export function VotingPanel({
  game,
  currentRound,
  currentPlayer,
  guesses,
  players,
  isDrawer,
  isHost,
  error,
  onVote,
  onShowResults,
  onEndGame,
  onLeaveGame,
}: VotingPanelProps) {
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const byId = new Map(guesses.map((guess) => [guess._id, guess]));
  const orderedGuesses = currentRound?.answerOrder?.length
    ? currentRound.answerOrder.map((id) => byId.get(id)).filter((guess): guess is Guess => Boolean(guess))
    : guesses;

  const playerHasVoted = guesses.some((guess) => guess.votes.includes(currentPlayer?._id ?? "")) || hasVoted;
  const totalVotes = guesses.reduce((sum, guess) => sum + guess.votes.length, 0);
  const eligibleVoters = players.filter(
    (player) => player._id !== currentRound?.drawerId && isPlayerActive(player)
  ).length;

  const handleVote = async (guessId: string) => {
    if (playerHasVoted || isDrawer) return;
    const guess = guesses.find((item) => item._id === guessId);
    if (guess?.playerId === currentPlayer?._id) return;
    setSelectedGuess(guessId);
    setHasVoted(true);
    await onVote(guessId);
  };

  return (
    <main className="app-shell p-4 pt-20">
      <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} onLeaveGame={onLeaveGame} />
      <div className="mx-auto max-w-md space-y-4">
        <PhaseStatus
          round={currentRound}
          players={players}
          label="Glasanje"
          submitted={totalVotes}
          total={eligibleVoters}
        />
        {error && <div className="error-card">{error}</div>}

        <Card className="overflow-hidden border-4 border-[var(--ink)] bg-[#fffaf0] p-0 shadow-[8px_8px_0_var(--ink)]">
          <StrokePreview strokes={currentRound?.strokes} />
        </Card>

        {isDrawer ? (
          <div className="sketch-card text-center">
            <p className="font-black text-[var(--ink)]">{bs.voting.waiting}</p>
            <p className="mt-2 text-sm font-bold text-[var(--muted-ink)]">{bs.drawing.prompt} {currentRound?.prompt}</p>
          </div>
        ) : playerHasVoted ? (
          <div className="sketch-card border-[var(--mint)] bg-[var(--mint)]/30 text-center">
            <Check className="mx-auto mb-2 h-12 w-12 text-[var(--leaf)]" />
            <p className="font-black text-[var(--ink)]">{bs.voting.youVoted}</p>
            <p className="mt-1 text-sm font-bold text-[var(--muted-ink)]">{bs.voting.waiting}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-[var(--muted-ink)]">{bs.voting.selectOne}</p>
            {orderedGuesses.map((guess) => {
              const isOwnGuess = guess.playerId === currentPlayer?._id;
              return (
                <button
                  key={guess._id}
                  onClick={() => handleVote(guess._id)}
                  disabled={isOwnGuess}
                  className={`w-full rounded-2xl border-[3px] border-[var(--ink)] p-4 text-left text-lg font-black shadow-[4px_4px_0_var(--ink)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    selectedGuess === guess._id
                      ? "bg-[var(--mint)]"
                      : isOwnGuess
                        ? "cursor-not-allowed bg-stone-200 text-stone-500"
                        : "bg-white hover:bg-[var(--sun)]/30"
                  }`}
                >
                  {guess.text}
                  {isOwnGuess && <span className="ml-2 text-sm">(tvoj odgovor)</span>}
                </button>
              );
            })}
          </div>
        )}

        {isHost && (
          <Button className="sketch-button w-full bg-[var(--sun)] text-[var(--ink)]" onClick={onShowResults} disabled={totalVotes < 1}>
            <Vote className="h-5 w-5" />
            Prikaži rezultate
          </Button>
        )}
      </div>
    </main>
  );
}
