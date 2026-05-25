export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  size: number;
  points: StrokePoint[];
}

export interface Game {
  _id: string;
  _creationTime: number;
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "finished";
  currentRound: number;
  maxRounds: number;
  currentPhase: "drawing" | "guessing" | "voting" | "results";
  createdAt: number;
}

export interface Player {
  _id: string;
  _creationTime: number;
  gameId: string;
  name: string;
  score: number;
  isHost: boolean;
  sessionId: string;
  isConnected: boolean;
  lastSeenAt?: number;
  leftAt?: number;
}

export interface Round {
  _id: string;
  _creationTime: number;
  gameId: string;
  roundNumber: number;
  drawerId: string;
  prompt: string;
  drawing?: string;
  strokes?: Stroke[];
  strokeVersion?: number;
  answerOrder?: string[];
  phaseStartedAt?: number;
  phaseEndsAt?: number;
  scoredAt?: number;
  status: "drawing" | "guessing" | "voting" | "results" | "complete";
  startedAt: number;
}

export interface Guess {
  _id: string;
  _creationTime: number;
  roundId: string;
  playerId: string;
  text: string;
  isCorrectAnswer: boolean;
  votes: string[];
}
