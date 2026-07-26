// Thin wrapper around the Stockfish 18 lite single-threaded WASM engine.
// The engine file lives in `public/engine/` and is loaded as a classic Web
// Worker; it speaks the UCI protocol over `postMessage`.

export type ScoreType = "cp" | "mate";

export interface LineEval {
  /** MultiPV rank (1 = best). */
  multipv: number;
  scoreType: ScoreType;
  /**
   * For `cp`: centipawns from the side-to-move perspective.
   * For `mate`: mate in N (positive = mating, negative = getting mated).
   */
  score: number;
  depth: number;
  /** Principal variation as a list of UCI moves (e.g. ["e2e4", "e7e5"]). */
  pvUci: string[];
}

export type AnalysisLimit = { kind: "movetime"; value: number } | { kind: "depth"; value: number };

interface AnalysisCallbacks {
  onUpdate?: (lines: LineEval[]) => void;
  onDone?: (lines: LineEval[], bestmove: string | null) => void;
}

const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`;

export class StockfishEngine {
  private worker: Worker;
  private ready: Promise<void>;
  private multipv = 3;

  private lines = new Map<number, LineEval>();
  private analyzing = false;
  private callbacks: AnalysisCallbacks = {};

  /** Resolvers waiting on a specific UCI token (uciok / readyok). */
  private waiters: Array<{ token: string; resolve: () => void }> = [];

  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.worker.onmessage = (e: MessageEvent) => this.handleMessage(e.data);
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    this.send("uci");
    await this.waitFor("uciok");
    this.send("isready");
    await this.waitFor("readyok");
  }

  private send(cmd: string): void {
    this.worker.postMessage(cmd);
  }

  private waitFor(token: string): Promise<void> {
    return new Promise((resolve) => this.waiters.push({ token, resolve }));
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") return;
    const line = data;

    // Resolve any pending token waiters (uciok / readyok).
    for (let i = this.waiters.length - 1; i >= 0; i--) {
      if (line.startsWith(this.waiters[i].token)) {
        this.waiters[i].resolve();
        this.waiters.splice(i, 1);
      }
    }

    if (!this.analyzing) return;

    if (line.startsWith("info ")) {
      const parsed = parseInfoLine(line);
      if (parsed) {
        this.lines.set(parsed.multipv, parsed);
        this.callbacks.onUpdate?.(this.sortedLines());
      }
      return;
    }

    if (line.startsWith("bestmove")) {
      const best = line.split(/\s+/)[1] ?? null;
      this.analyzing = false;
      const result = this.sortedLines();
      const done = this.callbacks.onDone;
      this.callbacks = {};
      done?.(result, best && best !== "(none)" ? best : null);
    }
  }

  private sortedLines(): LineEval[] {
    return [...this.lines.values()].sort((a, b) => a.multipv - b.multipv);
  }

  async setMultiPV(n: number): Promise<void> {
    this.multipv = n;
    await this.ready;
    this.send(`setoption name MultiPV value ${n}`);
  }

  /**
   * Analyze a FEN position. Resolves once the engine reports `bestmove`.
   * Progressive results are delivered through `onUpdate`.
   */
  async analyze(
    fen: string,
    limit: AnalysisLimit,
    callbacks: AnalysisCallbacks = {},
  ): Promise<{ lines: LineEval[]; bestmove: string | null }> {
    await this.ready;

    // Cancel any in-flight analysis first.
    if (this.analyzing) {
      await this.stop();
    }

    this.lines.clear();
    this.callbacks = callbacks;
    this.analyzing = true;

    this.send(`setoption name MultiPV value ${this.multipv}`);
    this.send("ucinewgame");
    this.send(`position fen ${fen}`);
    this.send(limit.kind === "movetime" ? `go movetime ${limit.value}` : `go depth ${limit.value}`);

    return new Promise((resolve) => {
      const userDone = callbacks.onDone;
      this.callbacks.onDone = (lines, bestmove) => {
        userDone?.(lines, bestmove);
        resolve({ lines, bestmove });
      };
    });
  }

  /** Stop the current search; the engine emits `bestmove` shortly after. */
  stop(): Promise<void> {
    if (!this.analyzing) return Promise.resolve();
    return new Promise((resolve) => {
      const prev = this.callbacks.onDone;
      this.callbacks.onDone = (lines, bestmove) => {
        prev?.(lines, bestmove);
        resolve();
      };
      this.send("stop");
    });
  }

  dispose(): void {
    this.worker.terminate();
  }
}

/** Parse a single UCI `info ...` line into a LineEval, or null if incomplete. */
export function parseInfoLine(line: string): LineEval | null {
  const tokens = line.split(/\s+/);
  let multipv = 1;
  let depth = 0;
  let scoreType: ScoreType | null = null;
  let score = 0;
  let pvUci: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    switch (tokens[i]) {
      case "multipv":
        multipv = Number(tokens[++i]);
        break;
      case "depth":
        depth = Number(tokens[++i]);
        break;
      case "score":
        scoreType = tokens[++i] as ScoreType;
        score = Number(tokens[++i]);
        break;
      case "pv":
        pvUci = tokens.slice(i + 1);
        i = tokens.length;
        break;
    }
  }

  if (scoreType === null || pvUci.length === 0) return null;
  return { multipv, depth, scoreType, score, pvUci };
}
