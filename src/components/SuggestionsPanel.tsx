import type { LineEval } from "../engine/engine";
import { formatScore, uciToMove } from "../chess/fen";

interface SuggestionsPanelProps {
  fen: string | null;
  lines: LineEval[];
  analyzing: boolean;
  error?: string;
}

const RANK_COLORS = ["#2e9e5b", "#c9a227", "#c96a27"];

export function SuggestionsPanel({
  fen,
  lines,
  analyzing,
  error,
}: SuggestionsPanelProps) {
  return (
    <section className="panel suggestions">
      <h2>Meilleurs coups</h2>

      {error && <p className="error">{error}</p>}

      {!error && lines.length === 0 && (
        <p className="muted">
          {analyzing
            ? "Analyse en cours…"
            : "Placez une position et lancez l'analyse."}
        </p>
      )}

      <ol className="move-list">
        {lines.map((line, i) => {
          const decoded = fen ? uciToMove(fen, line.pvUci[0]) : null;
          return (
            <li key={line.multipv} className="move-row">
              <span
                className="rank-dot"
                style={{ background: RANK_COLORS[i] ?? "#888" }}
              />
              <span className="move-san">{decoded?.san ?? line.pvUci[0]}</span>
              <span className="move-score">{formatScore(line)}</span>
              <span className="move-depth">prof. {line.depth}</span>
            </li>
          );
        })}
      </ol>

      {analyzing && lines.length > 0 && (
        <p className="muted small">Analyse en cours, résultats affinés…</p>
      )}
    </section>
  );
}
