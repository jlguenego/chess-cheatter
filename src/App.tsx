import { useEffect, useMemo, useRef, useState } from "react";
import type { Arrow } from "react-chessboard";
import { BoardEditor } from "./components/BoardEditor";
import { GameConfig } from "./components/GameConfig";
import { EngineControls, buildLimit, type LimitMode } from "./components/EngineControls";
import { SuggestionsPanel } from "./components/SuggestionsPanel";
import { MoveHistory } from "./components/MoveHistory";
import type { PromotionPiece } from "./components/PromotionDialog";
import { useStockfish } from "./hooks/useStockfish";
import { useGame } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import { rankColor } from "./theme/rankColors";
import {
  DEFAULT_META,
  START_BOARD,
  buildFen,
  fenToPosition,
  inferCastling,
  isPromotion,
  uciToMove,
  validateFen,
  type BoardPosition,
  type PositionMeta,
} from "./chess/fen";

type BoardMode = "edit" | "play";

export default function App() {
  const { theme, setTheme } = useTheme();
  const [board, setBoard] = useState<BoardPosition>({ ...START_BOARD });
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [meta, setMeta] = useState<PositionMeta>({ ...DEFAULT_META });

  const [boardMode, setBoardMode] = useState<BoardMode>("edit");
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: "w" | "b";
  } | null>(null);

  const [mode, setMode] = useState<LimitMode>("movetime");
  const [movetimeMs, setMovetimeMs] = useState(1500);
  const [depth, setDepth] = useState(18);

  const { lines, analyzing, analyzedFen, analyze, stop } = useStockfish();
  const game = useGame();

  const playing = boardMode === "play";
  const editFen = useMemo(() => buildFen(board, meta), [board, meta]);
  const validation = useMemo(() => validateFen(editFen), [editFen]);

  // In play mode the displayed board and metadata are derived from the game position.
  const { board: displayBoard, meta: displayMeta } = useMemo(() => {
    if (playing && game.currentFen) return fenToPosition(game.currentFen);
    return { board, meta };
  }, [playing, game.currentFen, board, meta]);

  // Latest analysis limit, read at fire time so slider changes don't re-analyze.
  const limitRef = useRef(buildLimit(mode, movetimeMs, depth));
  limitRef.current = buildLimit(mode, movetimeMs, depth);

  // Auto-analyze the current game position whenever it changes (a move or history navigation).
  useEffect(() => {
    if (playing && game.currentFen) analyze(game.currentFen, limitRef.current);
  }, [playing, game.currentFen, analyze]);

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

  function enterPlay() {
    if (!validation.ok) return;
    game.start(editFen);
    setBoardMode("play");
  }

  function enterEdit() {
    if (game.currentFen) {
      const { board: b, meta: m } = fenToPosition(game.currentFen);
      setBoard(b);
      setMeta(m);
    }
    stop();
    game.reset();
    setPendingPromotion(null);
    setBoardMode("edit");
  }

  function handleAnalyze() {
    if (!validation.ok) return;
    if (playing) {
      if (game.currentFen) analyze(game.currentFen, limitRef.current);
    } else {
      enterPlay();
    }
  }

  function handleMove(from: string, to: string): boolean {
    const fen = game.currentFen;
    if (!fen) return false;
    if (isPromotion(fen, from, to)) {
      const color = fen.split(/\s+/)[1] === "w" ? "w" : "b";
      setPendingPromotion({ from, to, color });
      return false;
    }
    return game.play(from, to);
  }

  function handlePromotionSelect(piece: PromotionPiece) {
    if (!pendingPromotion) return;
    game.play(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
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
          <div className="segmented board-mode" role="group" aria-label="Mode de l'échiquier">
            <button
              type="button"
              className={boardMode === "edit" ? "active" : ""}
              aria-pressed={boardMode === "edit"}
              onClick={enterEdit}
            >
              ✏️ Éditer
            </button>
            <button
              type="button"
              className={boardMode === "play" ? "active" : ""}
              aria-pressed={boardMode === "play"}
              disabled={!validation.ok}
              onClick={enterPlay}
            >
              ▶ Jouer
            </button>
          </div>
          <BoardEditor
            board={displayBoard}
            orientation={orientation}
            arrows={arrows}
            mode={boardMode}
            promotion={pendingPromotion ? { color: pendingPromotion.color } : null}
            onBoardChange={handleBoardChange}
            onMove={handleMove}
            onPromotionSelect={handlePromotionSelect}
            onPromotionCancel={() => setPendingPromotion(null)}
          />
          {playing && (
            <MoveHistory nodes={game.nodes} currentPly={game.currentPly} onGoto={game.goto} />
          )}
        </div>

        <aside className="side-column">
          <GameConfig
            orientation={orientation}
            meta={displayMeta}
            disabled={playing}
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
