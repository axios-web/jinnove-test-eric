<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Documentation Projet pour les Agents IA — Toitures Boréal

Ce document fournit toutes les directives architecturales, règles métier, structures de données et conventions du projet **Toitures Boréal** pour faciliter le développement de futures fonctionnalités.

---

## 1. Contexte & Objectifs Métier

* **Client** : Toitures Boréal, maître-couvreur certifié sur la Rive-Nord de Montréal (Laval, Blainville, Saint-Jérôme, Terrebonne, Mirabel, etc.).
* **Site Web principal** : Site sous WordPress + Elementor.
* **Rôle de cette application Next.js** :
  1. Offrir un **estimateur de soumission en ligne interactif**, moderne, ultra-rapide et responsive (mobile-first).
  2. Fournir une **estimation de prix instantanée et transparente** (avec calcul des taxes du Québec : TPS 5 % et TVQ 9,975 %).
  3. Capturer les coordonnées complètes du prospect (lead qualifié).
  4. Transmettre automatiquement les leads à l'API (`/api/leads`), dans la base Supabase et vers le CRM.
  5. S'intégrer parfaitement dans une page WordPress/Elementor via un plugin et un iframe à hauteur dynamique (`auto-resizing`).

---

## 2. Stack Technique & Dépendances Clés

| Composant | Technologie | Version / Détails |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Turbopack) | `16.3.8` |
| **React** | React & React DOM | `19.2.8` |
| **Langage** | TypeScript (mode strict) | `^5` |
| **Style & Thème** | Tailwind CSS v4 + `@tailwindcss/postcss` | Palette OKLCH dans `app/globals.css` |
| **Composants UI** | shadcn/ui (`base-nova`, `@base-ui/react`) | Situés dans `components/ui/` |
| **Validation** | Zod | `^4.6.5` dans `lib/validations/estimator.ts` |
| **Gestion d'état serveur** | TanStack React Query (`useMutation`) | `^5` (`components/providers/query-provider.tsx`) |
| **Base de données & Auth** | Supabase SDK & Supabase SSR | `@supabase/ssr`, `@supabase/supabase-js` |
| **Intégration WordPress** | Plugin PHP externe | `/Users/benutzer/Local/Jinnove/test-eric/wordpress/wp-content/plugins/boreal-estimateur` |

---

## 3. Règle d'Ingénierie Clé : Moteur de Calcul Isolé (`lib/pricing.ts`)

La logique de calcul tarifaire est **strictement isolée dans une fonction pure** [`calculateRoofingEstimate`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/lib/pricing.ts). Elle ne doit dépendre d'aucun état React ni hook UI afin de pouvoir être exécutée à la fois côté client et côté serveur.

### Barèmes Tarifaires Officiels :
* **Taux par Matériau** :
  * Bardeaux d'asphalte : `6,50 $/pi²`
  * Tôle : `11,00 $/pi²`
  * Membrane élastomère : `9,00 $/pi²`
* **Multiplicateur de Pente** :
  * Faible (≤ 4/12) : `× 1,00`
  * Moyenne (5/12 à 8/12) : `× 1,15`
  * Forte (≥ 9/12) : `× 1,35`
* **Facteur de Type de Projet** :
  * Remplacement complet : `× 1,00` *(seul type autorisant la démolition)*
  * Réparation : `× 0,35`
  * Nouvelle construction : `× 0,90`
* **Option Démolition** : `1,75 $/pi²` *(applicable uniquement si cochée ET projet = remplacement complet, sinon 0)*

### Formule de Calcul :
1. `base = superficie × taux du matériau × multiplicateur de pente`
2. `démolition = superficie × 1,75 $` *(si active)*
3. `sous_total_brut = (base + démolition) × facteur du type de projet`
4. `sous_total = Math.max(750, sous_total_brut)` *(Plancher minimum obligatoire : 750,00 $)*
5. `fourchette = sous_total × 0,90` à `sous_total × 1,10`
6. `TPS = 5,00 % du sous_total` (arrondi au cent)
7. `TVQ = 9,975 % du sous_total` (arrondi au cent)
8. `total_TTC = sous_total + TPS + TVQ`

---

## 4. Arborescence du Projet

