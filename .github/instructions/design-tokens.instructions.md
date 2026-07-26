---
description: "Use when writing or editing React .tsx/.ts source in this project. Enforces design tokens over hard-coded colors: consume semantic CSS variables (--color-*), never raw hex/rgb/hsl literals or --palette-* primitives inline."
name: "Design tokens dans les composants .tsx"
applyTo: "src/**/*.{ts,tsx}"
---

# Couleurs & design tokens (.ts / .tsx)

Source de vérité des couleurs : [spec/ux/design-tokens.json](../../spec/ux/design-tokens.json) (DTCG), reflétée en variables CSS dans [src/index.css](../../src/index.css).

## Règles

- **Jamais de littéral couleur en dur** dans le JSX/TSX (`#rrggbb`, `rgb()`, `hsl()`, noms CSS comme `red`). Utilise les tokens **sémantiques** (rôles Material Design 3) : `var(--color-surface)`, `var(--color-on-surface)`, `var(--color-primary)`, `var(--color-board-light)`…
- **Ne consomme jamais les primitives** `--palette-*` directement (ni en dur, ni via `var()`). Elles ne sont là que pour alimenter les tokens sémantiques `--color-*` par thème.
- **Privilégie le CSS** ([src/index.css](../../src/index.css)) au style inline. N'ajoute un style inline que si la valeur est dynamique ; dans ce cas, référence quand même un token :

  ```tsx
  // ✅ token sémantique
  <div style={{ backgroundColor: "var(--color-surface-container)" }} />
  // ❌ littéral en dur
  <div style={{ backgroundColor: "#242830" }} />
  // ❌ primitive
  <div style={{ backgroundColor: "var(--palette-neutral-850)" }} />
  ```

- **Si un nouveau rôle de couleur manque**, ajoute-le d'abord comme token sémantique `--color-*` dans [src/index.css](../../src/index.css) (et dans [spec/ux/design-tokens.json](../../spec/ux/design-tokens.json)), pour les deux thèmes `dark`/`light`, puis consomme le token.

## Exception : couleurs de rang (flèches / pastilles)

Les flèches de `react-chessboard` et les pastilles de rang exigent une **chaîne de couleur littérale** (une `var()` CSS n'y est pas résolue). N'écris donc pas ces hex à la main dans les composants : importe la source unique [src/theme/rankColors.ts](../../src/theme/rankColors.ts) (`rankColor(i)`, `RANK_COLORS`, `RANK_FALLBACK`), maintenue alignée sur `color.palette.rank` des design tokens.

```tsx
import { rankColor } from "../theme/rankColors";
// ...
<span style={{ color: rankColor(i) }} />
```
