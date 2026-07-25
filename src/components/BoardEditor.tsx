import {
  Chessboard,
  ChessboardProvider,
  SparePiece,
} from "react-chessboard";
import type {
  PieceDropHandlerArgs,
  SquareHandlerArgs,
  Arrow,
} from "react-chessboard";
import {
  START_BOARD,
  toPositionData,
  type BoardPosition,
} from "../chess/fen";

interface BoardEditorProps {
  board: BoardPosition;
  orientation: "white" | "black";
  arrows: Arrow[];
  onBoardChange: (board: BoardPosition) => void;
}

const WHITE_PIECES = ["wK", "wQ", "wR", "wB", "wN", "wP"];
const BLACK_PIECES = ["bK", "bQ", "bR", "bB", "bN", "bP"];

export function BoardEditor({
  board,
  orientation,
  arrows,
  onBoardChange,
}: BoardEditorProps) {
  function handlePieceDrop({
    piece,
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs): boolean {
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

  // Right-click a square to clear it.
  function handleRightClick({ square }: SquareHandlerArgs) {
    if (!board[square]) return;
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
          allowDragOffBoard: true,
          clearArrowsOnClick: false,
          onPieceDrop: handlePieceDrop,
          onSquareRightClick: handleRightClick,
          id: "editor",
        }}
      >
        <SparePieceRow
          pieces={orientation === "white" ? BLACK_PIECES : WHITE_PIECES}
        />
        <div className="board-wrapper">
          <Chessboard />
        </div>
        <SparePieceRow
          pieces={orientation === "white" ? WHITE_PIECES : BLACK_PIECES}
        />
      </ChessboardProvider>

      <div className="board-actions">
        <button onClick={() => onBoardChange({ ...START_BOARD })}>
          Position de départ
        </button>
        <button onClick={() => onBoardChange({})}>Vider</button>
      </div>
      <p className="hint">
        Glissez une pièce depuis les rangées ci-dessus pour l'ajouter. Faites
        glisser une pièce hors de l'échiquier (ou clic droit) pour la retirer.
      </p>
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
