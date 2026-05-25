import { Player } from "@/lib/types";

export const INACTIVE_AFTER_MS = 20_000;

export function isPlayerActive(player: Player, now = Date.now()) {
  return !player.leftAt && (player.lastSeenAt ?? player._creationTime) >= now - INACTIVE_AFTER_MS;
}

export function formatTimeLeft(endsAt?: number, now = Date.now()) {
  if (!endsAt) return "--";
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
