"use client";

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
import { ArrowLeft, X, Home, Pencil } from "lucide-react";
import { useState } from "react";

interface GameHeaderProps {
    gameCode?: string;
    showEndGame?: boolean;
    onEndGame?: () => void;
    isHost?: boolean;
}

export function GameHeader({
    gameCode,
    showEndGame = true,
    onEndGame,
    isHost = false,
}: GameHeaderProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);

    // Back button just navigates home (can come back later)
    const handleBack = () => {
        router.push("/");
    };

    // When host confirms leaving via dialog, end the game
    const handleHostLeave = () => {
        if (onEndGame) {
            onEndGame();
        }
        setShowConfirm(false);
        router.push("/");
    };

    // Non-host leaving just goes home
    const handlePlayerLeave = () => {
        setShowConfirm(false);
        router.push("/");
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
            <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                {/* Left: Back/Logo - just goes home without ending game */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <Pencil className="w-5 h-5" />
                    <span className="font-semibold hidden sm:inline">Nacrtaj i Pogodi</span>
                </button>

                {/* Center: Game Code */}
                {gameCode && (
                    <div className="text-white/80 font-mono text-sm tracking-wider">
                        {gameCode}
                    </div>
                )}

                {/* Right: End/Leave button */}
                <div className="flex items-center gap-2">
                    {showEndGame && isHost ? (
                        // Host sees "Završi" (End Game) button
                        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/80 hover:text-white hover:bg-white/20"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Završi
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Završi igru?</DialogTitle>
                                    <DialogDescription>
                                        Ovo će završiti igru za sve igrače. Jesi li siguran/na?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                        Odustani
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleHostLeave}
                                    >
                                        Završi igru
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : isHost ? (
                        // Host but showEndGame is false - still show leave that ends game
                        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/80 hover:text-white hover:bg-white/20"
                                >
                                    <Home className="w-4 h-4 mr-1" />
                                    Izađi
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Napusti igru?</DialogTitle>
                                    <DialogDescription>
                                        Kao domaćin, napuštanje igre će završiti igru za sve igrače.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                        Odustani
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleHostLeave}
                                    >
                                        Napusti i završi
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        // Non-host player - just leave
                        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/80 hover:text-white hover:bg-white/20"
                                >
                                    <Home className="w-4 h-4 mr-1" />
                                    Izađi
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Napusti igru?</DialogTitle>
                                    <DialogDescription>
                                        Jesi li siguran/na da želiš napustiti igru?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                        Odustani
                                    </Button>
                                    <Button onClick={handlePlayerLeave}>
                                        Napusti
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
        </header>
    );
}
