"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Home, Pencil, X } from "lucide-react";

interface GameHeaderProps {
  gameCode?: string;
  showEndGame?: boolean;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
  isHost?: boolean;
}

export function GameHeader({
  gameCode,
  showEndGame = true,
  onEndGame,
  onLeaveGame,
  isHost = false,
}: GameHeaderProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBack = () => {
    if (onLeaveGame) {
      onLeaveGame();
      return;
    }
    router.push("/");
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (isHost && showEndGame && onEndGame) {
      onEndGame();
      return;
    }
    if (onLeaveGame) onLeaveGame();
    else router.push("/");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b-2 border-[var(--ink)] bg-[var(--paper)]/95 shadow-[0_4px_0_rgba(33,29,25,0.12)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <button onClick={handleBack} className="flex items-center gap-2 text-[var(--ink)] transition-transform active:scale-95">
          <ArrowLeft className="h-5 w-5" />
          <Pencil className="h-5 w-5" />
          <span className="hidden font-black sm:inline">Nacrtaj i Pogodi</span>
        </button>

        {gameCode && (
          <div className="rounded-full border-2 border-[var(--ink)] bg-white px-3 py-1 font-mono text-sm font-black tracking-widest text-[var(--ink)] shadow-[2px_2px_0_var(--ink)]">
            {gameCode}
          </div>
        )}

        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="font-black text-[var(--ink)] hover:bg-[var(--sun)]/40">
              {isHost && showEndGame ? <X className="h-4 w-4" /> : <Home className="h-4 w-4" />}
              {isHost && showEndGame ? "Završi" : "Izađi"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sketch-card max-w-sm">
            <DialogHeader>
              <DialogTitle>{isHost && showEndGame ? "Završi igru?" : "Napusti igru?"}</DialogTitle>
              <DialogDescription>
                {isHost && showEndGame
                  ? "Ovo će završiti igru za sve igrače. Jesi li siguran/na?"
                  : "Možeš se vratiti kasnije ako igra još traje."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Odustani</Button>
              <Button variant={isHost && showEndGame ? "destructive" : "default"} onClick={handleConfirm}>
                {isHost && showEndGame ? "Završi igru" : "Napusti"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
