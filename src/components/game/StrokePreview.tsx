"use client";

import { useEffect, useRef } from "react";
import { Stroke } from "@/lib/types";

const SIZE = 900;

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const [first, ...rest] = stroke.points;
  ctx.beginPath();
  ctx.moveTo(first.x * SIZE, first.y * SIZE);
  if (rest.length === 0) {
    ctx.arc(first.x * SIZE, first.y * SIZE, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  for (const point of rest) ctx.lineTo(point.x * SIZE, point.y * SIZE);
  ctx.stroke();
}

export function StrokePreview({ strokes, className = "" }: { strokes?: Stroke[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (const stroke of strokes ?? []) drawStroke(ctx, stroke);
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      className={`aspect-square w-full bg-[#fffaf0] ${className}`}
      aria-label="Crtež"
    />
  );
}
