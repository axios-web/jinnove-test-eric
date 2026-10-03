<?php
/**
 * Plugin Name: Toitures Boréal - Estimateur de Soumission
 * Plugin URI: https://toituresboreal.ca
 * Description: Intègre l'estimateur de soumission en ligne interactif de Toitures Boréal (Next.js) dans vos pages WordPress et modèles Elementor grâce au shortcode <code>[boreal_estimateur]</code>. Comprend l'ajustement automatique de la hauteur (auto-resizing) sans barre de défilement.
 * Version: 1.0.0
 * Author: Toitures Boréal
 * Author URI: https://toituresboreal.ca
 * Text Domain: boreal-estimateur
 * License: GPL-2.0+
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

define('BOREAL_ESTIMATEUR_VERSION', '1.0.0');
define('BOREAL_ESTIMATEUR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BOREAL_ESTIMATEUR_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include Realisations CPT, Sync service, and Shortcode modules
require_once BOREAL_ESTIMATEUR_PLUGIN_DIR . 'includes/class-realisations-cpt.php';
require_once BOREAL_ESTIMATEUR_PLUGIN_DIR . 'includes/class-realisations-sync.php';
require_once BOREAL_ESTIMATEUR_PLUGIN_DIR . 'includes/class-posts-shortcode.php';

// Initialize modules
Boreal_Realisations_CPT::init();
Boreal_Realisations_Sync::init();
Boreal_Posts_Shortcode::init();

// Ensure cron is scheduled if plugin is already active (hooked on init to prevent early translation notices)
add_action('init', function() {
    if (!wp_next_scheduled(Boreal_Realisations_Sync::CRON_HOOK)) {
        Boreal_Realisations_Sync::schedule_cron();
    }
});

// Plugin Activation & Deactivation hooks
register_activation_hook(__FILE__, function() {
    Boreal_Realisations_CPT::register_post_type();
    flush_rewrite_rules();
    Boreal_Realisations_Sync::schedule_cron();
});

register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
    Boreal_Realisations_Sync::clear_cron();
});

/**
 * Register frontend scripts and styles
 */
