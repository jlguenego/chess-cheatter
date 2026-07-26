---
description: "Use when creating or editing any web source file (TypeScript, TSX, JS, JSON, HTML, CSS, Markdown) in this project. Enforces Prettier as the single formatting authority."
name: "Formatage Prettier des fichiers web"
applyTo: "**/*.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,html,css,md}"
---

# Formatage : Prettier fait autorité

Tout fichier web de ce projet (TypeScript, TSX, JS, JSON, HTML, CSS, Markdown…) doit être formaté par **Prettier**, seule source de vérité du style de code. La configuration vit dans [.prettierrc](../../.prettierrc) (racine) ; les exclusions dans [.prettierignore](../../.prettierignore).

## Règles

- **Ne formate jamais à la main** (indentation, largeur de ligne, guillemets, virgules finales…). Laisse Prettier trancher : `bun run format` (tout le dépôt) ou `bunx prettier --write <fichier>` pour un fichier précis. Gestionnaire de paquets : **bun uniquement** (jamais `npm`/`npx`/`yarn`/`pnpm` — cf. [AGENTS.md](../../AGENTS.md)).
- **Après toute création ou édition** d'un fichier couvert par `applyTo`, laisse la sortie conforme à Prettier. Vérifie au besoin avec `bun run format:check`.
- **Ne touche pas aux fichiers exclus** par [.prettierignore](../../.prettierignore) : fichiers générés (`src/tokens.gen.css`, `src/theme/rankColors.gen.ts`), vendored (`public/engine/`), build (`dist/`), lockfile (`bun.lock`). Leur format est piloté par leur générateur, pas par Prettier.
- **Pas de style personnel réintroduit** : n'ajoute pas d'alignement ou d'espacement manuel que Prettier réécrirait. N'emploie `// prettier-ignore` que pour un cas justifié (ex. tableau aligné volontairement).
- **En cas de conflit**, Prettier l'emporte pour la mise en forme ; les règles de fond (design tokens, etc.) restent prioritaires sur le contenu.
