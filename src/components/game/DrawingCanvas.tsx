"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/game/GameHeader";
import { bs } from "@/lib/i18n/bs";
import { Eraser, Undo2, Send, Palette } from "lucide-react";
import { Game, Round, Player } from "@/lib/types";

interface DrawingCanvasProps {
    game: Game;
    currentRound: Round | null | undefined;
    currentPlayer: Player | null | undefined;
    isDrawer: boolean;
    isHost?: boolean;
    onSubmitDrawing: (drawing: string) => void;
    onLiveUpdate?: (drawing: string) => void;
    onEndGame?: () => void;
}

const COLORS = [
    "#000000",
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#22C55E",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#FFFFFF",
];

const BRUSH_SIZES = [4, 8, 16, 24];

export function DrawingCanvas({
    game,
    currentRound,
    currentPlayer,
    isDrawer,
    isHost = false,
    onSubmitDrawing,
    onLiveUpdate,
    onEndGame,
}: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(8);
    const [history, setHistory] = useState<string[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [canvasSize, setCanvasSize] = useState(300);

    // Fixed internal canvas resolution for consistent quality
    const CANVAS_RESOLUTION = 800;

    // Initialize canvas with fixed high resolution
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const updateSize = () => {
            // Get the display size (CSS pixels) - max 500px
            const displaySize = Math.min(container.clientWidth, 500);
            setCanvasSize(displaySize);

            // Set fixed internal canvas resolution for quality
            // CSS will scale it to display size
            canvas.width = CANVAS_RESOLUTION;
            canvas.height = CANVAS_RESOLUTION;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);

                // Save initial state
                setHistory([canvas.toDataURL("image/png", 1.0)]);
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Get coordinates from touch/mouse event and scale to canvas resolution
    const getCoordinates = useCallback((e: TouchEvent | MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        // Scale factor from display size to internal canvas resolution
        const scale = CANVAS_RESOLUTION / rect.width;

        let clientX: number, clientY: number;

        if ("touches" in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ("clientX" in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            return { x: 0, y: 0 };
        }

        // Scale display coordinates to canvas internal coordinates
        return {
            x: (clientX - rect.left) * scale,
            y: (clientY - rect.top) * scale,
        };
    }, []);

    // Start drawing
    const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
        if (!isDrawer) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        // Scale brush size based on canvas resolution vs display size
        const rect = canvas.getBoundingClientRect();
        const scale = CANVAS_RESOLUTION / rect.width;
        const scaledBrushSize = brushSize * scale;

        isDrawingRef.current = true;
        const pos = getCoordinates(e);
        lastPosRef.current = pos;

        // Draw a dot for single tap
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, scaledBrushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }, [isDrawer, color, brushSize, getCoordinates]);

    // Continue drawing
    const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
        if (!isDrawingRef.current || !isDrawer) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        // Scale brush size based on canvas resolution vs display size
        const rect = canvas.getBoundingClientRect();
        const scale = CANVAS_RESOLUTION / rect.width;
        const scaledBrushSize = brushSize * scale;

        const pos = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = scaledBrushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPosRef.current = pos;
    }, [isDrawer, color, brushSize, getCoordinates]);

    // Stop drawing and save state
    const handleEnd = useCallback(() => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Save to history
        const dataUrl = canvas.toDataURL();
        setHistory(prev => [...prev.slice(-19), dataUrl]);

        // Send live update
        if (onLiveUpdate) {
            onLiveUpdate(dataUrl);
        }
    }, [onLiveUpdate]);

    // Attach event listeners directly to canvas for better touch handling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isDrawer) return;

        const options = { passive: false };

        canvas.addEventListener("touchstart", handleStart, options);
        canvas.addEventListener("touchmove", handleMove, options);
        canvas.addEventListener("touchend", handleEnd);
        canvas.addEventListener("touchcancel", handleEnd);
        canvas.addEventListener("mousedown", handleStart);
        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("mouseup", handleEnd);
        canvas.addEventListener("mouseleave", handleEnd);

        return () => {
            canvas.removeEventListener("touchstart", handleStart);
            canvas.removeEventListener("touchmove", handleMove);
            canvas.removeEventListener("touchend", handleEnd);
            canvas.removeEventListener("touchcancel", handleEnd);
            canvas.removeEventListener("mousedown", handleStart);
            canvas.removeEventListener("mousemove", handleMove);
            canvas.removeEventListener("mouseup", handleEnd);
            canvas.removeEventListener("mouseleave", handleEnd);
        };
    }, [isDrawer, handleStart, handleMove, handleEnd]);

    const handleUndo = () => {
        if (history.length <= 1) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        const newHistory = [...history];
        newHistory.pop();
        setHistory(newHistory);

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = newHistory[newHistory.length - 1];
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);

        const dataUrl = canvas.toDataURL("image/png", 1.0);
        setHistory([dataUrl]);
    };

    const handleSubmit = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onSubmitDrawing(canvas.toDataURL("image/png"));
    };

    // Viewer mode - show live drawing
    if (!isDrawer) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4 pt-16">
                <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} />
                <div className="w-full max-w-md">
                    <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                        <CardContent className="py-4 text-center space-y-4">
                            <p className="text-sm text-gray-500">
                                {bs.common.round} {game.currentRound} {bs.common.of} {game.maxRounds}
                            </p>
                            {currentRound?.drawing ? (
                                <div className="aspect-square bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                                    <img
                                        src={currentRound.drawing}
                                        alt="Drawing"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-pulse w-16 h-16 mx-auto mb-3 rounded-full bg-violet-200" />
                                        <p className="text-gray-500">{bs.drawing.waiting}</p>
                                    </div>
                                </div>
                            )}
                            <p className="text-gray-500">{bs.drawing.someoneDrawing}</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 pt-16">
            <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} />
            <div className="w-full max-w-md mx-auto space-y-3">
                {/* Header */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                    <CardContent className="py-3 text-center">
                        <p className="text-sm text-gray-500">
                            {bs.common.round} {game.currentRound} {bs.common.of} {game.maxRounds}
                        </p>
                        <p className="text-lg font-semibold text-violet-600">
                            {bs.drawing.prompt} {currentRound?.prompt}
                        </p>
                    </CardContent>
                </Card>

                {/* Canvas Container */}
                <div ref={containerRef} className="w-full">
                    <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={canvasSize}
                            height={canvasSize}
                            className="w-full aspect-square touch-none cursor-crosshair"
                            style={{ touchAction: "none" }}
                        />
                    </Card>
                </div>

                {/* Color Picker */}
                {showColorPicker && (
                    <Card className="bg-white shadow-lg border-0">
                        <CardContent className="py-3">
                            <div className="flex flex-wrap gap-2 justify-center mb-3">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setColor(c);
                                            setShowColorPicker(false);
                                        }}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform ${color === c ? "border-violet-600 scale-110 ring-2 ring-violet-300" : "border-gray-200"
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-center gap-2">
                                {BRUSH_SIZES.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setBrushSize(size)}
                                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${brushSize === size ? "border-violet-600 bg-violet-50" : "border-gray-200"
                                            }`}
                                    >
                                        <div className="rounded-full bg-gray-800" style={{ width: size, height: size }} />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Toolbar */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 h-12 bg-white"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                        <Palette className="w-5 h-5 mr-2" />
                        <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color }}
                        />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 bg-white"
                        onClick={handleUndo}
                        disabled={history.length <= 1}
                    >
                        <Undo2 className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 bg-white" onClick={handleClear}>
                        <Eraser className="w-5 h-5" />
                    </Button>
                    <Button
                        size="lg"
                        className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600"
                        onClick={handleSubmit}
                    >
                        <Send className="w-5 h-5 mr-2" />
                        {bs.drawing.submit}
                    </Button>
                </div>
            </div>
        </main>
    );
}
