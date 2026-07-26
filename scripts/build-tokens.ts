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
import { formatHex } from "culori";

const TOKENS = "spec/ux/tokens";
const REF = `${TOKENS}/ref.tokens.json`;
const SYS = `${TOKENS}/sys.tokens.json`;
const COMP = `${TOKENS}/comp.tokens.json`;
const LIGHT = `${TOKENS}/theme/light.tokens.json`;
const WARM80S = `${TOKENS}/theme/warm80s.tokens.json`;
const WIREFRAME = `${TOKENS}/theme/wireframe2025.tokens.json`;
const TMP = ".tokens-tmp";

/**
 * Couleurs : les primitives sont authorées en OKLCH (colorSpace "oklch",
 * components [L, C, H]). On en dérive deux formes :
 *   - oklchCss → chaîne CSS `oklch(L C H)` (valeur moderne des --ref-color-*)
 *   - oklchHex → fallback sRGB en hex 6 chiffres (dérivé via culori), consommé
 *     à la fois par la double-déclaration CSS (compat navigateurs sans oklch())
 *     et par le TS des couleurs de rang (les flèches/pastilles exigent un hex).
 * Le hex n'est JAMAIS stocké dans les .tokens.json : il est toujours recalculé.
 */
type DtcgColor = { colorSpace: string; components: number[] };

const isColorObject = (v: unknown): v is DtcgColor =>
  typeof v === "object" && v !== null && "components" in v;

const oklchCss = (v: DtcgColor | string): string => {
  if (typeof v === "string") return v;
  const [l, c, h] = v.components;
  return `oklch(${l} ${c} ${h})`;
};

const oklchHex = (v: DtcgColor | string): string => {
  if (typeof v === "string") return v;
  const [l, c, h] = v.components;
  return formatHex({ mode: "oklch", l, c, h }) ?? "#000000";
};

/** Map { "--ref-color-…": hex } dérivée des primitives OKLCH (fallback CSS). */
const refColorHexMap = (): Record<string, string> => {
  const doc = JSON.parse(readFileSync(REF, "utf8"));
  const map: Record<string, string> = {};
  const walk = (node: Record<string, unknown>, path: string[]): void => {
    for (const key of Object.keys(node)) {
      if (key.startsWith("$")) continue;
      const child = node[key];
      if (child === null || typeof child !== "object") continue;
      const value = (child as Record<string, unknown>).$value;
      if (isColorObject(value)) {
        map[`--${[...path, key].join("-")}`] = oklchHex(value);
      } else {
        walk(child as Record<string, unknown>, [...path, key]);
      }
    }
  };
  walk(doc.ref.color, ["ref", "color"]);
  return map;
};

/**
 * Nom de variable CSS : on joint le chemin du token au tiret en retirant les
 * segments purement structurels. Ex :
 *   sys.color.on-primary.default → sys-color-on-primary  (feuille `default` = valeur par défaut d'un rôle)
 *   sys.color.surface.base       → sys-color-surface     (feuille `base` = conteneur de base d'une surface)
 *   ref.font.family.sans         → ref-font-sans         (`family` = regroupement DTCG pur)
 * `base` n'est retiré que sous `surface` : ailleurs c'est un nom d'échelle légitime (ref.font.size.base).
 */
/**
 * Transform couleur → CSS : rend une primitive OKLCH en `oklch(L C H)`.
 * (Le fallback sRGB est ajouté après coup par post-traitement, cf. bas de fichier.)
 */
StyleDictionary.registerTransform({
  name: "color/oklch-css",
  type: "value",
  filter: (token) => (token.$type ?? token.type) === "color",
  transform: (token) => oklchCss((token.$value ?? token.value) as DtcgColor | string),
});

/** Transform couleur → hex (JS) : convertit l'OKLCH en hex sRGB via culori. */
StyleDictionary.registerTransform({
  name: "color/hex-oklch",
  type: "value",
  filter: (token) => (token.$type ?? token.type) === "color",
  transform: (token) => oklchHex((token.$value ?? token.value) as DtcgColor | string),
});

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

