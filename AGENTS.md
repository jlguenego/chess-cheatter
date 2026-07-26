# AGENTS.md — chess-cheater

Assistant d'échecs 100 % front-end : l'utilisateur reproduit une position, Stockfish (WASM, local) suggère le top 3. Aucun back-end, aucune API cloud. Contexte détaillé : [brief.md](brief.md), [brief-clarified.md](brief-clarified.md).

## Mode de travail

Pour toute demande d'analyse, de critique ou de design/UX (mots-clés : _analyse_, _critique_, _propose_, _revois_), présente d'abord une **proposition** et attends validation avant d'éditer des fichiers. Ne bascule en implémentation que sur demande explicite.

## Gestionnaire de paquets : bun UNIQUEMENT

Ce projet utilise **bun** (v1.3.14). N'utilise JAMAIS `npm`, `npx`, `yarn` ni `pnpm`.

| Au lieu de      | Utilise         |
| --------------- | --------------- |
| `npm install`   | `bun install`   |
| `npm run <x>`   | `bun run <x>`   |
| `npx <outil>`   | `bunx <outil>`  |

## Commandes

- `bun run dev` — serveur Vite 6 (port 5173).
- `bun run build` — `tsc -b && vite build` (à lancer pour valider les types + le bundle).
- `bun run typecheck` — `tsc -b --noEmit`.

## Stack

React 19 + TypeScript strict + Vite 6. Règles d'échecs : `chess.js`. Échiquier : `react-chessboard` **v5**. Moteur : Stockfish 18 lite (WASM) dans un Web Worker.

## Pièges spécifiques (vérifiés)

- **Stockfish = classic Worker.** `new Worker(`${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`)` — NE PAS mettre `type: "module"`, sinon le loader ne résout pas son `.wasm`. Fichiers dans `public/engine/`. Communication UCI par `postMessage(string)`.
- **react-chessboard v5 (API ≠ v4).** Tout passe par `<Chessboard options={{...}} />` : `position`, `boardOrientation`, `arrows`, `onPieceDrop`, `onSquareRightClick`, `darkSquareStyle`/`lightSquareStyle`. Notation pièces = `wP`, `bK`.
- **Spare pieces.** `SparePiece` et `Chessboard` doivent partager un même `<ChessboardProvider options={...}>` parent (partage du DndContext @dnd-kit), sinon le glisser-déposer depuis la palette ne fonctionne pas.
- **Vite.** `base = process.env.VITE_BASE ?? "./"` (relatif → GitHub Pages). `optimizeDeps.exclude: ["stockfish"]`, `worker.format: "es"`.

## Couleurs / thème

Consomme toujours les tokens **de composant** (`--comp-*`) ou, à défaut, les rôles **système** (`--sys-*` de [src/index.css](src/index.css)) ; jamais les primitives (`--ref-*`) directement. Source de vérité : les token sets de [spec/ux/tokens/](spec/ux/tokens/) (`ref.tokens.json`, `sys.tokens.json`, `comp.tokens.json` — format DTCG, 3 tiers, thèmes `dark`/`light`).

- **Lis les token sets de [spec/ux/tokens/](spec/ux/tokens/) avant** toute proposition ou modification de couleur/thème — ils documentent l'intention (palette froide, variante `-dim` du dark, etc.).
- Tout changement de token doit être répercuté dans **les deux** endroits : les token sets de [spec/ux/tokens/](spec/ux/tokens/) (source de vérité DTCG) **et** [src/index.css](src/index.css) (primitives + tokens sémantiques).

## Fichiers clés

- [src/engine/engine.ts](src/engine/engine.ts) — wrapper UCI Stockfish (init, MultiPV, parsing `info`/`bestmove`).
- [src/hooks/useStockfish.ts](src/hooks/useStockfish.ts) — cycle de vie du Worker côté React.
- [src/chess/fen.ts](src/chess/fen.ts) — modèle `board = Record<square, "wP">`, `buildFen`, `validateFen`, `uciToMove`, `formatScore` (éval du point de vue du trait).
- [src/components/BoardEditor.tsx](src/components/BoardEditor.tsx) — échiquier éditable + palette de pièces.

## État du projet

Phase 1 (saisie manuelle + analyse) livrée et testée. Phase 2 (reconnaissance par caméra IA ONNX) non commencée.
