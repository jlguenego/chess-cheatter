import type { AnalysisLimit } from "../engine/engine";

export type LimitMode = "movetime" | "depth";

interface EngineControlsProps {
  mode: LimitMode;
  movetimeMs: number;
  depth: number;
  analyzing: boolean;
  canAnalyze: boolean;
  onModeChange: (mode: LimitMode) => void;
  onMovetimeChange: (ms: number) => void;
  onDepthChange: (depth: number) => void;
  onAnalyze: () => void;
  onStop: () => void;
}

export function buildLimit(mode: LimitMode, movetimeMs: number, depth: number): AnalysisLimit {
  return mode === "movetime"
    ? { kind: "movetime", value: movetimeMs }
    : { kind: "depth", value: depth };
}

export function EngineControls({
  mode,
  movetimeMs,
  depth,
  analyzing,
  canAnalyze,
  onModeChange,
  onMovetimeChange,
  onDepthChange,
  onAnalyze,
  onStop,
}: EngineControlsProps) {
  return (
    <section className="panel engine-controls">
      <h2>Analyse</h2>

      <div className="field">
        <span className="field-label">Limite de calcul</span>
        <div className="segmented">
          <button
            className={mode === "movetime" ? "active" : ""}
            onClick={() => onModeChange("movetime")}
          >
            Temps
          </button>
          <button
            className={mode === "depth" ? "active" : ""}
            onClick={() => onModeChange("depth")}
          >
            Profondeur
          </button>
        </div>
      </div>

      {mode === "movetime" ? (
        <div className="field">
          <span className="field-label">Temps par coup : {(movetimeMs / 1000).toFixed(1)} s</span>
          <input
            type="range"
            aria-label="Temps par coup en millisecondes"
            min={200}
            max={5000}
            step={100}
            value={movetimeMs}
            onChange={(e) => onMovetimeChange(Number(e.target.value))}
          />
        </div>
      ) : (
        <div className="field">
          <span className="field-label">Profondeur : {depth}</span>
          <input
            type="range"
            aria-label="Profondeur de recherche"
            min={6}
            max={26}
            step={1}
            value={depth}
            onChange={(e) => onDepthChange(Number(e.target.value))}
          />
        </div>
      )}

      <div className="analyze-actions">
        {analyzing ? (
          <button className="primary stop" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button className="primary" onClick={onAnalyze} disabled={!canAnalyze}>
            Analyser
          </button>
        )}
      </div>
    </section>
  );
}
