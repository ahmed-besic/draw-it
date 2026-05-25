"use client";

import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/game/GameHeader";
import { PhaseStatus } from "@/components/game/PhaseStatus";
import { bs } from "@/lib/i18n/bs";
import { Eraser, Palette, Send, Undo2 } from "lucide-react";
import { Game, Player, Round, Stroke, StrokePoint } from "@/lib/types";

interface DrawingCanvasProps {
  game: Game;
  currentRound: Round | null | undefined;
  currentPlayer: Player | null | undefined;
  players?: Player[];
  isDrawer: boolean;
  isHost?: boolean;
  error?: string;
  onSubmitDrawing: (strokes: Stroke[]) => void;
  onLiveUpdate?: (strokes: Stroke[]) => void;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
}

const COLORS = ["#211d19", "#d94f34", "#f59e0b", "#2f8f62", "#2f6f9f", "#7c3f58", "#ffffff"];
const BRUSH_SIZES = [4, 8, 14, 22];
const CANVAS_RESOLUTION = 900;

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const [first, ...rest] = stroke.points;
  const startX = first.x * CANVAS_RESOLUTION;
  const startY = first.y * CANVAS_RESOLUTION;

  if (rest.length === 0) {
    ctx.beginPath();
    ctx.arc(startX, startY, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (const point of rest) {
    ctx.lineTo(point.x * CANVAS_RESOLUTION, point.y * CANVAS_RESOLUTION);
  }
  ctx.stroke();
}

function redraw(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
  for (const stroke of strokes) drawStroke(ctx, stroke);
}

export function DrawingCanvas({
  game,
  currentRound,
  isDrawer,
  players = [],
  isHost = false,
  error,
  onSubmitDrawing,
  onLiveUpdate,
  onEndGame,
  onLeaveGame,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [color, setColor] = useState("#211d19");
  const [brushSize, setBrushSize] = useState(8);
  const [showTools, setShowTools] = useState(false);
  const initialStrokes = currentRound?.strokes ?? [];
  const strokesRef = useRef<Stroke[]>(initialStrokes);
  const [strokes, setStrokes] = useState<Stroke[]>(() => initialStrokes);

  const commitStrokes = (next: Stroke[], sync = false) => {
    strokesRef.current = next;
    setStrokes(next);
    if (sync) onLiveUpdate?.(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) redraw(canvas, isDrawer ? strokes : currentRound?.strokes ?? []);
  }, [currentRound?.strokes, isDrawer, strokes]);

  const getPoint = useCallback((event: PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    activeStrokeRef.current = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      color,
      size: brushSize,
      points: [point],
    };
    commitStrokes([...strokesRef.current, activeStrokeRef.current as Stroke]);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !activeStrokeRef.current) return;
    const point = getPoint(event);
    activeStrokeRef.current = {
      ...activeStrokeRef.current,
      points: [...activeStrokeRef.current.points, point],
    };
    commitStrokes([...strokesRef.current.slice(0, -1), activeStrokeRef.current as Stroke]);
  };

  const finishStroke = () => {
    if (!activeStrokeRef.current) return;
    activeStrokeRef.current = null;
    onLiveUpdate?.(strokesRef.current);
  };

  const handleUndo = () => {
    commitStrokes(strokesRef.current.slice(0, -1), true);
  };

  const handleClear = () => {
    commitStrokes([], true);
  };

  const handleSubmit = () => onSubmitDrawing(strokes);

  const canvas = (
    <Card className="overflow-hidden border-4 border-[var(--ink)] bg-[#fffaf0] p-0 shadow-[8px_8px_0_var(--ink)]">
      <canvas
        ref={canvasRef}
        width={CANVAS_RESOLUTION}
        height={CANVAS_RESOLUTION}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        className={`aspect-square w-full touch-none ${isDrawer ? "cursor-crosshair" : ""}`}
      />
    </Card>
  );

  if (!isDrawer) {
    return (
      <main className="app-shell p-4 pt-20">
        <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} onLeaveGame={onLeaveGame} />
        <div className="mx-auto max-w-md space-y-4">
          <PhaseStatus round={currentRound} players={players} label="Vrijeme za crtanje" />
          <div className="sketch-card text-center">
            <p className="text-lg font-black text-[var(--ink)]">{bs.drawing.someoneDrawing}</p>
            <p className="mt-1 text-sm font-bold text-[var(--muted-ink)]">Crtež se osvježava uživo.</p>
          </div>
          {canvas}
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell p-4 pt-20">
      <GameHeader gameCode={game.code} isHost={isHost} onEndGame={onEndGame} onLeaveGame={onLeaveGame} />
      <div className="mx-auto max-w-md space-y-4">
        <PhaseStatus round={currentRound} players={players} label="Tvoj red" />
        <div className="sketch-card text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--tomato)]">{bs.drawing.prompt}</p>
          <h1 className="mt-1 text-2xl font-black text-[var(--ink)]">{currentRound?.prompt}</h1>
        </div>
        {error && <div className="error-card">{error}</div>}
        {canvas}

        {showTools && (
          <Card className="sketch-card p-3">
            <CardContent className="space-y-3 p-0">
              <div className="flex flex-wrap justify-center gap-2">
                {COLORS.map((candidate) => (
                  <button
                    key={candidate}
                    aria-label={`Boja ${candidate}`}
                    onClick={() => setColor(candidate)}
                    className={`h-10 w-10 rounded-full border-[3px] border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] ${color === candidate ? "scale-110 ring-4 ring-[var(--sun)]" : ""}`}
                    style={{ backgroundColor: candidate }}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-2">
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-[var(--ink)] bg-white ${brushSize === size ? "bg-[var(--mint)]" : ""}`}
                  >
                    <span className="rounded-full bg-[var(--ink)]" style={{ width: size, height: size }} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-[1fr_auto_auto_1fr] gap-2">
          <Button className="sketch-button" onClick={() => setShowTools((value) => !value)}>
            <Palette className="h-5 w-5" />
            Alat
          </Button>
          <Button variant="outline" className="h-12 border-[3px] border-[var(--ink)] bg-white" onClick={handleUndo} disabled={strokes.length === 0}>
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="h-12 border-[3px] border-[var(--ink)] bg-white" onClick={handleClear} disabled={strokes.length === 0}>
            <Eraser className="h-5 w-5" />
          </Button>
          <Button className="sketch-button bg-[var(--tomato)]" onClick={handleSubmit}>
            <Send className="h-5 w-5" />
            {bs.drawing.submit}
          </Button>
        </div>
      </div>
    </main>
  );
}
