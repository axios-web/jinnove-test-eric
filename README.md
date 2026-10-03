# 🌲 Toitures Boréal — Estimateur de Soumission & Intégration WordPress / CRM

[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin_PHP-21759b?style=for-the-badge&logo=wordpress)](https://wordpress.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

Solution complète et clé en main développée pour **Toitures Boréal**, maître-couvreur certifié sur la Rive-Nord de Montréal (Laval, Blainville, Saint-Jérôme, Terrebonne, Mirabel, etc.).

> 🎉 **Statut du projet : Tous les niveaux (Niveau 1, Niveau 2 et Niveau 3) sont 100 % terminés, testés et opérationnels.**

---

## 📑 Table des Matières

- [1. Résumé du Développement par Niveau](#1-résumé-du-développement-par-niveau)
  - [🌟 Niveau 1 : L'Estimateur Multi-étapes (Client Next.js)](#-niveau-1--lestimateur-multi-étapes-client-nextjs)
  - [🚀 Niveau 2 : L'API, Supabase & Le CRM Webhook](#-niveau-2--lapi-supabase--le-crm-webhook)
  - [🔌 Niveau 3 : L'Intégration WordPress, CPT Réalisations & REST API](#-niveau-3--lintégration-wordpress-cpt-réalisations--rest-api)
- [2. Moteur de Calcul Tarifaire Pure Function (`lib/pricing.ts`)](#2-moteur-de-calcul-tarifaire-pure-function-libpricingts)
- [3. Liste des Commandes Next.js, Supabase et WP-CLI](#3-liste-des-commandes-nextjs-supabase-et-wp-cli)
  - [💻 Commandes Next.js](#-commandes-nextjs)
  - [🗄️ Commandes Supabase CLI](#-commandes-supabase-cli)
  - [⚙️ Commandes WordPress (WP-CLI)](#️-commandes-wordpress-wp-cli)
- [4. Architecture & Arborescence du Projet](#4-architecture--arborescence-du-projet)
- [5. Variables d'Environnement](#5-variables-denvironnement)
- [6. Guide d'Intégration Elementor & WordPress](#6-guide-dintégration-elementor--wordpress)

---

## 1. Résumé du Développement par Niveau

### 🌟 Niveau 1 : L'Estimateur Multi-étapes (Client Next.js)

L'estimateur interactif offre une expérience fluide, instantanée et accessible (*mobile-first*) pour calculer le coût précis d'un projet de toiture :

* **Étape 1 — Spécifications du projet** :
  * **Type de projet** : *Remplacement complet*, *Réparation*, *Nouvelle construction*.
  * **Matériau** : *Bardeaux d'asphalte* (6,50 $/pi²), *Tôle architecturale* (11,00 $/pi²), *Membrane élastomère* (9,00 $/pi²).
  * **Superficie en pi²** : Sélecteur numérique et curseur fluide avec validation stricte de **300 à 10 000 pi²**.
  * **Pente du toit** : *Faible* (≤ 4/12, multiplicateur ×1,00), *Moyenne* (5/12 à 8/12, multiplicateur ×1,15), *Forte* (≥ 9/12, multiplicateur ×1,35).
  * **Option démolition** (1,75 $/pi²) : Conditionnelle, disponible et sélectionnable **uniquement** pour un *remplacement complet* (désactivée et réinitialisée automatiquement pour les autres types).
* **Étape 2 — Décomposition financière instantanée** :
  * Recalcul en temps réel dès la moindre interaction avec mise à jour bidirectionnelle lors du retour en arrière.
  * Affichage détaillé du **sous-total estimé**, de la **fourchette de prix (±10 %)**, de la **TPS (5 %)**, de la **TVQ (9,975 %)** et du **Total TTC**.
  * Application stricte du **plancher minimum garanti de 750,00 $**.
  * Formatage monétaire québécois conforme (ex. `13 837,50 $`).
* **Étape 3 — Coordonnées du prospect** :
  * Champs : Nom complet, courriel, téléphone québécois, ville (Laval, Blainville, Saint-Jérôme, etc.) et message facultatif.
  * Validation côté client avec **Zod** et retours d'erreur explicites en français.
* **Étape 4 — Récépissé de confirmation** :
  * Récépissé complet avec identifiant de dossier unique (ex. `TB-2026-X89K`) et récapitulatif des choix.
* **Architecture UI** :
  * Logique de calcul isolée dans une **fonction pure** ([`calculateRoofingEstimate`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/lib/pricing.ts)).
  * Composants [shadcn/ui](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/components/ui/) (`Card`, `Button`, `Slider`, `Switch`, `Badge`, `Progress`, `Input`, `Textarea`).

---

### 🚀 Niveau 2 : L'API, Supabase & Le CRM Webhook

Une infrastructure backend sécurisée, performante et tolérante aux pannes pour le traitement des leads :

* **Route API [`/api/leads`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/app/api/leads/route.ts) (POST)** :
  * Revalidation serveur exhaustive avec Zod.
  * **Recalcul obligatoire de l'estimation côté serveur** via la fonction pure pour écarter toute altération cliente du prix.
* **Transmission au Webhook CRM externe** :
  * Envoi du lead au webhook externe configuré via la variable `CRM_WEBHOOK_URL` (format JSON enrichi).
  * Endpoint local de simulation [`/api/mock-crm`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/app/api/mock-crm/route.ts) fourni pour les tests d'intégration.
* **Résilience et Tolérance aux Erreurs** :
  * Si le CRM distant échoue ou renvoie une erreur HTTP 5xx/4xx, le lead est tout de même persisté en base de données Supabase avec le statut `failed`.
  * L'utilisateur reçoit un message clair et rassurant avec son numéro de suivi, sans interruption ni écran blanc.
* **Tableau de Bord Administrateur [`/admin/leads`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/app/admin/leads/page.tsx)** :
  * Visualisation de l'ensemble des soumissions dans un tableau shadcn.
  * **Filtres** : Par type de projet (*Remplacement*, *Réparation*, *Nouvelle construction*) et par statut CRM (*Envoyé*, *Échec*, *En attente*).
  * **Bouton de relance manuelle (Retry CRM)** : Permet de renvoyer en un clic un lead en échec vers le webhook CRM via [`/api/leads/[id]/retry-crm`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/app/api/leads/[id]/retry-crm/route.ts).
  * **Export CSV** instantané des soumissions.

---

### 🔌 Niveau 3 : L'Intégration WordPress, CPT Réalisations & REST API

Toutes les fonctionnalités du Niveau 3 sont entièrement implémentées dans le plugin WordPress dédié situé dans [`wordpress-plugin/boreal-estimateur/`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/wordpress-plugin/boreal-estimateur/) :

* **Affichage des 5 derniers articles de l'API REST WordPress (`/wp-json/wp/v2/posts`)** :
  * Géré via la classe PHP [`Boreal_Posts_Shortcode`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/wordpress-plugin/boreal-estimateur/includes/class-posts-shortcode.php) et le shortcode `[wp_api_posts count="5"]`.
  * Source par défaut : `https://wordpress.org/news/wp-json/wp/v2/posts` (personnalisable via l'attribut `url` ou `endpoint`).
  * Affiche : **titre**, **date formatée en français**, **extrait nettoyé de toute balise HTML** (`wp_strip_all_tags`, `html_entity_decode`), **image à la une** et **lien direct vers l'article**.
  * **Mise en cache & revalidation** : Utilise l'API des Transients de WordPress avec expiration configurable (1h / 3600s par défaut).
* **Custom Post Type WordPress `realisation` (`/realisations`)** :
  * Enregistré via la classe [`Boreal_Realisations_CPT`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/wordpress-plugin/boreal-estimateur/includes/class-realisations-cpt.php).
  * Crée l'entité native `/realisations` dans l'admin WordPress avec colonnes personnalisées (*ID distant API*, *Lien distant*, *Date de dernière synchronisation*).
* **Synchronisation automatisée WP-Cron & Contrôle Anti-Doublons** :
  * Gérée par la classe [`Boreal_Realisations_Sync`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/wordpress-plugin/boreal-estimateur/includes/class-realisations-sync.php).
  * Tâche planifiée WP-Cron périodique (`boreal_sync_realisations_cron` : horaire, 6h, biquotidienne, quotidienne).
  * **Contrôle anti-doublons rigoureux** basé sur la métadonnée unique `_remote_post_id` (ignore les publications déjà présentes et met à jour celles dont le contenu source a été modifié).
  * Page d'administration dédiée dans **WordPress > Réalisations > Synchronisation API** avec historique des imports et bouton *« Synchroniser maintenant »*.
* **Intégration de l'Estimateur dans WordPress / Elementor** :
  * Shortcode `[boreal_estimateur]` insérant l'iframe vers la route Next.js `/embed`.
  * **Auto-redimensionnement dynamique sans scrollbar** : Communication bidirectionnelle via `window.parent.postMessage` (`BOREAL_RESIZE` et `BOREAL_SCROLL_TOP`) captée par [`boreal-iframe-resizer.js`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/wordpress-plugin/boreal-estimateur/assets/js/boreal-iframe-resizer.js).
  * Page de réglages dans **WordPress > Réglages > Estimateur Boréal** pour modifier l'URL cible de l'application.

---

## 2. Moteur de Calcul Tarifaire Pure Function (`lib/pricing.ts`)

La logique de tarification est strictement isolée dans la fonction pure [`calculateRoofingEstimate`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/lib/pricing.ts), exécutable sans effet de bord côté client et côté serveur.

### Barèmes & Formules de Calcul

```
1. base = superficie × taux_matériau × multiplicateur_pente
2. démolition = superficie × 1,75 $  (si cochée ET remplacement complet, sinon 0)
3. sous_total_brut = (base + démolition) × facteur_type_projet
4. sous_total = Math.max(750, sous_total_brut)  [Plancher minimum garanti : 750,00 $]
5. fourchette = [sous_total × 0,90 ; sous_total × 1,10]
6. TPS = sous_total × 5,00 %
7. TVQ = sous_total × 9,975 %
8. total_TTC = sous_total + TPS + TVQ
```

| Matériau | Taux unitaire |
| :--- | :--- |
| **Bardeaux d'asphalte** | 6,50 $/pi² |
| **Tôle architecturale** | 11,00 $/pi² |
| **Membrane élastomère** | 9,00 $/pi² |

| Pente du toit | Multiplicateur |
| :--- | :--- |
| **Faible (≤ 4/12)** | × 1,00 |
| **Moyenne (5/12 à 8/12)** | × 1,15 |
| **Forte (≥ 9/12)** | × 1,35 |

| Type de projet | Facteur | Démolition permise |
| :--- | :--- | :--- |
| **Remplacement complet** | × 1,00 | Oui (+1,75 $/pi²) |
| **Réparation** | × 0,35 | Non (0 $) |
| **Nouvelle construction** | × 0,90 | Non (0 $) |

---

## 3. Liste des Commandes Next.js, Supabase et WP-CLI

### 💻 Commandes Next.js

```bash
# 1. Installer les dépendances du projet
npm install

# 2. Lancer le serveur de développement local (Turbopack sur http://localhost:3000)
npm run dev

# 3. Compiler pour la production et valider les types TypeScript
npm run build

# 4. Démarrer le serveur de production compilé
npm run start

# 5. Exécuter l'analyseur de code ESLint
npm run lint
```

---

### 🗄️ Commandes Supabase CLI

Toutes les migrations SQL et configurations de base sont versionnées dans `supabase/`.

```bash
# 1. Démarrer l'instance locale Supabase (PostgreSQL, Auth, Studio sur http://localhost:54323)
npx supabase start

# 2. Consulter le statut et les identifiants locaux
npx supabase status

# 3. Appliquer les migrations locales en attente
npx supabase migration up

# 4. Réinitialiser la base locale et réinjecter les données de démonstration (seed.sql)
npx supabase db reset

# 5. Créer une nouvelle migration SQL horodatée
npx supabase migration new nom_de_la_migration

# 6. Générer automatiquement les définitions TypeScript du schéma
npx supabase gen types typescript --local > lib/types/database.types.ts

# 7. Lier le projet local à une instance Supabase Cloud
npx supabase link --project-ref <project-id>

# 8. Déployer les migrations vers Supabase Cloud en production
npx supabase db push

# 9. Arrêter l'environnement Supabase local
npx supabase stop
```

---

### ⚙️ Commandes WordPress (WP-CLI)

Commandes CLI fournies par le plugin [`boreal-estimateur`](file:///Users/benutzer/Local/Jinnove/test-eric/toitures-boreal/wordpress-plugin/boreal-estimateur/) :

```bash
# Synchroniser manuellement les 5 derniers articles depuis la REST API WordPress
wp boreal sync-posts --count=5

# Forcer la synchronisation avec une URL d'API spécifique
wp boreal sync-posts --endpoint="https://wordpress.org/news/wp-json/wp/v2/posts" --count=10 --force
```

---

## 4. Architecture & Arborescence du Projet

```
toitures-boreal/
├── app/
│   ├── (site)/
│   │   ├── layout.tsx             # En-tête et pied de page publics
│   │   └── page.tsx               # Page d'accueil publique avec Estimateur Boréal
│   ├── admin/
│   │   └── leads/
│   │       └── page.tsx           # Niveau 2: Dashboard CRM shadcn, filtres, retry, CSV
│   ├── api/
│   │   ├── leads/
│   │   │   ├── route.ts           # Niveau 2: POST lead, recalcul serveur, Supabase & CRM
│   │   │   └── [id]/retry-crm/
│   │   │       └── route.ts       # Endpoint de relance manuelle CRM
│   │   └── mock-crm/
│   │       └── route.ts           # Mock CRM pour tests et simulations locales
│   ├── embed/
│   │   └── page.tsx               # Route iframe isolée pour WordPress / Elementor
│   ├── globals.css                # Design tokens Tailwind CSS v4 (palette OKLCH)
│   └── layout.tsx                 # Layout racine (Geist fonts, QueryClientProvider)
├── components/
│   ├── embed/
│   │   └── embed-resizer.tsx      # ResizeObserver postMessage vers WordPress
│   ├── estimator/
│   │   ├── estimator-container.tsx # Orchestrateur multi-étapes et barre de progression
│   │   └── steps/
│   │       ├── step-project.tsx     # Étape 1 : Spécifications du projet
│   │       ├── step-estimate.tsx    # Étape 2 : Décomposition tarifaire & taxes
│   │       ├── step-contact.tsx     # Étape 3 : Coordonnées et validation Zod
│   │       └── step-confirmation.tsx# Étape 4 : Récépissé avec réf TB-2026-XXXX
│   ├── layout/
│   │   ├── site-header.tsx        # En-tête avec appel rapide (450) 555-TOIT
│   │   └── site-footer.tsx        # Pied de page officiel et territoires desservis
│   └── ui/                        # Composants shadcn/ui
├── lib/
│   ├── pricing.ts                 # FONCTION PURE DE CALCUL TARIFAIRE
│   ├── types/
│   │   └── estimator.ts           # Types TypeScript stricts
│   ├── validations/
│   │   └── estimator.ts           # Schémas Zod avec messages d'erreur en français
│   └── supabase/                  # Clients Supabase navigateur et serveur SSR
├── supabase/
│   ├── migrations/                # Migration SQL : table leads, index, triggers
│   ├── seed.sql                   # Jeu d'essai : 5 leads réalistes de la Rive-Nord
│   └── config.toml                # Configuration Supabase CLI locale
└── wordpress-plugin/
    └── boreal-estimateur/         # NIVEAU 3: PLUGIN WORDPRESS OFFICIEL
        ├── boreal-estimateur.php  # Déclaration du plugin, réglages et shortcode [boreal_estimateur]
        ├── includes/
        │   ├── class-realisations-cpt.php   # Enregistrement du CPT Réalisations (/realisations)
        │   ├── class-realisations-sync.php  # Synchronisation REST API, WP-Cron et WP-CLI
        │   └── class-posts-shortcode.php    # Shortcode [wp_api_posts] avec cache Transients
        └── assets/
            ├── js/boreal-iframe-resizer.js  # Script d'auto-redimensionnement iframe
            ├── css/boreal-iframe.css        # Styles iframe
            └── css/boreal-posts.css         # Styles de la grille des réalisations
```

---

## 5. Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet en vous basant sur `.env.example` :

```env
# Configuration Supabase (Locale ou Cloud)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Webhook CRM externe (ex. webhook.site ou CRM distant)
CRM_WEBHOOK_URL=http://localhost:3000/api/mock-crm
```

---

## 6. Guide d'Intégration Elementor & WordPress

### 1. Installation du Plugin WordPress
1. Copiez le dossier `wordpress-plugin/boreal-estimateur` dans `wp-content/plugins/` de votre site WordPress.
2. Activez le plugin **Toitures Boréal - Estimateur de Soumission** dans l'administration WordPress.

### 2. Intégration de l'Estimateur dans Elementor
1. Ouvrez une page avec Elementor.
2. Glissez un widget **« Shortcode »** (ou « Code court »).
3. Insérez le shortcode suivant :
   ```text
   [boreal_estimateur]
   ```
4. Optionnel avec paramètres :
   ```text
   [boreal_estimateur url="https://votre-app.vercel.app/embed" min_height="700px"]
   ```

### 3. Affichage des Réalisations (REST API / CPT)
* **Afficher les 5 derniers articles de l'API REST** (avec cache 1h et nettoyage HTML) :
  ```text
  [wp_api_posts count="5" url="https://wordpress.org/news"]
  ```
* **Afficher les réalisations importées en BDD locale (CPT)** :
  ```text
  [boreal_realisations count="5"]
  ```

---

## 📜 Licence & Droits

Propriété exclusive de **Toitures Boréal** — Tous droits réservés.  
Conçu selon les exigences des entrepreneurs-couvreurs du Québec (RBQ, Rive-Nord de Montréal).