```
toitures-boreal/
├── app/
│   ├── (site)/
│   │   ├── layout.tsx         # Layout avec SiteHeader et SiteFooter
│   │   └── page.tsx           # Page d'accueil publique complète avec Hero section
│   ├── embed/
│   │   └── page.tsx           # Route iframe isolée pour WordPress/Elementor (sans header/footer)
│   ├── api/
│   │   └── leads/
│   │       └── route.ts       # Endpoint POST de réception des leads validé par Zod
│   ├── globals.css            # Design tokens Tailwind v4 (OKLCH, animations, light/dark mode)
│   └── layout.tsx             # Layout racine (HTML, body, QueryProvider, Geist fonts)
├── components/
│   ├── embed/
│   │   └── embed-resizer.tsx  # Observer de redimensionnement postMessage vers WordPress
│   ├── estimator/
│   │   ├── estimator-container.tsx # Orchestrateur d'état multi-étapes et barre de progression
│   │   └── steps/
│   │       ├── step-project.tsx     # Étape 1 : Spécifications techniques du toit
│   │       ├── step-estimate.tsx    # Étape 2 : Affichage décomposé des prix et taxes
│   │       ├── step-contact.tsx     # Étape 3 : Coordonnées, validation client Zod
│   │       └── step-confirmation.tsx# Étape 4 : Récépissé avec numéro de dossier (TB-2026-XXXX)
│   ├── layout/
│   │   ├── site-header.tsx    # En-tête avec logo et appel d'urgence (450) 555-TOIT
│   │   └── site-footer.tsx    # Pied de page (garanties, municipalités de la Rive-Nord, RBQ)
│   ├── providers/
│   │   └── query-provider.tsx # TanStack QueryClientProvider
│   └── ui/                    # Composants shadcn/ui (Button, Card, Slider, Switch, Badge, etc.)
├── hooks/
│   └── use-submit-lead.ts     # Hook React Query useMutation pour la soumission à l'API
├── lib/
│   ├── pricing.ts             # FONCTION PURE DE CALCUL TARIFAIRE
│   ├── types/
│   │   └── estimator.ts       # Types et interfaces TypeScript stricts
│   ├── validations/
│   │   └── estimator.ts       # Schémas Zod avec messages d'erreur en français
│   ├── supabase/
│   │   ├── client.ts          # Client Supabase navigateur
│   │   └── server.ts          # Client Supabase SSR serveur
│   └── utils.ts               # Helper cn (clsx + tailwind-merge)
├── supabase/
│   └── config.toml            # Configuration Supabase CLI locale (port 54321)
└── next.config.ts             # En-têtes iframe (frame-ancestors *)
```

---

## 5. Intégration WordPress / Elementor

* **Emplacement du plugin WordPress** :
  `/Users/benutzer/Local/Jinnove/test-eric/wordpress/wp-content/plugins/boreal-estimateur/`
* **Shortcode** :
  `[boreal_estimateur]` ou `[boreal_estimateur url="https://domaine.ca/embed" min_height="650px"]`
* **Mécanisme d'Auto-Resizing** :
  * Le composant [`EmbedResizer`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/components/embed/embed-resizer.tsx) écoute les changements de taille dans l'iframe et émet un message `window.parent.postMessage({ type: 'BOREAL_RESIZE', height: ... }, '*')`.
  * Le script JavaScript du plugin WordPress (`assets/js/boreal-iframe-resizer.js`) ajuste dynamiquement la hauteur `iframe.style.height` en temps réel pour éliminer toute barre de défilement verticale.
  * Il gère également le défilement automatique vers le haut (`BOREAL_SCROLL_TOP`) lors des transitions d'étapes.
* **Panneau d'Administration** :
  Une page dans **WordPress > Réglages > Estimateur Boréal** permet de modifier l'URL cible de l'application sans toucher au code des pages Elementor.

---

## 6. Guide pour les Développements Futurs

Lors de l'ajout de nouvelles fonctionnalités, respectez scrupuleusement les consignes suivantes :

1. **Modification des prix ou formules** :
   * Modifiez **uniquement** [`lib/pricing.ts`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/lib/pricing.ts).
   * Mettez à jour les types dans [`lib/types/estimator.ts`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/lib/types/estimator.ts).
2. **Ajout de nouveaux champs au formulaire** :
   * Ajoutez les champs dans `lib/types/estimator.ts`.
   * Mettez à jour les schémas Zod dans [`lib/validations/estimator.ts`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/lib/validations/estimator.ts) avec des messages clairs en français.
   * Ajoutez le contrôle UI dans l'étape correspondante (`components/estimator/steps/`).
3. **Appels asynchrones & Données** :
   * Utilisez toujours **React Query** (`useQuery`, `useMutation`).
   * Validez systématiquement les payloads côté serveur dans `app/api/` avec Zod avant insertion Supabase ou appel CRM.
4. **Composants d'interface** :
   * Privilégiez les composants de `components/ui/` (shadcn/ui).
   * Préservez le design épuré, accessible, responsive et bilingue/québécois.
