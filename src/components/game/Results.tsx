"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameHeader } from "@/components/game/GameHeader";
import { StrokePreview } from "@/components/game/StrokePreview";
import { bs } from "@/lib/i18n/bs";
import { ArrowRight, Crown, Home, Star, Trophy } from "lucide-react";
import { Game, Guess, Player, Round } from "@/lib/types";

interface ResultsProps {
  game: Game;
  players: Player[];
  currentPlayer: Player | null | undefined;
  round: Round | null | undefined;
  guesses: Guess[];
  isGameOver: boolean;
  isHost?: boolean;
  error?: string;
  onNextRound: () => void;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
}

export function Results({
  game,
  players,
  currentPlayer,
  round,
  guesses,
  isGameOver,
  isHost = false,
  error,
  onNextRound,
  onEndGame,
  onLeaveGame,
}: ResultsProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const correctAnswer = guesses.find((guess) => guess.isCorrectAnswer);
  const orderedGuesses = round?.answerOrder?.length
    ? round.answerOrder
        .map((id) => guesses.find((guess) => guess._id === id))
        .filter((guess): guess is Guess => Boolean(guess))
    : guesses;
  const getPlayerName = (playerId: string) => players.find((player) => player._id === playerId)?.name ?? "Nepoznat";

  return (
    <main className="app-shell p-4 pt-20">
      <GameHeader gameCode={game.code} isHost={isHost} showEndGame={!isGameOver} onEndGame={onEndGame} onLeaveGame={onLeaveGame} />
      <div className="mx-auto max-w-md space-y-4">
        <section className="sketch-card text-center">
          {isGameOver ? <Trophy className="mx-auto mb-2 h-16 w-16 text-[var(--sun-dark)]" /> : <Star className="mx-auto mb-2 h-12 w-12 text-[var(--sun-dark)]" />}
          <h1 className="text-3xl font-black text-[var(--ink)]">{isGameOver ? bs.results.gameOver : bs.results.roundResults}</h1>
          {!isGameOver && <p className="mt-1 text-sm font-bold text-[var(--muted-ink)]">{bs.common.round} {game.currentRound} {bs.common.of} {game.maxRounds}</p>}
        </section>

        {error && <div className="error-card">{error}</div>}

        {round && !isGameOver && (
          <section className="overflow-hidden rounded-3xl border-4 border-[var(--ink)] bg-[#fffaf0] shadow-[8px_8px_0_var(--ink)]">
            <StrokePreview strokes={round.strokes} />
          </section>
        )}

        {!isGameOver && round && (
          <section className="sketch-card border-[var(--leaf)] bg-[var(--mint)]/30 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--leaf)]">{bs.results.correctAnswer}</p>
            <p className="mt-1 text-3xl font-black text-[var(--ink)]">{round.prompt}</p>
            <p className="mt-2 text-sm font-bold text-[var(--muted-ink)]">
              {correctAnswer && correctAnswer.votes.length > 0 ? `${correctAnswer.votes.length} igrač(a) pogodilo!` : bs.results.noOneGuessed}
            </p>
          </section>
        )}

        {isGameOver && winner && (
          <section className="sketch-card bg-[var(--sun)] text-center">
            <Crown className="mx-auto mb-2 h-12 w-12 text-[var(--ink)]" />
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--muted-ink)]">{bs.results.winner}</p>
            <p className="mt-1 text-4xl font-black text-[var(--ink)]">{winner.name}</p>
            <p className="font-black text-[var(--ink)]">{winner.score} {bs.results.points}</p>
          </section>
        )}

        <section className="sketch-card">
          <h2 className="mb-3 text-center text-xl font-black text-[var(--ink)]">{isGameOver ? bs.results.finalScores : bs.common.score}</h2>
          <ul className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <li key={player._id} className={`flex items-center gap-3 rounded-xl border-2 border-[var(--ink)] p-3 ${player._id === currentPlayer?._id ? "bg-[var(--sun)]/40" : "bg-white"}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--tomato)] font-black text-white">{index + 1}</span>
                <span className="flex-1 font-black text-[var(--ink)]">{player.name}</span>
                <Badge className="border-2 border-[var(--ink)] bg-white text-[var(--ink)]">{player.score}</Badge>
              </li>
            ))}
          </ul>
        </section>

        {!isGameOver && orderedGuesses.length > 0 && (
          <section className="sketch-card">
            <h2 className="mb-3 text-center text-xl font-black text-[var(--ink)]">Svi odgovori</h2>
            <ul className="space-y-2">
              {orderedGuesses.map((guess) => (
                <li key={guess._id} className={`rounded-xl border-2 border-[var(--ink)] p-3 ${guess.isCorrectAnswer ? "bg-[var(--mint)]/40" : "bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-[var(--ink)]">{guess.text}</span>
                    <Badge variant="outline" className="border-[var(--ink)] bg-white">{guess.votes.length} glas(a)</Badge>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[var(--muted-ink)]">
                    {guess.isCorrectAnswer ? "Tačan odgovor" : `od: ${getPlayerName(guess.playerId)}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isHost ? (
          <Button className="sketch-button h-14 w-full text-lg" onClick={onNextRound}>
            {isGameOver ? <Home className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            {isGameOver ? bs.results.playAgain : bs.results.nextRound}
          </Button>
        ) : (
          <div className="sketch-card text-center font-black text-[var(--ink)]">
            {isGameOver ? "Čeka se domaćin..." : "Čeka se domaćin za sljedeću rundu..."}
          </div>
        )}
      </div>
    </main>
  );
}
