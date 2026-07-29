import type { GameNode } from "../hooks/useGame";

interface MoveHistoryProps {
  nodes: GameNode[];
  currentPly: number;
  onGoto: (ply: number) => void;
}

/** Move number and mover color for the move that produced node `ply`, read from the prior FEN. */
function moveLabel(prevFen: string, san: string): string {
  const parts = prevFen.split(/\s+/);
  const mover = parts[1];
  const fullmove = Number(parts[5] ?? 1);
  return mover === "w" ? `${fullmove}. ${san}` : `${fullmove}\u2026 ${san}`;
}

export function MoveHistory({ nodes, currentPly, onGoto }: MoveHistoryProps) {
  return (
    <section className="panel move-history">
      <h2>Historique</h2>
      <ol className="history-list">
        <li>
          <button
            type="button"
            className={`history-move${currentPly === 0 ? " active" : ""}`}
            onClick={() => onGoto(0)}
          >
            Position initiale
          </button>
        </li>
        {nodes.slice(1).map((node, i) => {
          const ply = i + 1;
          return (
            <li key={ply}>
              <button
                type="button"
                className={`history-move${currentPly === ply ? " active" : ""}`}
                onClick={() => onGoto(ply)}
              >
                {moveLabel(nodes[ply - 1].fen, node.san ?? "")}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
