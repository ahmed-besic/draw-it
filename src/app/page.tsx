"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bs } from "@/lib/i18n/bs";
import { ArrowRight, CheckCircle, Clock, Pencil, Play, Sparkles, Users } from "lucide-react";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("drawit-session-id");
  if (!sessionId) {
    sessionId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : generateUUID();
    localStorage.setItem("drawit-session-id", sessionId);
  }
  return sessionId;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "upravo sada";
  if (minutes < 60) return `prije ${minutes} min`;
  if (hours < 24) return `prije ${hours} h`;
  return `prije ${days} dana`;
}

type Mode = "menu" | "join_code" | "join_name" | "create_name";

export default function HomePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("menu");
  const [sessionId, setSessionId] = useState("");

  const createGame = useMutation(api.games.create);
  const joinGame = useMutation(api.games.join);
  const gameHistory = useQuery(api.players.getGamesBySession, sessionId ? { sessionId } : "skip");

  useEffect(() => {
    const savedName = localStorage.getItem("drawit-player-name");
    if (savedName) setPlayerName(savedName);
    setSessionId(getSessionId());
  }, []);

  const handleCreate = async () => {
    if (playerName.trim().length < 2) {
      setError(bs.errors.nameTooShort);
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      localStorage.setItem("drawit-player-name", playerName.trim());
      const sid = getSessionId();
      const result = await createGame({ hostName: playerName.trim(), sessionId: sid });
      router.push(`/game/${result.code}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Greška pri kreiranju igre");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (playerName.trim().length < 2) {
      setError(bs.errors.nameTooShort);
      return;
    }

    setIsJoining(true);
    setError("");
    try {
      localStorage.setItem("drawit-player-name", playerName.trim());
      const sid = getSessionId();
      const code = gameCode.trim().toUpperCase();
      await joinGame({ code, playerName: playerName.trim(), sessionId: sid });
      router.push(`/game/${code}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Greška pri pridruživanju");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeSubmit = () => {
    if (gameCode.trim().length !== 5) {
      setError(bs.errors.invalidCode);
      return;
    }
    setError("");
    setMode("join_name");
  };

  const getStatusBadge = (status: string) => {
    if (status === "lobby") return <Badge className="border-2 border-[var(--ink)] bg-[var(--sun)] text-[var(--ink)]"><Clock className="h-3 w-3" /> Čekanje</Badge>;
    if (status === "playing") return <Badge className="border-2 border-[var(--ink)] bg-[var(--mint)] text-[var(--ink)]"><Play className="h-3 w-3" /> U toku</Badge>;
    return <Badge variant="outline" className="border-[var(--ink)] bg-white"><CheckCircle className="h-3 w-3" /> Završeno</Badge>;
  };

  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 rotate-[-4deg] items-center justify-center rounded-[2rem] border-4 border-[var(--ink)] bg-[var(--sun)] shadow-[8px_8px_0_var(--ink)]">
            <Pencil className="h-12 w-12 text-[var(--ink)]" />
          </div>
          <p className="font-black uppercase tracking-[0.25em] text-[var(--tomato)]">party sketchbook</p>
          <h1 className="mt-2 text-5xl font-black leading-none text-[var(--ink)]">{bs.home.title}</h1>
          <p className="mt-3 text-lg font-bold text-[var(--muted-ink)]">{bs.home.subtitle}</p>
        </header>

        {mode === "menu" && (
          <>
            <section className="sketch-card space-y-4">
              <h2 className="text-center text-2xl font-black text-[var(--ink)]">Dobrodošao/la!</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button className="sketch-button h-16 text-base" onClick={() => setMode("create_name")}>
                  <Sparkles className="h-5 w-5" />
                  {bs.home.createGame}
                </Button>
                <Button className="sketch-button h-16 !bg-[var(--tomato)] text-base" onClick={() => setMode("join_code")}>
                  <Users className="h-5 w-5" />
                  {bs.home.joinGame}
                </Button>
              </div>
            </section>

            {gameHistory && gameHistory.length > 0 && (
              <section className="sketch-card mt-4">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-[var(--ink)]"><Clock className="h-5 w-5 text-[var(--tomato)]" /> Tvoje igre</h2>
                <div className="space-y-2">
                  {gameHistory.map((game) => (
                    <button key={game._id} onClick={() => router.push(`/game/${game.code}`)} className="flex w-full items-center justify-between rounded-xl border-2 border-[var(--ink)] bg-white p-3 text-left transition-transform active:scale-95">
                      <div>
                        <span className="font-mono text-lg font-black text-[var(--ink)]">{game.code}</span>
                        <p className="text-sm font-bold text-[var(--muted-ink)]">{formatRelativeTime(game.createdAt)} • Runda {game.currentRound}/{game.maxRounds}</p>
                      </div>
                      {getStatusBadge(game.status)}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {mode === "join_code" && (
          <section className="sketch-card space-y-4">
            <h2 className="text-center text-2xl font-black text-[var(--ink)]">Unesi kod igre</h2>
            <Input placeholder="XXXXX" value={gameCode} onChange={(event) => setGameCode(event.target.value.toUpperCase())} className="h-16 border-[3px] border-[var(--ink)] bg-white text-center font-mono text-3xl font-black uppercase tracking-[0.45em]" maxLength={5} autoFocus />
            {error && <div className="error-card text-center">{error}</div>}
            <Button className="sketch-button w-full" onClick={handleCodeSubmit} disabled={gameCode.length !== 5}><ArrowRight className="h-5 w-5" /> Nastavi</Button>
            <Button variant="ghost" className="w-full font-black" onClick={() => { setMode("menu"); setError(""); setGameCode(""); }}>Nazad</Button>
          </section>
        )}

        {mode === "join_name" && (
          <section className="sketch-card space-y-4">
            <h2 className="text-center text-2xl font-black text-[var(--ink)]">Kako se zoveš?</h2>
            <p className="text-center text-sm font-bold text-[var(--muted-ink)]">Pridružuješ se igri: <span className="font-mono font-black text-[var(--tomato)]">{gameCode}</span></p>
            <Input placeholder={bs.home.enterName} value={playerName} onChange={(event) => setPlayerName(event.target.value)} className="h-13 border-[3px] border-[var(--ink)] bg-white text-lg font-bold" maxLength={20} autoFocus />
            {error && <div className="error-card text-center">{error}</div>}
            <Button className="sketch-button w-full" onClick={handleJoin} disabled={isJoining || playerName.trim().length < 2}>{isJoining ? bs.common.loading : bs.home.join}</Button>
            <Button variant="ghost" className="w-full font-black" onClick={() => { setMode("join_code"); setError(""); }}>Nazad</Button>
          </section>
        )}

        {mode === "create_name" && (
          <section className="sketch-card space-y-4">
            <h2 className="text-center text-2xl font-black text-[var(--ink)]">Kako se zoveš?</h2>
            <Input placeholder={bs.home.enterName} value={playerName} onChange={(event) => setPlayerName(event.target.value)} className="h-13 border-[3px] border-[var(--ink)] bg-white text-lg font-bold" maxLength={20} autoFocus />
            {error && <div className="error-card text-center">{error}</div>}
            <Button className="sketch-button w-full" onClick={handleCreate} disabled={isCreating || playerName.trim().length < 2}>{isCreating ? bs.common.loading : bs.home.create}</Button>
            <Button variant="ghost" className="w-full font-black" onClick={() => { setMode("menu"); setError(""); }}>Nazad</Button>
          </section>
        )}

        <p className="mt-8 text-center text-sm font-black text-[var(--muted-ink)]">Igra za 2-8 igrača • Crtajte na mobilnim uređajima</p>
      </div>
    </main>
  );
}
