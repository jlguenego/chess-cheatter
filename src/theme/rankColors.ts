/**
 * Couleurs de classement des suggestions moteur (rangs 1→3 + fallback).
 * Source unique partagée entre les flèches de l'échiquier (App) et les
 * pastilles du panneau (SuggestionsPanel). Alignées sur
 * spec/ux/design-tokens.json → color.palette.rank.
 */
export const RANK_COLORS = ["#2e9e5b", "#c9a227", "#c96a27"] as const;

export const RANK_FALLBACK = "#888888";

/** Renvoie la couleur du rang `i` (0-indexé), avec fallback au-delà du rang 3. */
export function rankColor(i: number): string {
  return RANK_COLORS[i] ?? RANK_FALLBACK;
}
