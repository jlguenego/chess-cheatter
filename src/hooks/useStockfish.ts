import { useCallback, useEffect, useRef, useState } from "react";
import {
  StockfishEngine,
  type AnalysisLimit,
  type LineEval,
} from "../engine/engine";

export interface UseStockfish {
  lines: LineEval[];
  bestmove: string | null;
  analyzing: boolean;
  analyzedFen: string | null;
  analyze: (fen: string, limit: AnalysisLimit) => void;
  stop: () => void;
}

const MULTIPV = 3;

export function useStockfish(): UseStockfish {
  const engineRef = useRef<StockfishEngine | null>(null);
  const [lines, setLines] = useState<LineEval[]>([]);
  const [bestmove, setBestmove] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedFen, setAnalyzedFen] = useState<string | null>(null);

  useEffect(() => {
    const engine = new StockfishEngine();
    void engine.setMultiPV(MULTIPV);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const analyze = useCallback((fen: string, limit: AnalysisLimit) => {
    const engine = engineRef.current;
    if (!engine) return;
    setLines([]);
    setBestmove(null);
    setAnalyzing(true);
    setAnalyzedFen(fen);
    void engine.analyze(fen, limit, {
      onUpdate: (next) => setLines(next),
      onDone: (next, best) => {
        setLines(next);
        setBestmove(best);
        setAnalyzing(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    void engineRef.current?.stop();
  }, []);

  return { lines, bestmove, analyzing, analyzedFen, analyze, stop };
}
