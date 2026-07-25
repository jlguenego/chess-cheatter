# Chess Cheater — Assistant de coups d'échecs en temps réel

## Contexte

Le projet est une application web conçue comme un outil d'assistance ("triche") pour un
joueur d'échecs affrontant un adversaire sur un **autre appareil** (partie en ligne ou sur
échiquier distant). Pendant la partie, l'utilisateur reproduit dans l'application la position
en cours, puis consulte l'analyse du moteur **Stockfish** pour savoir quel coup jouer.

L'application est **100 % front-end** : aucun serveur, aucune persistance côté back-end. Tout
le traitement (moteur d'échecs, reconnaissance IA) s'exécute dans le navigateur, ce qui garantit
confidentialité et fonctionnement hors-ligne.

## Objectif

Fournir, à partir d'une position d'échecs saisie par l'utilisateur, une recommandation de
jeu **correcte et rapide** (idéalement en quelques secondes), calculée par Stockfish exécuté
localement. La rapidité et la justesse de la suggestion sont le critère de réussite principal.

## Périmètre fonctionnel

### 1. Saisie de la position
- **Priorité 1 — Saisie manuelle :** échiquier interactif permettant de placer/déplacer les
  pièces (glisser-déposer). C'est le mode principal à livrer en premier.
- **Priorité 2 — Reconnaissance par caméra :** capture d'un échiquier réel via la webcam et
  reconnaissance automatique de la position par un **modèle IA exécuté localement dans le
  navigateur** (ex. TensorFlow.js / ONNX Runtime Web). Aucune API cloud : traitement privé et
  hors-ligne. Ce mode alimente ensuite l'échiquier manuel (résultat éditable/corrigeable).

### 2. Configuration de la partie
- L'utilisateur **choisit manuellement son camp** (blancs ou noirs) et indique à qui c'est de
  jouer.

### 3. Validation des règles
- L'échiquier valide la **légalité des coups et des positions** via une bibliothèque de règles
  (`chess.js` ou équivalent), couplée à un composant d'échiquier interactif (ex.
  `react-chessboard`).

### 4. Analyse Stockfish
- Moteur **Stockfish compilé en WebAssembly**, exécuté entièrement dans le navigateur (idéalement
  dans un Web Worker pour ne pas bloquer l'UI).
- Sortie attendue : **les 3 meilleurs coups (top 3) avec leur évaluation** (score/centipions,
  et si possible mat en N). Utilisation du mode `MultiPV` de Stockfish.

### 5. Affichage des suggestions
- Rendu **combiné** :
  - **Flèche(s)** dessinée(s) sur l'échiquier pour visualiser le(s) coup(s) recommandé(s).
  - **Liste textuelle** des coups en notation, avec leur évaluation.

## Hors périmètre

- Aucun back-end, aucune base de données, aucune authentification.
- Aucune API cloud (ni pour Stockfish, ni pour la vision IA) : tout est local.
- Pas de jeu contre l'IA, pas de mode partie complète ni d'historique multi-parties (l'appli
  assiste sur une position à la fois).
- Support mobile non prioritaire (voir Utilisateurs cibles).

## Utilisateurs cibles

- Utilisateur unique, joueur d'échecs souhaitant une assistance pendant une partie jouée
  ailleurs.
- **Cible principale : desktop** (navigateur de bureau). Le responsive mobile n'est pas
  prioritaire.

## Contraintes techniques

- **Stack imposée :** React + Vite + TypeScript.
- **Moteur :** Stockfish WASM (exécution locale, Web Worker recommandé), mode MultiPV pour le
  top 3.
- **Règles d'échecs :** `chess.js` (validation légalité, gestion FEN).
- **Échiquier UI :** composant interactif type `react-chessboard` (glisser-déposer + flèches).
- **Reconnaissance caméra :** modèle IA exécuté dans le navigateur (TensorFlow.js ou ONNX
  Runtime Web) + accès `getUserMedia` à la webcam.
- **Déploiement :** site statique (peut être hébergé sur n'importe quel hébergeur statique /
  GitHub Pages), fonctionne hors-ligne une fois chargé.
- **Performance :** suggestion rendue en quelques secondes maximum ; profondeur/temps de calcul
  Stockfish à calibrer pour respecter cette contrainte.

## Critères de succès

- La suggestion de coup proposée est **correcte** (conforme à l'analyse de Stockfish) et
  affichée **rapidement** (< quelques secondes) après saisie de la position.
- Le mode manuel est pleinement fonctionnel et fiable (règles validées, top 3 + flèches).
- Le tout tourne côté navigateur sans dépendance réseau.

## Points en suspens

- **Reconnaissance caméra :** choix précis de la bibliothèque/modèle et de la source du modèle
  entraîné (échiquier). À prototyper après le mode manuel. Précision et gestion des angles de
  vue à valider.
- **Calibrage Stockfish :** profondeur cible ou temps de réflexion fixe pour tenir la contrainte
  de rapidité tout en gardant la qualité du top 3.
- **Orientation caméra :** détection automatique du côté/orientation de l'échiquier réel, ou
  correction manuelle après reconnaissance.
