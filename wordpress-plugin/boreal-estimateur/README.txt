=== Toitures Boréal - Estimateur de Soumission & Réalisations ===
Contributors: toituresboreal
Tags: toiture, estimateur, elementor, shortcode, iframe, soumission, quebec, rest-api, cpt, realisations
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Plugin WordPress officiel pour intégrer l'estimateur de soumission interactif Next.js et synchroniser les articles distants via l'API REST dans le CPT "Réalisations".

== Description ==

Ce plugin tout-en-un fournit deux fonctionnalités majeures :
1. **Intégration de l'estimateur Next.js** via le shortcode `[boreal_estimateur]` avec auto-redimensionnement iframe sans barre de défilement.
2. **Synchronisation REST API WordPress & CPT Réalisations** :
   - Récupère automatiquement les articles d'un site WordPress via l'API REST (`/wp-json/wp/v2/posts`, source par défaut : `https://wordpress.org/news/wp-json/wp/v2/posts`).
   - Les enregistre dans le Custom Post Type `realisation`.
   - **Contrôle anti-doublons rigoureux** basé sur l'identifiant distant unique (`_remote_post_id`) et détection des mises à jour (`_remote_modified`).
   - **Mise à jour périodique automatisée** via WP-Cron (fréquence configurable : horaire, 6h, biquotidienne, quotidienne).
   - **Interface d'administration dédiée** avec tableau de bord, statistiques et bouton « Synchroniser maintenant ».
   - **Shortcode moderne et responsive** pour afficher les 5 derniers articles (titre, date formatée, extrait nettoyé de tout HTML, lien vers l'article).

== Shortcodes ==

=== 1. Afficher les 5 derniers articles via l'API REST (/wp-json/wp/v2/posts)
Affiche le titre, la date, l'extrait nettoyé de toute balise HTML, et le lien vers l'article :
`[wp_api_posts]`

Paramètres disponibles :
* `url` : URL du site WordPress distant (défaut : `https://wordpress.org/news`).
* `count` : Nombre d'articles à afficher (défaut : `5`).
* `columns` : Nombre de colonnes de la grille (1 à 4, défaut : `3`).
* `cache` : Durée du cache Transients en secondes (défaut : `3600`).
* `source` : `api` (en direct) ou `cpt` (depuis les réalisations importées en BDD).

Exemples :
`[wp_api_posts count="5" url="https://wordpress.org/news"]`
`[wp_api_posts count="3" columns="3"]`

=== 2. Afficher les réalisations importées (CPT)
`[boreal_realisations count="5"]`
ou
`[wp_api_posts source="cpt" count="5"]`

=== 3. Estimateur de soumission
`[boreal_estimateur]`
`[boreal_estimateur url="https://soumission.toituresboreal.ca/embed" min_height="700px"]`

== Synchronisation & Contrôle Anti-Doublons ==

Le système assure l'unicité des articles grâce au méta `_remote_post_id` :
1. **Article non existant** : Création d'une nouvelle publication dans le post-type `realisation` (titre, extrait nettoyé, contenu, date d'origine, permalien distant, image mise en avant).
2. **Article existant inchangé** : L'importation ignore l'article, aucun doublon n'est créé.
3. **Article existant modifié à la source** : Le titre, l'extrait et le contenu sont mis à jour sans dupliquer l'entrée.

== Ligne de commande WP-CLI ==

Synchroniser manuellement en CLI :
`wp boreal sync-posts --count=5`
`wp boreal sync-posts --endpoint="https://wordpress.org/news/wp-json/wp/v2/posts" --count=10`
