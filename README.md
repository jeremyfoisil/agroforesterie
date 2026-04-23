# agroforesterie

Simulateur de tarification Kermap × Earthworm — suivi des projets d'agroforesterie par télédétection.

Application Vite + Vue 3 permettant d'importer des shapefiles de projets, de simuler les coûts (abonnement, initialisation, suivi triennal / suivi annuel Pléiades Neo) et de projeter l'évolution 2020 → 2050.

## Stack

- **Vue 3** (`<script setup>`) + **Vite 6**
- **Supabase** (persistance projets et paramètres de tarification)
- **Leaflet** (cartes) + **shpjs** (lecture shapefile) + **Turf** (buffer / convex hull / consolidation AOIs)
- **Chart.js** (donut, barres, courbes de projection)

## Prérequis

- Node.js 18+ et npm
- Un projet Supabase avec les tables `projets_agroforesterie`, `parametres_tarification`, `dept_ortho_disponibilites`

## Installation

```bash
cd vue
cp .env.example .env   # puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm install
```

## Commandes

```bash
npm run dev       # serveur de dev (http://localhost:5173)
npm run build     # build de production dans dist/
npm run preview   # sert le build de production
npm run lint      # ESLint sur src/
```

## Variables d'environnement

Copier `vue/.env.example` vers `vue/.env` et renseigner :

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase — visible dans le bundle ; la sécurité repose sur les RLS policies |
| `VITE_SETTINGS_PASSWORD` | Mot de passe du panneau « Paramètres de tarification » — protection cosmétique uniquement |

## Structure

```
vue/
├── src/
│   ├── App.vue                       # Composant racine (layout, cartes, charts, CRUD projets)
│   ├── main.js                       # Bootstrap
│   ├── constants.js                  # Palette, plage d'années, styles départements
│   ├── lib/supabase.js               # Client Supabase (lit les env vars)
│   ├── utils/
│   │   ├── format.js                 # fmt / fmtN / fmtLen / defaultSuiviYears
│   │   ├── pricing.js                # computeShpPrice
│   │   └── geo.js                    # haversineM / geomLength / AOIs / consolidation
│   └── components/
│       ├── YearTimeline.vue          # Frise 2020-2050 avec pills init/suivi
│       ├── PasswordModal.vue         # Modal de déverrouillage des paramètres
│       ├── ColorPickerPopup.vue      # Popup palette + picker hex
│       └── EditProjectModal.vue      # Modal d'édition d'un projet
├── index.html
├── vite.config.js
├── eslint.config.js
└── package.json
```

## Prototype autonome

[`simulateur-agroforesterie.html`](simulateur-agroforesterie.html) à la racine est la version mono-fichier HTML d'origine (prototype, conservée pour référence).
