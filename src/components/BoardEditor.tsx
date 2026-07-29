import { Chessboard, ChessboardProvider, SparePiece } from "react-chessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs, Arrow } from "react-chessboard";
import { START_BOARD, toPositionData, type BoardPosition } from "../chess/fen";
import { PromotionDialog, type PromotionPiece } from "./PromotionDialog";

interface BoardEditorProps {
  board: BoardPosition;
  orientation: "white" | "black";
  arrows: Arrow[];
  mode: "edit" | "play";
  promotion: { color: "w" | "b" } | null;
  onBoardChange: (board: BoardPosition) => void;
  onMove: (from: string, to: string) => boolean;
  onPromotionSelect: (piece: PromotionPiece) => void;
  onPromotionCancel: () => void;
}

const WHITE_PIECES = ["wK", "wQ", "wR", "wB", "wN", "wP"];
const BLACK_PIECES = ["bK", "bQ", "bR", "bB", "bN", "bP"];

export function BoardEditor({
  board,
  orientation,
  arrows,
  mode,
  promotion,
  onBoardChange,
  onMove,
  onPromotionSelect,
  onPromotionCancel,
}: BoardEditorProps) {
  const playing = mode === "play";

  function handlePieceDrop({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    // Play mode: a drop is a chess move, delegated to the parent for legality.
    if (playing) {
      if (piece.isSparePiece || !sourceSquare || !targetSquare) return false;
      return onMove(sourceSquare, targetSquare);
    }

    const next: BoardPosition = { ...board };

    // Dropped off the board -> remove the piece.
    if (!targetSquare) {
      if (!piece.isSparePiece && sourceSquare) delete next[sourceSquare];
      onBoardChange(next);
      return true;
    }

    if (piece.isSparePiece) {
      next[targetSquare] = piece.pieceType;
    } else if (sourceSquare) {
      delete next[sourceSquare];
      next[targetSquare] = piece.pieceType;
    }
    onBoardChange(next);
    return true;
  }

  // Right-click a square to clear it (edit mode only).
  function handleRightClick({ square }: SquareHandlerArgs) {
    if (playing || !board[square]) return;
    const next = { ...board };
    delete next[square];
    onBoardChange(next);
  }

  return (
    <div className="board-editor">
      <ChessboardProvider
        options={{
          position: toPositionData(board),
          boardOrientation: orientation,
          arrows,
          allowDragOffBoard: !playing,
          clearArrowsOnClick: false,
          lightSquareStyle: { backgroundColor: "var(--comp-board-light)" },
          darkSquareStyle: {
            background: "var(--board-dark-fill, var(--comp-board-dark))",
          },
          lightSquareNotationStyle: { color: "var(--comp-board-dark)" },
          darkSquareNotationStyle: {
            color: "var(--board-dark-notation, var(--comp-board-light))",
          },
          onPieceDrop: handlePieceDrop,
          onSquareRightClick: handleRightClick,
          id: "editor",
        }}
      >
        {!playing && (
          <SparePieceRow pieces={orientation === "white" ? BLACK_PIECES : WHITE_PIECES} />
        )}
        <div className="board-wrapper">
          <Chessboard />
          {promotion && (
            <PromotionDialog
              color={promotion.color}
              onSelect={onPromotionSelect}
              onCancel={onPromotionCancel}
            />
          )}
        </div>
        {!playing && (
          <SparePieceRow pieces={orientation === "white" ? WHITE_PIECES : BLACK_PIECES} />
        )}
      </ChessboardProvider>

      {!playing && (
        <>
          <div className="board-actions">
            <button onClick={() => onBoardChange({ ...START_BOARD })}>Position de départ</button>
            <button onClick={() => onBoardChange({})}>Vider</button>
          </div>
          <p className="hint">
            Glissez une pièce depuis les rangées ci-dessus pour l'ajouter. Faites glisser une pièce
            hors de l'échiquier (ou clic droit) pour la retirer.
          </p>
        </>
      )}

      {playing && (
        <p className="hint">Glissez une pièce pour jouer un coup ; l'analyse se relance seule.</p>
      )}
    </div>
  );
}

function SparePieceRow({ pieces }: { pieces: string[] }) {
  return (
    <div className="spare-row">
      {pieces.map((p) => (
        <div key={p} className="spare-piece">
          <SparePiece pieceType={p} />
        </div>
      ))}
    </div>
  );
}
