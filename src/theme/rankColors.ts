/**
 * Couleurs de classement des suggestions moteur (rangs 1→3 + fallback).
 * Source unique partagée entre les flèches de l'échiquier (App) et les
 * pastilles du panneau (SuggestionsPanel).
 *
 * Les DONNÉES (hex) sont générées depuis les design tokens
 * (spec/ux/tokens/ → sys.color.rank) dans rankColors.gen.ts par
 * scripts/build-tokens.ts. Ce fichier ne porte que la logique d'accès.
 */
import { RANK_COLORS, RANK_FALLBACK } from "./rankColors.gen";

export { RANK_COLORS, RANK_FALLBACK };

/** Renvoie la couleur du rang `i` (0-indexé), avec fallback au-delà du rang 3. */
export function rankColor(i: number): string {
  return RANK_COLORS[i] ?? RANK_FALLBACK;
}