/**
 * Transform durée → CSS : rend les tokens DTCG `duration` ({ value, unit }) en
 * chaîne CSS (`200ms`). Le built-in `time/seconds` ne cible que le type `time`
 * (ancien nom) et convertirait en secondes — pas ce qu'on veut ici.
 */
StyleDictionary.registerTransform({
  name: "duration/css",
  type: "value",
  filter: (token) => (token.$type ?? token.type) === "duration",
  transform: (token) => {
    const v = token.$value ?? token.value;
    return typeof v === "object" && v !== null ? `${v.value}${v.unit}` : String(v);
  },
});

/**
 * Transforms CSS : noms maison + hex 6 chiffres + dimensions ({ value, unit } →
 * `4px`/`1rem`, `size/rem` préserve l'unité) + durées + familles de police jointes.
 */
const CSS_TRANSFORMS = [
  "attribute/cti",
  "name/tokens-css",
  "color/oklch-css",
  "size/rem",
  "duration/css",
  "fontFamily/css",
];

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
      transforms: ["attribute/cti", "name/tokens-css", "color/hex-oklch"],
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

// --- Bloc [data-theme=wireframe2025] : monochrome filaire, mêmes règles que light ---
// warnings désactivés : mêmes var(--ref-*) volontaires vers primitives hors bloc filtré.
const wireframe = new StyleDictionary({
  include: [REF, SYS, COMP],
  source: [WIREFRAME],
  log: { warnings: "disabled" },
  platforms: {
    css: {
      transforms: CSS_TRANSFORMS,
      buildPath: `${TMP}/`,
      files: [
        {
          destination: "wireframe2025.css",
          format: "css/variables",
          filter: (token) => token.isSource,
          options: {
            outputReferences: true,
            selector: '[data-theme="wireframe2025"]',
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
await wireframe.buildAllPlatforms();

const header = `/* ============================================================
   Design tokens — GÉNÉRÉ par scripts/build-tokens.ts (bun run tokens).
   Source de vérité : spec/ux/tokens/ (DTCG : ref / sys / comp + theme/).
   NE PAS ÉDITER CE FICHIER À LA MAIN.
     :root                → thème par défaut (dark)
     [data-theme=light]   → overrides du thème clair
     [data-theme=warm80s] → overrides du thème chaud années 80
     [data-theme=wireframe2025] → overrides du thème filaire noir & blanc
   ============================================================ */
`;

// Double déclaration des primitives couleur : fallback sRGB (hex) puis oklch().
// Un navigateur sans support d'oklch() ignore la 2ᵉ déclaration (valeur invalide)
// et conserve le hex ; les --sys-*/--comp-* (chaînes var(--ref-color-*)) héritent
// alors du fallback par cascade. Seul le bloc :root définit des --ref-color-*.
const hexMap = refColorHexMap();
const baseCss = readFileSync(`${TMP}/base.css`, "utf8")
  .trim()
  .replace(
    /^(\s*)(--ref-color-[\w-]+):\s*(oklch\([^;]+\));/gm,
    (match, indent: string, name: string, value: string) => {
      const hex = hexMap[name];
      return hex
        ? `${indent}${name}: ${hex}; /* fallback sRGB */\n${indent}${name}: ${value};`
        : match;
    },
  );
const lightCss = readFileSync(`${TMP}/light.css`, "utf8").trim();
const warm80sCss = readFileSync(`${TMP}/warm80s.css`, "utf8").trim();
const wireframeCss = readFileSync(`${TMP}/wireframe2025.css`, "utf8").trim();
writeFileSync(
  "src/tokens.gen.css",
  `${header}\n${baseCss}\n\n${lightCss}\n\n${warm80sCss}\n\n${wireframeCss}\n`,
);

rmSync(TMP, { recursive: true, force: true });

console.log("✓ src/tokens.gen.css");
console.log("✓ src/theme/rankColors.gen.ts");
