---
description: "Use when writing or editing React .tsx/.ts source in this project. Enforces design tokens over hard-coded colors: consume component/system CSS variables (--comp-*, --sys-*), never raw hex/rgb/hsl literals or --ref-* primitives inline."
name: "Design tokens dans les composants .tsx"
applyTo: "src/**/*.{ts,tsx}"
---

# Couleurs & design tokens (.ts / .tsx)

Source de vérité des couleurs : les token sets de [spec/ux/tokens/](../../spec/ux/tokens/) (DTCG, 3 tiers répartis en `ref.tokens.json` / `sys.tokens.json` / `comp.tokens.json`), reflétée en variables CSS dans [src/index.css](../../src/index.css) via les préfixes `--ref-*` / `--sys-*` / `--comp-*`.

## Règles

- **Jamais de littéral couleur en dur** dans le JSX/TSX (`#rrggbb`, `rgb()`, `hsl()`, noms CSS comme `red`). Consomme un token de **composant** (`--comp-*`) quand il existe, sinon un token **système** / rôle MD3 (`--sys-*`) : `var(--comp-board-light)`, `var(--sys-color-surface)`, `var(--sys-color-on-surface)`, `var(--sys-color-primary)`…
- **Ne consomme jamais les primitives** `--ref-*` directement (ni en dur, ni via `var()`). Elles ne sont là que pour alimenter les tokens système `--sys-*` (par thème) et composant `--comp-*`.
- **Privilégie le CSS** ([src/index.css](../../src/index.css)) au style inline. N'ajoute un style inline que si la valeur est dynamique ; dans ce cas, référence quand même un token :

  ```tsx
  // ✅ token composant / système
  <div style={{ backgroundColor: "var(--comp-panel-bg)" }} />
  <div style={{ backgroundColor: "var(--sys-color-surface-container)" }} />
  // ❌ littéral en dur
  <div style={{ backgroundColor: "#242830" }} />
  // ❌ primitive
  <div style={{ backgroundColor: "var(--ref-color-neutral-850)" }} />
  ```

- **Si un nouveau rôle de couleur manque**, ajoute-le d'abord comme token système `--sys-*` dans [src/index.css](../../src/index.css) (et dans le token set adéquat de [spec/ux/tokens/](../../spec/ux/tokens/)), pour les deux thèmes `dark`/`light` ; ajoute au besoin un token composant `--comp-*` qui l'alias. Puis consomme le token.

## Exception : couleurs de rang (flèches / pastilles)

Les flèches de `react-chessboard` et les pastilles de rang exigent une **chaîne de couleur littérale** (une `var()` CSS n'y est pas résolue). N'écris donc pas ces hex à la main dans les composants : importe la source unique [src/theme/rankColors.ts](../../src/theme/rankColors.ts) (`rankColor(i)`, `RANK_COLORS`, `RANK_FALLBACK`), maintenue alignée sur `sys.color.rank` (→ `ref.color.rank`) des design tokens.

```tsx
import { rankColor } from "../theme/rankColors";
// ...
<span style={{ color: rankColor(i) }} />
```
