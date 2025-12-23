"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bs } from "@/lib/i18n/bs";
import { Pencil, Users, Sparkles, Clock, Play, CheckCircle, ArrowRight } from "lucide-react";

// Generate a random UUID (fallback for older browsers)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("drawit-session-id");
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : generateUUID();
    localStorage.setItem("drawit-session-id", sessionId);
  }
  return sessionId;
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

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

  // Get game history
  const gameHistory = useQuery(
    api.players.getGamesBySession,
    sessionId ? { sessionId } : "skip"
  );

  // Load saved name and session
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
      const result = await createGame({
        hostName: playerName.trim(),
        sessionId: sid,
      });
      router.push(`/game/${result.code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Greška pri kreiranju igre");
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
      await joinGame({
        code: gameCode.trim().toUpperCase(),
        playerName: playerName.trim(),
        sessionId: sid,
      });
      router.push(`/game/${gameCode.trim().toUpperCase()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Greška pri pridruživanju");
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
    switch (status) {
      case "lobby":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Čekanje
          </Badge>
        );
      case "playing":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Play className="w-3 h-3 mr-1" />
            U toku
          </Badge>
        );
      case "finished":
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Završeno
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 shadow-lg">
            <Pencil className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {bs.home.title}
          </h1>
          <p className="text-white/80 text-lg">{bs.home.subtitle}</p>
        </div>

        {/* Main Menu - Just buttons, no name input */}
        {mode === "menu" && (
          <>
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader>
                <CardTitle className="text-center text-gray-800">
                  Dobrodošao/la!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    className="h-16 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    onClick={() => setMode("create_name")}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {bs.home.createGame}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 text-lg border-2 border-violet-600 text-violet-600 hover:bg-violet-50"
                    onClick={() => setMode("join_code")}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    {bs.home.joinGame}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game History */}
            {gameHistory && gameHistory.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-600" />
                    Tvoje igre
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {gameHistory.map((game) => (
                    <button
                      key={game._id}
                      onClick={() => router.push(`/game/${game.code}`)}
                      className="w-full p-3 rounded-lg bg-gray-50 hover:bg-violet-50 transition-colors flex items-center justify-between text-left"
                    >
                      <div>
                        <span className="font-mono text-lg font-semibold text-violet-600">
                          {game.code}
                        </span>
                        <p className="text-sm text-gray-500">
                          {formatRelativeTime(game.createdAt)} • Runda {game.currentRound}/{game.maxRounds}
                        </p>
                      </div>
                      {getStatusBadge(game.status)}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Step 1 for Join: Enter Code */}
        {mode === "join_code" && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-center text-gray-800 flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-violet-600" />
                Unesi kod igre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="XXXXX"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="text-2xl h-14 text-center tracking-[0.5em] font-mono uppercase"
                maxLength={5}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={handleCodeSubmit}
                disabled={gameCode.length !== 5}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Nastavi
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode("menu");
                  setError("");
                  setGameCode("");
                }}
              >
                Nazad
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 for Join: Enter Name */}
        {mode === "join_name" && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-center text-gray-800">
                Kako se zoveš?
              </CardTitle>
              <p className="text-center text-sm text-gray-500">
                Pridružuješ se igri: <span className="font-mono font-bold text-violet-600">{gameCode}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={bs.home.enterName}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-lg h-12"
                maxLength={20}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={handleJoin}
                disabled={isJoining || playerName.trim().length < 2}
              >
                {isJoining ? bs.common.loading : bs.home.join}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode("join_code");
                  setError("");
                }}
              >
                Nazad
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Game: Enter Name */}
        {mode === "create_name" && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-center text-gray-800 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-600" />
                Kako se zoveš?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={bs.home.enterName}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-lg h-12"
                maxLength={20}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={handleCreate}
                disabled={isCreating || playerName.trim().length < 2}
              >
                {isCreating ? bs.common.loading : bs.home.create}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode("menu");
                  setError("");
                }}
              >
                Nazad
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          Igra za 2-8 igrača • Crtajte na mobilnim uređajima
        </p>
      </div>
    </main>
  );
}
