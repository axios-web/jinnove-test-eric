<?php
/**
 * Custom Post Type: Realisation
 *
 * @package Boreal_Estimateur
 */

if (!defined('ABSPATH')) {
    exit;
}

class Boreal_Realisations_CPT {

    const POST_TYPE = 'realisation';

    /**
     * Initialize CPT hooks
     */
    public static function init() {
        add_action('init', array(__CLASS__, 'register_post_type'));
        add_filter('manage_' . self::POST_TYPE . '_posts_columns', array(__CLASS__, 'custom_admin_columns'));
        add_action('manage_' . self::POST_TYPE . '_posts_custom_column', array(__CLASS__, 'render_admin_columns'), 10, 2);
    }

    /**
     * Register the custom post type
     */
    public static function register_post_type() {
        $labels = array(
            'name'                  => _x('Réalisations', 'Post Type General Name', 'boreal-estimateur'),
            'singular_name'         => _x('Réalisation', 'Post Type Singular Name', 'boreal-estimateur'),
            'menu_name'             => __('Réalisations', 'boreal-estimateur'),
            'name_admin_bar'        => __('Réalisation', 'boreal-estimateur'),
            'archives'              => __('Archives des réalisations', 'boreal-estimateur'),
            'attributes'            => __('Attributs de la réalisation', 'boreal-estimateur'),
            'parent_item_colon'     => __('Réalisation parente :', 'boreal-estimateur'),
            'all_items'             => __('Toutes les réalisations', 'boreal-estimateur'),
            'add_new_item'          => __('Ajouter une nouvelle réalisation', 'boreal-estimateur'),
            'add_new'               => __('Ajouter une réalisation', 'boreal-estimateur'),
            'new_item'              => __('Nouvelle réalisation', 'boreal-estimateur'),
            'edit_item'             => __('Modifier la réalisation', 'boreal-estimateur'),
            'update_item'           => __('Mettre à jour la réalisation', 'boreal-estimateur'),
            'view_item'             => __('Voir la réalisation', 'boreal-estimateur'),
            'view_items'            => __('Voir les réalisations', 'boreal-estimateur'),
            'search_items'          => __('Rechercher des réalisations', 'boreal-estimateur'),
            'not_found'             => __('Aucune réalisation trouvée', 'boreal-estimateur'),
            'not_found_in_trash'    => __('Aucune réalisation trouvée dans la corbeille', 'boreal-estimateur'),
            'featured_image'        => __('Image mise en avant', 'boreal-estimateur'),
            'set_featured_image'    => __('Définir l\'image mise en avant', 'boreal-estimateur'),
            'remove_featured_image' => __('Supprimer l\'image mise en avant', 'boreal-estimateur'),
            'use_featured_image'    => __('Utiliser comme image mise en avant', 'boreal-estimateur'),
        );

        $args = array(
            'label'                 => __('Réalisation', 'boreal-estimateur'),
            'description'           => __('Publications importées et réalisations Toitures Boréal', 'boreal-estimateur'),
            'labels'                => $labels,
            'supports'              => array('title', 'editor', 'excerpt', 'thumbnail', 'custom-fields', 'revisions'),
            'hierarchical'          => false,
            'public'                => true,
            'show_ui'               => true,
            'show_in_menu'          => true,
            'menu_position'         => 20,
            'menu_icon'             => 'dashicons-portfolio',
            'show_in_admin_bar'     => true,
            'show_in_nav_menus'     => true,
            'can_export'            => true,
            'has_archive'           => true,
            'exclude_from_search'   => false,
            'publicly_queryable'    => true,
            'capability_type'       => 'post',
            'show_in_rest'          => true,
            'rewrite'               => array('slug' => 'realisations', 'with_front' => false),
        );

        register_post_type(self::POST_TYPE, $args);
    }

    /**
     * Add custom columns to admin post list
     */
    public static function custom_admin_columns($columns) {
        $new_columns = array();
        foreach ($columns as $key => $title) {
            $new_columns[$key] = $title;
            if ($key === 'title') {
                $new_columns['remote_id']    = __('ID distant (API)', 'boreal-estimateur');
                $new_columns['original_url'] = __('Lien distant', 'boreal-estimateur');
                $new_columns['synced_at']    = __('Dernière sync', 'boreal-estimateur');
            }
        }
        return $new_columns;
    }

    /**
     * Render custom admin columns content
     */
    public static function render_admin_columns($column, $post_id) {
        switch ($column) {
            case 'remote_id':
                $remote_id = get_post_meta($post_id, '_remote_post_id', true);
                if ($remote_id) {
                    echo '<code>#' . esc_html($remote_id) . '</code>';
                } else {
                    echo '<span style="color:#888;">—</span>';
                }
                break;

            case 'original_url':
                $link = get_post_meta($post_id, '_remote_original_link', true);
                if ($link) {
                    echo '<a href="' . esc_url($link) . '" target="_blank" rel="noopener noreferrer" class="button button-small">';
                    echo esc_html__('Voir l\'article', 'boreal-estimateur') . ' &rarr;';
                    echo '</a>';
                } else {
                    echo '<span style="color:#888;">—</span>';
                }
                break;

            case 'synced_at':
                $synced_at = get_post_meta($post_id, '_remote_synced_at', true);
                if ($synced_at) {
                    echo esc_html(wp_date('d/m/Y H:i', strtotime($synced_at)));
                } else {
                    echo '<span style="color:#888;">—</span>';
                }
                break;
        }
    }
}
