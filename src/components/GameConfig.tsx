import type { PositionMeta, SideToMove } from "../chess/fen";

interface GameConfigProps {
  orientation: "white" | "black";
  meta: PositionMeta;
  onOrientationChange: (o: "white" | "black") => void;
  onMetaChange: (meta: PositionMeta) => void;
}

export function GameConfig({
  orientation,
  meta,
  onOrientationChange,
  onMetaChange,
}: GameConfigProps) {
  function toggleCastle(flag: "K" | "Q" | "k" | "q") {
    const has = meta.castling.includes(flag);
    const order = ["K", "Q", "k", "q"] as const;
    const set = new Set(meta.castling.split("").filter((c) => c !== "-"));
    if (has) set.delete(flag);
    else set.add(flag);
    const next = order.filter((c) => set.has(c)).join("") || "-";
    onMetaChange({ ...meta, castling: next });
  }

  return (
    <section className="panel game-config">
      <h2>Configuration</h2>

      <div className="field">
        <span className="field-label">Mon camp</span>
        <div className="segmented">
          <button
            className={orientation === "white" ? "active" : ""}
            onClick={() => onOrientationChange("white")}
          >
            Blancs
          </button>
          <button
            className={orientation === "black" ? "active" : ""}
            onClick={() => onOrientationChange("black")}
          >
            Noirs
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Trait (à qui de jouer)</span>
        <div className="segmented">
          <button
            className={meta.turn === "w" ? "active" : ""}
            onClick={() => onMetaChange({ ...meta, turn: "w" as SideToMove })}
          >
            Blancs
          </button>
          <button
            className={meta.turn === "b" ? "active" : ""}
            onClick={() => onMetaChange({ ...meta, turn: "b" as SideToMove })}
          >
            Noirs
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Roques possibles</span>
        <div className="castling">
          {(["K", "Q", "k", "q"] as const).map((flag) => (
            <label key={flag} className="checkbox">
              <input
                type="checkbox"
                checked={meta.castling.includes(flag)}
                onChange={() => toggleCastle(flag)}
              />
              {CASTLE_LABELS[flag]}
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

const CASTLE_LABELS: Record<"K" | "Q" | "k" | "q", string> = {
  K: "Blanc O-O",
  Q: "Blanc O-O-O",
  k: "Noir O-O",
  q: "Noir O-O-O",
};
