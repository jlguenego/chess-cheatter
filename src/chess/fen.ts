// Chess position helpers: bridge between the react-chessboard board model,
// full FEN strings for Stockfish, and UCI/SAN move conversion via chess.js.

import { Chess } from "chess.js";
import type { LineEval } from "../engine/engine";

/** Board model: square -> piece code in react-chessboard notation (e.g. "wP"). */
export type BoardPosition = Record<string, string>;

/** react-chessboard `position` object form. */
export type PositionData = Record<string, { pieceType: string }>;

export type SideToMove = "w" | "b";

export interface PositionMeta {
  turn: SideToMove;
  /** Castling availability, e.g. "KQkq" or "-". */
  castling: string;
  /** En passant target square, e.g. "e3" or "-". */
  enPassant: string;
  halfmove: number;
  fullmove: number;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

export const START_BOARD: BoardPosition = {
  a8: "bR",
  b8: "bN",
  c8: "bB",
  d8: "bQ",
  e8: "bK",
  f8: "bB",
  g8: "bN",
  h8: "bR",
  a7: "bP",
  b7: "bP",
  c7: "bP",
  d7: "bP",
  e7: "bP",
  f7: "bP",
  g7: "bP",
  h7: "bP",
  a2: "wP",
  b2: "wP",
  c2: "wP",
  d2: "wP",
  e2: "wP",
  f2: "wP",
  g2: "wP",
  h2: "wP",
  a1: "wR",
  b1: "wN",
  c1: "wB",
  d1: "wQ",
  e1: "wK",
  f1: "wB",
  g1: "wN",
  h1: "wR",
};

export const DEFAULT_META: PositionMeta = {
  turn: "w",
  castling: "KQkq",
  enPassant: "-",
  halfmove: 0,
  fullmove: 1,
};

/** Parse a full FEN back into the board model and metadata (inverse of buildFen). */
export function fenToPosition(fen: string): { board: BoardPosition; meta: PositionMeta } {
  const [placement, turn, castling, enPassant, halfmove, fullmove] = fen.split(/\s+/);
  const board: BoardPosition = {};
  const rows = placement.split("/");
  for (let r = 0; r < rows.length; r++) {
    const rank = RANKS[r];
    let file = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const color = ch === ch.toUpperCase() ? "w" : "b";
      board[`${FILES[file]}${rank}`] = `${color}${ch.toUpperCase()}`;
      file++;
    }
  }
  const meta: PositionMeta = {
    turn: (turn as SideToMove) ?? "w",
    castling: castling || "-",
    enPassant: enPassant || "-",
    halfmove: Number(halfmove ?? 0),
    fullmove: Number(fullmove ?? 1),
  };
  return { board, meta };
}

/** Convert the board model into the react-chessboard object position. */
export function toPositionData(board: BoardPosition): PositionData {
  const data: PositionData = {};
  for (const [square, piece] of Object.entries(board)) {
    data[square] = { pieceType: piece };
  }
  return data;
}

/** Build the FEN piece-placement field (ranks 8 -> 1). */
export function boardToPlacement(board: BoardPosition): string {
  const rows: string[] = [];
  for (const rank of RANKS) {
    let row = "";
    let empty = 0;
    for (const file of FILES) {
      const piece = board[`${file}${rank}`];
      if (!piece) {
        empty++;
        continue;
      }
      if (empty > 0) {
        row += empty;
        empty = 0;
      }
      const color = piece[0];
      const type = piece[1];
      row += color === "w" ? type.toUpperCase() : type.toLowerCase();
    }
    if (empty > 0) row += empty;
    rows.push(row);
  }
  return rows.join("/");
}

/** Infer castling rights from the placement of kings and rooks on home squares. */
export function inferCastling(board: BoardPosition): string {
  let rights = "";
  if (board.e1 === "wK") {
    if (board.h1 === "wR") rights += "K";
    if (board.a1 === "wR") rights += "Q";
  }
  if (board.e8 === "bK") {
    if (board.h8 === "bR") rights += "k";
    if (board.a8 === "bR") rights += "q";
  }
  return rights || "-";
}

/** Assemble a full FEN string from the board model and metadata. */
export function buildFen(board: BoardPosition, meta: PositionMeta): string {
  const placement = boardToPlacement(board);
  const castling = meta.castling || "-";
  const enPassant = meta.enPassant || "-";
  return `${placement} ${meta.turn} ${castling} ${enPassant} ${meta.halfmove} ${meta.fullmove}`;
}

export interface FenValidation {
  ok: boolean;
  error?: string;
}

/** Validate a full FEN, plus require exactly one king per side. */
export function validateFen(fen: string): FenValidation {
  const placement = fen.split(" ")[0] ?? "";
  const whiteKings = (placement.match(/K/g) ?? []).length;
  const blackKings = (placement.match(/k/g) ?? []).length;
  if (whiteKings !== 1) {
    return { ok: false, error: "Il faut exactement un roi blanc." };
  }
  if (blackKings !== 1) {
    return { ok: false, error: "Il faut exactement un roi noir." };
  }
  try {
    new Chess(fen);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface DecodedMove {
  san: string;
  from: string;
  to: string;
}

/** Convert a UCI move (e.g. "e2e4", "e7e8q") into SAN + from/to squares. */
export function uciToMove(fen: string, uci: string): DecodedMove {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from, to, promotion });
    return { san: move.san, from, to };
  } catch {
    // Illegal in this position (e.g. user-crafted). Fall back to raw squares.
    return { san: uci, from, to };
  }
}

/** Whether moving from -> to is a pawn promotion (pawn reaching the last rank). */
export function isPromotion(fen: string, from: string, to: string): boolean {
  try {
    const chess = new Chess(fen);
    const piece = chess.get(from as Parameters<Chess["get"]>[0]);
    if (!piece || piece.type !== "p") return false;
    const toRank = to[1];
    return (piece.color === "w" && toRank === "8") || (piece.color === "b" && toRank === "1");
  } catch {
    return false;
  }
}

/** Apply a legal move to a FEN, returning the resulting FEN and SAN, or null if illegal. */
export function applyMove(
  fen: string,
  from: string,
  to: string,
  promotion?: string,
): { fen: string; san: string } | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from, to, promotion });
    return { fen: chess.fen(), san: move.san };
  } catch {
    return null;
  }
}

/** Format an engine score from the side-to-move perspective, e.g. "+1.24", "#3". */
export function formatScore(line: LineEval): string {
  if (line.scoreType === "mate") {
    if (line.score === 0) return "#";
    return line.score > 0 ? `#${line.score}` : `#-${Math.abs(line.score)}`;
  }
  const pawns = line.score / 100;
  const sign = pawns > 0 ? "+" : pawns < 0 ? "" : "";
  return `${sign}${pawns.toFixed(2)}`;
}
