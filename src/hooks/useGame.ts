import { useCallback, useMemo, useState } from "react";
import { applyMove } from "../chess/fen";

/** One node in the played line. `san` is null for the root (starting) position. */
export interface GameNode {
  fen: string;
  san: string | null;
}

export interface UseGame {
  nodes: GameNode[];
  currentPly: number;
  currentFen: string | null;
  start: (fen: string) => void;
  play: (from: string, to: string, promotion?: string) => boolean;
  goto: (ply: number) => void;
  reset: () => void;
}

export function useGame(): UseGame {
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [currentPly, setCurrentPly] = useState(0);

  const start = useCallback((fen: string) => {
    setNodes([{ fen, san: null }]);
    setCurrentPly(0);
  }, []);

  const play = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      const base = nodes[currentPly];
      if (!base) return false;
      const result = applyMove(base.fen, from, to, promotion);
      if (!result) return false;
      // Playing from a past position truncates the future line.
      const trimmed = nodes.slice(0, currentPly + 1);
      trimmed.push({ fen: result.fen, san: result.san });
      setNodes(trimmed);
      setCurrentPly(trimmed.length - 1);
      return true;
    },
    [nodes, currentPly],
  );

  const goto = useCallback(
    (ply: number) => {
      if (ply >= 0 && ply < nodes.length) setCurrentPly(ply);
    },
    [nodes.length],
  );

  const reset = useCallback(() => {
    setNodes([]);
    setCurrentPly(0);
  }, []);

  const currentFen = useMemo(() => nodes[currentPly]?.fen ?? null, [nodes, currentPly]);

  return { nodes, currentPly, currentFen, start, play, goto, reset };
}
