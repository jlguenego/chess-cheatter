export type PromotionPiece = "q" | "r" | "b" | "n";

interface PromotionDialogProps {
  color: "w" | "b";
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const GLYPHS: Record<"w" | "b", Record<PromotionPiece, string>> = {
  w: { q: "\u2655", r: "\u2656", b: "\u2657", n: "\u2658" },
  b: { q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E" },
};

const LABELS: Record<PromotionPiece, string> = {
  q: "Dame",
  r: "Tour",
  b: "Fou",
  n: "Cavalier",
};

const PIECES: PromotionPiece[] = ["q", "r", "b", "n"];

export function PromotionDialog({ color, onSelect, onCancel }: PromotionDialogProps) {
  return (
    <div
      className="promotion-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Choix de la promotion"
      onClick={onCancel}
    >
      <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
        <span className="promotion-title">Promotion</span>
        <div className="promotion-choices">
          {PIECES.map((p) => (
            <button
              key={p}
              type="button"
              className="promotion-choice"
              aria-label={LABELS[p]}
              title={LABELS[p]}
              onClick={() => onSelect(p)}
            >
              {GLYPHS[color][p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
