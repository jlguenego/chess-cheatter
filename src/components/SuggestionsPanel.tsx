import type { LineEval } from "../engine/engine";
import { formatScore, uciToMove } from "../chess/fen";
import { rankColor } from "../theme/rankColors";

interface SuggestionsPanelProps {
  fen: string | null;
  lines: LineEval[];
  analyzing: boolean;
  error?: string;
}

// Fixed slots keep the panel height constant while results stream in (no layout shift).
const SLOTS = [0, 1, 2];

export function SuggestionsPanel({ fen, lines, analyzing, error }: SuggestionsPanelProps) {
  const status = error
    ? ""
    : analyzing
      ? "Analyse en cours…"
      : lines.length > 0
        ? "Analyse terminée."
        : "Placez une position et lancez l'analyse.";

  return (
    <section className="panel suggestions">
      <h2>Meilleurs coups</h2>

      {error ? (
        <p className="error">{error}</p>
      ) : (
        <ol className="move-list">
          {SLOTS.map((i) => {
            const line = lines[i];
            if (!line) {
              return (
                <li key={i} className="move-row placeholder" aria-hidden="true">
                  <span className="rank-dot" style={{ background: rankColor(i) }} />
                  <span className="move-san">—</span>
                  <span className="move-score" />
                  <span className="move-depth" />
                </li>
              );
            }
            const decoded = fen ? uciToMove(fen, line.pvUci[0]) : null;
            return (
              <li key={i} className="move-row">
                <span className="rank-dot" style={{ background: rankColor(i) }} />
                <span className="move-san">{decoded?.san ?? line.pvUci[0]}</span>
                <span className="move-score">{formatScore(line)}</span>
                <span className="move-depth">prof. {line.depth}</span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="muted small status">{status}</p>
    </section>
  );
}
