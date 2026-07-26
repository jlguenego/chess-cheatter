/**
 * Générateur de design tokens (chess-cheater).
 *
 * Lit les token sets DTCG de spec/ux/tokens/ (ref / sys / comp + theme/light)
 * via Style Dictionary et produit deux artefacts consommés par l'app :
 *   - src/tokens.gen.css        → variables CSS (:root = dark, [data-theme=light] = overrides)
 *   - src/theme/rankColors.gen.ts → couleurs de rang résolues en hex (usage JS, pas de var())
 *
 * Lancer avec : bun run tokens
 * NE PAS éditer les fichiers .gen.* à la main.
 */
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import StyleDictionary from "style-dictionary";

const TOKENS = "spec/ux/tokens";
const REF = `${TOKENS}/ref.tokens.json`;
const SYS = `${TOKENS}/sys.tokens.json`;
const COMP = `${TOKENS}/comp.tokens.json`;
const LIGHT = `${TOKENS}/theme/light.tokens.json`;
const WARM80S = `${TOKENS}/theme/warm80s.tokens.json`;
const TMP = ".tokens-tmp";

/**
 * Nom de variable CSS : on joint le chemin du token au tiret en retirant les
 * segments purement structurels. Ex :
 *   sys.color.on-primary.default → sys-color-on-primary  (feuille `default` = valeur par défaut d'un rôle)
 *   sys.color.surface.base       → sys-color-surface     (feuille `base` = conteneur de base d'une surface)
 *   ref.font.family.sans         → ref-font-sans         (`family` = regroupement DTCG pur)
 * `base` n'est retiré que sous `surface` : ailleurs c'est un nom d'échelle légitime (ref.font.size.base).
 */
StyleDictionary.registerTransform({
  name: "name/tokens-css",
  type: "name",
  transform: (token) => {
    const path = [...token.path];
    if (path.at(-1) === "default") path.pop();
    if (path.at(-1) === "base" && path.at(-2) === "surface") path.pop();
    return path.filter((p) => p !== "family").join("-");
  },
});

/** Format TS : couleurs de rang (sys.color.rank) résolues en littéraux hex. */
StyleDictionary.registerFormat({
  name: "ts/rank-colors",
  format: ({ dictionary }) => {
    const val = (path: string): string => {
      const t = dictionary.allTokens.find((tk) => tk.path.join(".") === path);
      if (!t) throw new Error(`Token introuvable : ${path}`);
      return String(t.value ?? t.$value);
    };
    const colors = [val("sys.color.rank.1"), val("sys.color.rank.2"), val("sys.color.rank.3")];
    const fallback = val("sys.color.rank.fallback");
    return [
      "/**",
      " * GÉNÉRÉ par scripts/build-tokens.ts depuis spec/ux/tokens/ — NE PAS ÉDITER.",
      " * Couleurs de classement des suggestions moteur (sys.color.rank → ref.color.rank),",
      " * résolues en chaînes hex littérales (les flèches/pastilles n'acceptent pas var()).",
      " */",
      `export const RANK_COLORS = [${colors.map((c) => JSON.stringify(c)).join(", ")}] as const;`,
      "",
      `export const RANK_FALLBACK = ${JSON.stringify(fallback)};`,
      "",
    ].join("\n");
  },
});

/** Transforms CSS : noms maison + hex 6 chiffres + familles de police jointes. */
const CSS_TRANSFORMS = ["attribute/cti", "name/tokens-css", "color/hex", "fontFamily/css"];

/**
 * Exclusions du bloc :root :
 *   - sys.color.rank.* → consommé côté JS (rankColors.gen.ts), inutile en CSS.
 *   - sys.breakpoint.* → les media queries n'acceptent pas var(), donc piège.
 */
const cssBaseFilter = (token: { path: string[] }): boolean => {
  const [a, b, c] = token.path;
  if (a === "sys" && b === "breakpoint") return false;
  if (a === "sys" && b === "color" && c === "rank") return false;
  return true;
};

// --- Bloc de base :root (thème par défaut = dark) + rankColors.gen.ts ---
// warnings désactivés : la fusion des 3 fichiers déclenche une « collision » sur
// leur $description racine (métadonnée de doc par tier) — bénin, sans effet sur la sortie.
const base = new StyleDictionary({
  source: [REF, SYS, COMP],
  log: { warnings: "disabled" },
  platforms: {
    css: {
      transforms: CSS_TRANSFORMS,
      buildPath: `${TMP}/`,
      files: [
        {
          destination: "base.css",
          format: "css/variables",
          filter: cssBaseFilter,
          options: { outputReferences: true, selector: ":root", showFileHeader: false },
        },
      ],
    },
    ts: {
      transforms: ["attribute/cti", "name/tokens-css", "color/hex"],
      buildPath: "src/theme/",
      files: [{ destination: "rankColors.gen.ts", format: "ts/rank-colors" }],
    },
  },
});

// --- Bloc [data-theme=light] : uniquement les rôles surchargés ---
// warnings désactivés : on émet volontairement des var(--ref-*) vers des primitives
// définies dans :root (hors de ce bloc filtré) — elles résolvent par cascade au runtime.
const light = new StyleDictionary({
  include: [REF, SYS, COMP],
  source: [LIGHT],
  log: { warnings: "disabled" },
  platforms: {
    css: {
      transforms: CSS_TRANSFORMS,
      buildPath: `${TMP}/`,
      files: [
        {
          destination: "light.css",
          format: "css/variables",
          filter: (token) => token.isSource,
          options: {
            outputReferences: true,
            selector: '[data-theme="light"]',
            showFileHeader: false,
          },
        },
      ],
    },
  },
});

// --- Bloc [data-theme=warm80s] : thème chaud années 80, mêmes règles que light ---
// warnings désactivés : mêmes var(--ref-*) volontaires vers primitives hors bloc filtré.
const warm80s = new StyleDictionary({
  include: [REF, SYS, COMP],
  source: [WARM80S],
  log: { warnings: "disabled" },
  platforms: {
    css: {
      transforms: CSS_TRANSFORMS,
      buildPath: `${TMP}/`,
      files: [
        {
          destination: "warm80s.css",
          format: "css/variables",
          filter: (token) => token.isSource,
          options: {
            outputReferences: true,
            selector: '[data-theme="warm80s"]',
            showFileHeader: false,
          },
        },
      ],
    },
  },
});

await base.buildAllPlatforms();
await light.buildAllPlatforms();
await warm80s.buildAllPlatforms();

const header = `/* ============================================================
   Design tokens — GÉNÉRÉ par scripts/build-tokens.ts (bun run tokens).
   Source de vérité : spec/ux/tokens/ (DTCG : ref / sys / comp + theme/).
   NE PAS ÉDITER CE FICHIER À LA MAIN.
     :root                → thème par défaut (dark)
     [data-theme=light]   → overrides du thème clair
     [data-theme=warm80s] → overrides du thème chaud années 80
   ============================================================ */
`;

const baseCss = readFileSync(`${TMP}/base.css`, "utf8").trim();
const lightCss = readFileSync(`${TMP}/light.css`, "utf8").trim();
const warm80sCss = readFileSync(`${TMP}/warm80s.css`, "utf8").trim();
writeFileSync("src/tokens.gen.css", `${header}\n${baseCss}\n\n${lightCss}\n\n${warm80sCss}\n`);

rmSync(TMP, { recursive: true, force: true });

console.log("✓ src/tokens.gen.css");
console.log("✓ src/theme/rankColors.gen.ts");
