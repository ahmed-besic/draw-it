// Types for game components - matches Convex schema
// This file provides types that work during build without Convex codegen

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
}

export interface Round {
    _id: string;
    _creationTime: number;
    gameId: string;
    roundNumber: number;
    drawerId: string;
    prompt: string;
    drawing?: string;
    status: "drawing" | "guessing" | "voting" | "results";
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