function boreal_estimateur_register_assets() {
    wp_register_style(
        'boreal-estimateur-css',
        BOREAL_ESTIMATEUR_PLUGIN_URL . 'assets/css/boreal-iframe.css',
        array(),
        BOREAL_ESTIMATEUR_VERSION
    );

    wp_register_script(
        'boreal-estimateur-resizer',
        BOREAL_ESTIMATEUR_PLUGIN_URL . 'assets/js/boreal-iframe-resizer.js',
        array(),
        BOREAL_ESTIMATEUR_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'boreal_estimateur_register_assets');

/**
 * Shortcode handler: [boreal_estimateur]
 *
 * Exemples d'utilisation :
 * [boreal_estimateur]
 * [boreal_estimateur url="https://soumission.toituresboreal.ca/embed" min_height="700px"]
 */
function boreal_estimateur_render_shortcode($atts) {
    // Get stored options or fallback to defaults
    $default_url = get_option('boreal_estimateur_url', 'http://localhost:3000/embed');
    $default_min_height = get_option('boreal_estimateur_min_height', '650px');

    $attributes = shortcode_atts(
        array(
            'url'        => $default_url,
            'min_height' => $default_min_height,
            'class'      => '',
            'id'         => '',
        ),
        $atts,
        'boreal_estimateur'
    );

    // Enqueue registered assets when shortcode is used
    wp_enqueue_style('boreal-estimateur-css');
    wp_enqueue_script('boreal-estimateur-resizer');

    // Clean attributes
    $url = esc_url($attributes['url']);
    $min_height = esc_attr($attributes['min_height']);
    $custom_class = esc_attr($attributes['class']);
    $unique_id = !empty($attributes['id']) ? esc_attr($attributes['id']) : 'boreal-' . wp_rand(1000, 9999);

    // Output HTML
    ob_start();
    ?>
    <div class="boreal-estimateur-wrapper <?php echo $custom_class; ?>" id="<?php echo $unique_id; ?>-wrapper">
        <iframe
            id="<?php echo $unique_id; ?>-iframe"
            src="<?php echo $url; ?>"
            class="boreal-estimateur-iframe"
            title="<?php echo esc_attr__('Estimateur de soumission en ligne - Toitures Boréal', 'boreal-estimateur'); ?>"
            style="width: 100%; border: none; min-height: <?php echo $min_height; ?>; overflow: hidden; background: transparent;"
            scrolling="no"
            loading="lazy"
            allow="clipboard-write"
        ></iframe>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('boreal_estimateur', 'boreal_estimateur_render_shortcode');

/**
 * Add Admin Settings Page under "Réglages"
 */
function boreal_estimateur_add_admin_menu() {
    add_options_page(
        __('Estimateur Toitures Boréal', 'boreal-estimateur'),
        __('Estimateur Boréal', 'boreal-estimateur'),
        'manage_options',
        'boreal-estimateur-settings',
        'boreal_estimateur_settings_page_html'
    );
}
add_action('admin_menu', 'boreal_estimateur_add_admin_menu');

/**
 * Register plugin settings
 */
function boreal_estimateur_register_settings() {
    register_setting('boreal_estimateur_options_group', 'boreal_estimateur_url', array(
        'type'              => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'default'           => 'http://localhost:3000/embed',
    ));

    register_setting('boreal_estimateur_options_group', 'boreal_estimateur_min_height', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '650px',
    ));
}
add_action('admin_init', 'boreal_estimateur_register_settings');

/**
 * Render Admin Settings Page HTML
 */
function boreal_estimateur_settings_page_html() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html__('Configuration de l\'Estimateur Toitures Boréal', 'boreal-estimateur'); ?></h1>
        <p><?php echo esc_html__('Ce plugin permet d\'intégrer l\'estimateur Next.js dans n\'importe quel article, page ou modèle Elementor.', 'boreal-estimateur'); ?></p>

        <form action="options.php" method="post" style="max-width: 700px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4; margin-top: 15px;">
            <?php
            settings_fields('boreal_estimateur_options_group');
            do_settings_sections('boreal_estimateur_options_group');
            ?>

            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row">
                        <label for="boreal_estimateur_url"><?php echo esc_html__('URL de l\'application Next.js (/embed)', 'boreal-estimateur'); ?></label>
                    </th>
                    <td>
                        <input
                            type="url"
                            id="boreal_estimateur_url"
                            name="boreal_estimateur_url"
                            value="<?php echo esc_attr(get_option('boreal_estimateur_url', 'http://localhost:3000/embed')); ?>"
                            class="regular-text"
                            placeholder="https://soumission.toituresboreal.ca/embed"
                            style="width: 100%;"
                        />
                        <p class="description">
                            <?php echo esc_html__('Par défaut en développement : http://localhost:3000/embed. En production, renseignez l\'URL Vercel ou votre sous-domaine avec la route /embed.', 'boreal-estimateur'); ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="boreal_estimateur_min_height"><?php echo esc_html__('Hauteur minimale de base', 'boreal-estimateur'); ?></label>
                    </th>
                    <td>
                        <input
                            type="text"
                            id="boreal_estimateur_min_height"
                            name="boreal_estimateur_min_height"
                            value="<?php echo esc_attr(get_option('boreal_estimateur_min_height', '650px')); ?>"
                            class="small-text"
                            style="width: 120px;"
                        />
                        <p class="description">
                            <?php echo esc_html__('Hauteur initiale avant que le script d\'auto-resizing n\'ajuste la hauteur exacte du contenu.', 'boreal-estimateur'); ?>
                        </p>
                    </td>
                </tr>
            </table>

            <?php submit_button(__('Enregistrer les réglages', 'boreal-estimateur')); ?>
        </form>

        <div style="max-width: 700px; background: #f0f6fc; padding: 20px; border-radius: 8px; border: 1px solid #c8d8ea; margin-top: 25px;">
            <h2 style="margin-top: 0;"><?php echo esc_html__('📖 Guide d\'intégration Elementor & WordPress', 'boreal-estimateur'); ?></h2>
            <ol style="margin-left: 20px; line-height: 1.6;">
                <li>
                    <strong>Intégration via Elementor :</strong>
                    Glissez un widget <em>« Shortcode »</em> (ou <em>« Code court »</em>) dans votre page Elementor et insérez :
                    <br/><code style="display: inline-block; padding: 4px 8px; background: #fff; border: 1px solid #ccd0d4; margin: 5px 0;">[boreal_estimateur]</code>
                </li>
                <li>
                    <strong>Options disponibles dans le shortcode :</strong>
                    <br/><code style="display: inline-block; padding: 4px 8px; background: #fff; border: 1px solid #ccd0d4; margin: 5px 0;">[boreal_estimateur min_height="700px"]</code>
                </li>
                <li>
                    <strong>Ajustement automatique (Auto-height) :</strong>
                    Le script inclus ajuste la hauteur du cadre en temps réel à chaque étape (sélection, calcul, coordonnées et confirmation), garantissant une expérience fluide sans double barre de défilement.
                </li>
            </ol>
        </div>
    </div>
    <?php
}
