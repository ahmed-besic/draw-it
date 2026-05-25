"use client";

import { useEffect, useState } from "react";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTimeLeft, isPlayerActive } from "@/lib/game";
import { Player, Round } from "@/lib/types";

interface PhaseStatusProps {
  round: Round | null | undefined;
  players?: Player[];
  submitted?: number;
  total?: number;
  label: string;
}

export function PhaseStatus({ round, players = [], submitted, total, label }: PhaseStatusProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeCount = players.filter((player) => isPlayerActive(player, now)).length;

  return (
    <div className="sketch-card flex items-center justify-between gap-3 p-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-ink)]">{label}</p>
        <div className="mt-1 flex items-center gap-2 text-[var(--ink)]">
          <Clock className="h-5 w-5 text-[var(--tomato)]" />
          <span className="text-2xl font-black tabular-nums">{formatTimeLeft(round?.phaseEndsAt, now)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {submitted !== undefined && total !== undefined && (
          <Badge className="border-2 border-[var(--ink)] bg-[var(--mint)] text-[var(--ink)] shadow-[2px_2px_0_var(--ink)]">
            {submitted} / {total}
          </Badge>
        )}
        <span className="flex items-center gap-1 text-sm font-bold text-[var(--muted-ink)]">
          <Users className="h-4 w-4" /> {activeCount} aktivno
        </span>
      </div>
    </div>
  );
}
