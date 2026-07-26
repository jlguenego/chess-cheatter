import { useMemo, useState } from "react";
import type { Arrow } from "react-chessboard";
import { BoardEditor } from "./components/BoardEditor";
import { GameConfig } from "./components/GameConfig";
import { EngineControls, buildLimit, type LimitMode } from "./components/EngineControls";
import { SuggestionsPanel } from "./components/SuggestionsPanel";
import { useStockfish } from "./hooks/useStockfish";
import { useTheme } from "./hooks/useTheme";
import { rankColor } from "./theme/rankColors";
import {
  DEFAULT_META,
  START_BOARD,
  buildFen,
  inferCastling,
  uciToMove,
  validateFen,
  type BoardPosition,
  type PositionMeta,
} from "./chess/fen";

export default function App() {
  const { theme, setTheme } = useTheme();
  const [board, setBoard] = useState<BoardPosition>({ ...START_BOARD });
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [meta, setMeta] = useState<PositionMeta>({ ...DEFAULT_META });

  const [mode, setMode] = useState<LimitMode>("movetime");
  const [movetimeMs, setMovetimeMs] = useState(1500);
  const [depth, setDepth] = useState(18);

  const { lines, analyzing, analyzedFen, analyze, stop } = useStockfish();

  const currentFen = useMemo(() => buildFen(board, meta), [board, meta]);
  const validation = useMemo(() => validateFen(currentFen), [currentFen]);

  // Arrows are drawn for the analyzed position so they always match `lines`.
  const arrows = useMemo<Arrow[]>(() => {
    if (!analyzedFen) return [];
    return lines.map((line, i) => {
      const { from, to } = uciToMove(analyzedFen, line.pvUci[0]);
      return {
        startSquare: from,
        endSquare: to,
        color: rankColor(i),
      };
    });
  }, [analyzedFen, lines]);

  function handleBoardChange(next: BoardPosition) {
    setBoard(next);
    // Keep castling rights consistent with the pieces on the board.
    setMeta((m) => ({ ...m, castling: inferCastling(next) }));
  }

  function handleAnalyze() {
    if (!validation.ok) return;
    analyze(currentFen, buildLimit(mode, movetimeMs, depth));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>♟ Chess Cheater</h1>
          <p className="subtitle">
            Reproduisez la position, lancez Stockfish, jouez le meilleur coup.
          </p>
        </div>
        <div className="segmented theme-switch" role="group" aria-label="Choix du thème">
          <button
            type="button"
            className={theme === "dark" ? "active" : ""}
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            🌙 Sombre
          </button>
          <button
            type="button"
            className={theme === "light" ? "active" : ""}
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            ☀️ Clair
          </button>
          <button
            type="button"
            className={theme === "warm80s" ? "active" : ""}
            aria-pressed={theme === "warm80s"}
            onClick={() => setTheme("warm80s")}
          >
            🌆 Rétro 80
          </button>
          <button
            type="button"
            className={theme === "wireframe2025" ? "active" : ""}
            aria-pressed={theme === "wireframe2025"}
            onClick={() => setTheme("wireframe2025")}
          >
            ▢ Wireframe
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="board-column">
          <BoardEditor
            board={board}
            orientation={orientation}
            arrows={arrows}
            onBoardChange={handleBoardChange}
          />
        </div>

        <aside className="side-column">
          <GameConfig
            orientation={orientation}
            meta={meta}
            onOrientationChange={setOrientation}
            onMetaChange={setMeta}
          />
          <EngineControls
            mode={mode}
            movetimeMs={movetimeMs}
            depth={depth}
            analyzing={analyzing}
            canAnalyze={validation.ok}
            onModeChange={setMode}
            onMovetimeChange={setMovetimeMs}
            onDepthChange={setDepth}
            onAnalyze={handleAnalyze}
            onStop={stop}
          />
          <SuggestionsPanel
            fen={analyzedFen}
            lines={lines}
            analyzing={analyzing}
            error={validation.ok ? undefined : validation.error}
          />
        </aside>
      </main>
    </div>
  );
}
