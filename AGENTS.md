# AGENTS.md — chess-cheater

Assistant d'échecs 100 % front-end : l'utilisateur reproduit une position, Stockfish (WASM, local) suggère le top 3. Aucun back-end, aucune API cloud. Contexte détaillé : [brief.md](brief.md), [brief-clarified.md](brief-clarified.md).

## Mode de travail

Pour toute demande d'analyse, de critique ou de design/UX (mots-clés : _analyse_, _critique_, _propose_, _revois_), présente d'abord une **proposition** et attends validation avant d'éditer des fichiers. Ne bascule en implémentation que sur demande explicite.

## Gestionnaire de paquets : bun UNIQUEMENT

Ce projet utilise **bun** (v1.3.14). N'utilise JAMAIS `npm`, `npx`, `yarn` ni `pnpm`.

| Au lieu de    | Utilise        |
| ------------- | -------------- |
| `npm install` | `bun install`  |
| `npm run <x>` | `bun run <x>`  |
| `npx <outil>` | `bunx <outil>` |

## Commandes

- `bun run dev` — serveur Vite 6 (port 5173).
- `bun run tokens` — génère les design tokens (`src/tokens.gen.css` + `src/theme/rankColors.gen.ts`) via Style Dictionary à partir de [spec/ux/tokens/](spec/ux/tokens/).
- `bun run build` — `bun run tokens && tsc -b && vite build` (regen tokens + validation types + bundle).
- `bun run typecheck` — `tsc -b --noEmit`.

## Stack

React 19 + TypeScript strict + Vite 6. Règles d'échecs : `chess.js`. Échiquier : `react-chessboard` **v5**. Moteur : Stockfish 18 lite (WASM) dans un Web Worker.

## Pièges spécifiques (vérifiés)

- **Stockfish = classic Worker.** `new Worker(`${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`)` — NE PAS mettre `type: "module"`, sinon le loader ne résout pas son `.wasm`. Fichiers dans `public/engine/`. Communication UCI par `postMessage(string)`.
- **react-chessboard v5 (API ≠ v4).** Tout passe par `<Chessboard options={{...}} />` : `position`, `boardOrientation`, `arrows`, `onPieceDrop`, `onSquareRightClick`, `darkSquareStyle`/`lightSquareStyle`. Notation pièces = `wP`, `bK`.
- **Spare pieces.** `SparePiece` et `Chessboard` doivent partager un même `<ChessboardProvider options={...}>` parent (partage du DndContext @dnd-kit), sinon le glisser-déposer depuis la palette ne fonctionne pas.
- **Vite.** `base = process.env.VITE_BASE ?? "./"` (relatif → GitHub Pages). `optimizeDeps.exclude: ["stockfish"]`, `worker.format: "es"`.

## Couleurs / thème

Consomme toujours les tokens **de composant** (`--comp-*`) ou, à défaut, les rôles **système** (`--sys-*`) ; jamais les primitives (`--ref-*`) directement. Source de vérité : les token sets de [spec/ux/tokens/](spec/ux/tokens/) (`ref.tokens.json`, `sys.tokens.json`, `comp.tokens.json` — format DTCG, 3 tiers). `sys.tokens.json` est **auto-suffisant** : il porte le **thème par défaut complet (= dark)**. Les **thèmes alternatifs** sont dans [spec/ux/tokens/theme/](spec/ux/tokens/theme/) (`light.tokens.json`) et ne sont que des **overrides partiels** de `sys.color.*` (uniquement les rôles qui diffèrent du défaut). Retirer `theme/` laisse un système fonctionnel en dark. Les alias `comp` sont theme-agnostic (`{sys.color.surface…}`, sans segment de thème).

**Les CSS/TS de tokens sont GÉNÉRÉS** par [scripts/build-tokens.ts](scripts/build-tokens.ts) (Style Dictionary) — ne les édite JAMAIS à la main :

- [src/tokens.gen.css](src/tokens.gen.css) — `:root` (dark) + `[data-theme=light]` (overlays), chaînes `var()` préservées.
- [src/theme/rankColors.gen.ts](src/theme/rankColors.gen.ts) — `sys.color.rank` résolu en hex (les flèches/pastilles JS n'acceptent pas `var()`).

Workflow : **modifie uniquement les `.tokens.json`** de [spec/ux/tokens/](spec/ux/tokens/), puis lance `bun run tokens` (ou `bun run build`, qui le fait). [src/index.css](src/index.css) ne contient plus que l'`@import "./tokens.gen.css"`, les 2 règles `color-scheme` (propriété CSS, pas un token) et les règles de composants.

Conventions du générateur : nom = chemin du token en kebab, en retirant la feuille `default`, la feuille `base` **sous `surface`**, et le segment `family`. `sys.color.rank.*` et `sys.breakpoint.*` sont exclus du CSS (JS-only / media query). Les fichiers `.gen.*` sont **commités** (nécessaires à `bun run dev`).

- **Lis les token sets de [spec/ux/tokens/](spec/ux/tokens/) avant** toute proposition ou modification de couleur/thème — ils documentent l'intention (palette froide, variante `-dim` du dark, etc.).

## Fichiers clés

- [scripts/build-tokens.ts](scripts/build-tokens.ts) — générateur Style Dictionary (2 instances : base `:root` dark + light `[data-theme=light]`, concaténées en un seul CSS ; plus le TS des couleurs de rang).
- [src/engine/engine.ts](src/engine/engine.ts) — wrapper UCI Stockfish (init, MultiPV, parsing `info`/`bestmove`).
- [src/hooks/useStockfish.ts](src/hooks/useStockfish.ts) — cycle de vie du Worker côté React.
- [src/chess/fen.ts](src/chess/fen.ts) — modèle `board = Record<square, "wP">`, `buildFen`, `validateFen`, `uciToMove`, `formatScore` (éval du point de vue du trait).
- [src/components/BoardEditor.tsx](src/components/BoardEditor.tsx) — échiquier éditable + palette de pièces.

## État du projet

Phase 1 (saisie manuelle + analyse) livrée et testée. Phase 2 (reconnaissance par caméra IA ONNX) non commencée.
