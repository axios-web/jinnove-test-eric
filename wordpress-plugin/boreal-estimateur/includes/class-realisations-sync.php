<?php
/**
 * Realisations Sync Service
 *
 * Handles fetching posts from remote WordPress REST API,
 * saving them to the 'realisation' CPT, duplicate prevention,
 * and periodic WP-Cron scheduling.
 *
 * @package Boreal_Estimateur
 */

if (!defined('ABSPATH')) {
    exit;
}

class Boreal_Realisations_Sync {

    const DEFAULT_ENDPOINT = 'https://wordpress.org/news/wp-json/wp/v2/posts';
    const CRON_HOOK        = 'boreal_sync_realisations_cron';
    const OPTION_ENDPOINT  = 'boreal_realisations_endpoint';
    const OPTION_FREQUENCY = 'boreal_realisations_frequency';
    const OPTION_LAST_SYNC = 'boreal_realisations_last_sync_info';

    /**
     * Initialize hooks
     */
    public static function init() {
        // Register cron action
        add_action(self::CRON_HOOK, array(__CLASS__, 'execute_cron_sync'));

        // Admin menu under 'realisation' post type
        add_action('admin_menu', array(__CLASS__, 'register_admin_menu'));

        // Admin post action for manual sync trigger
        add_action('admin_post_boreal_sync_realisations', array(__CLASS__, 'handle_manual_sync'));

        // Register custom cron schedules if needed
        add_filter('cron_schedules', array(__CLASS__, 'custom_cron_schedules'));

        // Register WP-CLI command if WP-CLI is present
        if (defined('WP_CLI') && WP_CLI) {
            WP_CLI::add_command('boreal sync-posts', array(__CLASS__, 'cli_sync_posts'));
        }
    }

    /**
     * Add custom cron schedules
     */
    public static function custom_cron_schedules($schedules) {
        if (!isset($schedules['every_six_hours'])) {
            $schedules['every_six_hours'] = array(
                'interval' => 6 * HOUR_IN_SECONDS,
                'display'  => __('Toutes les 6 heures', 'boreal-estimateur'),
            );
        }
        return $schedules;
    }

    /**
     * Setup cron event on plugin activation or settings update
     */
    public static function schedule_cron() {
        $frequency = get_option(self::OPTION_FREQUENCY, 'hourly');
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), $frequency, self::CRON_HOOK);
        }
    }

    /**
     * Clear cron event on deactivation
     */
    public static function clear_cron() {
        $timestamp = wp_next_scheduled(self::CRON_HOOK);
        if ($timestamp) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
        }
        wp_clear_scheduled_hook(self::CRON_HOOK);
    }

    /**
     * Callback for WP-Cron
     */
    public static function execute_cron_sync() {
        $endpoint = get_option(self::OPTION_ENDPOINT, self::DEFAULT_ENDPOINT);
        self::sync_posts_from_api($endpoint, 10);
    }

    /**
     * Main synchronization method: fetches posts and saves them with anti-duplicate check
     *
     * @param string $endpoint The REST API URL
     * @param int    $per_page Number of posts to fetch
     * @return array Result summary with counts and status
     */
    public static function sync_posts_from_api($endpoint = '', $per_page = 10) {
        if (empty($endpoint)) {
            $endpoint = get_option(self::OPTION_ENDPOINT, self::DEFAULT_ENDPOINT);
        }

        $url = add_query_arg(
            array(
                'per_page' => max(1, min(100, intval($per_page))),
                '_embed'   => 1,
            ),
            $endpoint
        );

        $response = wp_remote_get($url, array(
            'timeout'    => 25,
            'sslverify'  => true,
            'user-agent' => 'WordPress/' . get_bloginfo('version') . '; ' . home_url(),
            'headers'    => array(
                'Accept' => 'application/json',
            ),
        ));

        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            self::log_sync_result('error', 0, 0, 0, 0, $error_message);
            return array(
                'success' => false,
                'message' => $error_message,
            );
        }

        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            $error_message = sprintf(__('Réponse HTTP inattendue : %d', 'boreal-estimateur'), $status_code);
            self::log_sync_result('error', 0, 0, 0, 0, $error_message);
            return array(
                'success' => false,
                'message' => $error_message,
            );
        }

        $body = wp_remote_retrieve_body($response);
        $posts_data = json_decode($body, true);

        if (!is_array($posts_data)) {
            $error_message = __('Format JSON invalide reçu de l\'API distante.', 'boreal-estimateur');
            self::log_sync_result('error', 0, 0, 0, 0, $error_message);
            return array(
                'success' => false,
                'message' => $error_message,
            );
        }

        $imported = 0;
        $updated  = 0;
        $skipped  = 0;
        $total    = count($posts_data);

        foreach ($posts_data as $item) {
            $remote_id = isset($item['id']) ? intval($item['id']) : 0;
            if (!$remote_id) {
                continue;
            }

            // Clean title, excerpt, and content
            $raw_title   = isset($item['title']['rendered']) ? $item['title']['rendered'] : '';
            $title       = wp_strip_all_tags(html_entity_decode($raw_title, ENT_QUOTES, 'UTF-8'));
            
            $raw_excerpt = isset($item['excerpt']['rendered']) ? $item['excerpt']['rendered'] : '';
            $excerpt     = wp_strip_all_tags(html_entity_decode($raw_excerpt, ENT_QUOTES, 'UTF-8'));
            
            $raw_content = isset($item['content']['rendered']) ? $item['content']['rendered'] : '';
            $content     = wp_kses_post($raw_content);

            $date        = isset($item['date']) ? sanitize_text_field($item['date']) : current_time('mysql');
            $link        = isset($item['link']) ? esc_url_raw($item['link']) : '';
            $modified    = isset($item['modified']) ? sanitize_text_field($item['modified']) : '';

            // Anti-duplicate control: search existing post by _remote_post_id
            $existing_query = new WP_Query(array(
                'post_type'      => Boreal_Realisations_CPT::POST_TYPE,
                'post_status'    => 'any',
                'posts_per_page' => 1,
                'fields'         => 'ids',
                'meta_query'     => array(
                    array(
                        'key'     => '_remote_post_id',
                        'value'   => $remote_id,
                        'compare' => '=',
                    ),
                ),
            ));

            if ($existing_query->have_posts()) {
                $post_id = $existing_query->posts[0];
                $local_modified = get_post_meta($post_id, '_remote_modified', true);

                // Update only if remote modified date changed
                if ($modified !== $local_modified) {
                    wp_update_post(array(
                        'ID'           => $post_id,
                        'post_title'   => $title,
                        'post_content' => $content,
                        'post_excerpt' => $excerpt,
                    ));

                    update_post_meta($post_id, '_remote_modified', $modified);
                    update_post_meta($post_id, '_remote_original_link', $link);
                    update_post_meta($post_id, '_remote_synced_at', current_time('mysql'));
                    $updated++;
                } else {
                    $skipped++;
                }
            } else {
                // Insert new post
                $new_post_id = wp_insert_post(array(
                    'post_type'    => Boreal_Realisations_CPT::POST_TYPE,
                    'post_status'  => 'publish',
                    'post_title'   => $title,
                    'post_content' => $content,
                    'post_excerpt' => $excerpt,
                    'post_date'    => $date,
                ), true);

                if (!is_wp_error($new_post_id)) {
                    update_post_meta($new_post_id, '_remote_post_id', $remote_id);
                    update_post_meta($new_post_id, '_remote_source_url', $endpoint);
                    update_post_meta($new_post_id, '_remote_original_link', $link);
                    update_post_meta($new_post_id, '_remote_modified', $modified);
                    update_post_meta($new_post_id, '_remote_synced_at', current_time('mysql'));

                    // Try to attach featured image if present in _embedded
                    self::attach_remote_featured_image($new_post_id, $item);

                    $imported++;
                } else {
                    $skipped++;
                }
            }
        }

        self::log_sync_result('success', $imported, $updated, $skipped, $total);

        return array(
            'success'  => true,
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,
            'total'    => $total,
        );
    }

    /**
     * Download and attach featured image if available in _embedded
     */
    private static function attach_remote_featured_image($post_id, $item) {
        if (empty($item['_embedded']['wp:featuredmedia'][0]['source_url'])) {
            return;
        }

        $image_url = esc_url_raw($item['_embedded']['wp:featuredmedia'][0]['source_url']);
        if (!$image_url) {
            return;
        }

        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $attachment_id = media_sideload_image($image_url, $post_id, null, 'id');
        if (!is_wp_error($attachment_id) && $attachment_id) {
            set_post_thumbnail($post_id, $attachment_id);
        }
    }

    /**
     * Save sync log in WordPress options
     */
    private static function log_sync_result($status, $imported, $updated, $skipped, $total, $message = '') {
        $info = array(
            'timestamp' => current_time('timestamp'),
            'date_str'  => current_time('mysql'),
            'status'    => $status,
            'imported'  => $imported,
            'updated'   => $updated,
            'skipped'   => $skipped,
            'total'     => $total,
            'message'   => $message,
        );
        update_option(self::OPTION_LAST_SYNC, $info);
    }

    /**
     * Add admin submenu under 'realisation' post type
     */
    public static function register_admin_menu() {
        add_submenu_page(
            'edit.php?post_type=' . Boreal_Realisations_CPT::POST_TYPE,
            __('Synchronisation API REST', 'boreal-estimateur'),
            __('Synchronisation API', 'boreal-estimateur'),
            'manage_options',
            'boreal-realisations-sync',
            array(__CLASS__, 'render_admin_page')
        );
    }

    /**
     * Handle manual sync form submission
     */
    public static function handle_manual_sync() {
        if (!current_user_can('manage_options')) {
            wp_die(__('Action non autorisée.', 'boreal-estimateur'));
        }

        check_admin_referer('boreal_sync_manual_action', 'boreal_sync_nonce');

        $endpoint  = isset($_POST['api_endpoint']) ? esc_url_raw(trim($_POST['api_endpoint'])) : self::DEFAULT_ENDPOINT;
        $frequency = isset($_POST['sync_frequency']) ? sanitize_text_field($_POST['sync_frequency']) : 'hourly';
        $count     = isset($_POST['sync_count']) ? intval($_POST['sync_count']) : 10;

        // Save options
        update_option(self::OPTION_ENDPOINT, $endpoint);
        update_option(self::OPTION_FREQUENCY, $frequency);

        // Reschedule cron if frequency changed
        self::clear_cron();
        if ($frequency !== 'manual') {
            wp_schedule_event(time(), $frequency, self::CRON_HOOK);
        }

        // Run sync immediately
        $result = self::sync_posts_from_api($endpoint, $count);

        $redirect_url = add_query_arg(
            array(
                'post_type' => Boreal_Realisations_CPT::POST_TYPE,
                'page'      => 'boreal-realisations-sync',
                'synced'    => $result['success'] ? '1' : '0',
            ),
            admin_url('edit.php')
        );

        wp_safe_redirect($redirect_url);
        exit;
    }

    /**
     * Render the admin management and sync page
     */
    public static function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $endpoint    = get_option(self::OPTION_ENDPOINT, self::DEFAULT_ENDPOINT);
        $frequency   = get_option(self::OPTION_FREQUENCY, 'hourly');
        $last_sync   = get_option(self::OPTION_LAST_SYNC, array());
        $next_cron   = wp_next_scheduled(self::CRON_HOOK);
        $post_counts = wp_count_posts(Boreal_Realisations_CPT::POST_TYPE);
        $total_posts = isset($post_counts->publish) ? $post_counts->publish : 0;
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('Synchronisation API REST & Réalisations', 'boreal-estimateur'); ?></h1>
            <p><?php echo esc_html__('Ce module récupère les articles depuis une API REST WordPress distante, prévient les doublons et les enregistre dans le Custom Post Type « réalisation ».', 'boreal-estimateur'); ?></p>

            <?php if (isset($_GET['synced'])): ?>
                <?php if ($_GET['synced'] === '1'): ?>
                    <div class="notice notice-success is-dismissible">
                        <p><strong><?php echo esc_html__('Synchronisation terminée avec succès !', 'boreal-estimateur'); ?></strong></p>
                        <?php if (!empty($last_sync)): ?>
                            <p>
                                <?php
                                printf(
                                    esc_html__('Détails : %d importé(s), %d mis à jour, %d inchangé(s) sur un total de %d articles distants.', 'boreal-estimateur'),
                                    $last_sync['imported'],
                                    $last_sync['updated'],
                                    $last_sync['skipped'],
                                    $last_sync['total']
                                );
                                ?>
                            </p>
                        <?php endif; ?>
                    </div>
                <?php else: ?>
                    <div class="notice notice-error is-dismissible">
                        <p><strong><?php echo esc_html__('Erreur lors de la synchronisation.', 'boreal-estimateur'); ?></strong></p>
                        <?php if (!empty($last_sync['message'])): ?>
                            <p><?php echo esc_html($last_sync['message']); ?></p>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>

            <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
                <!-- Main Form & Actions -->
                <div style="flex: 2; min-width: 320px;">
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="background: #fff; padding: 22px; border-radius: 8px; border: 1px solid #ccd0d4;">
                        <input type="hidden" name="action" value="boreal_sync_realisations">
                        <?php wp_nonce_field('boreal_sync_manual_action', 'boreal_sync_nonce'); ?>

                        <h2><?php echo esc_html__('Paramètres de synchronisation', 'boreal-estimateur'); ?></h2>

                        <table class="form-table" role="presentation">
                            <tr>
                                <th scope="row">
                                    <label for="api_endpoint"><?php echo esc_html__('URL de l\'API REST distante', 'boreal-estimateur'); ?></label>
                                </th>
                                <td>
                                    <input
                                        type="url"
                                        id="api_endpoint"
                                        name="api_endpoint"
                                        value="<?php echo esc_attr($endpoint); ?>"
                                        class="large-text"
                                        required
                                    />
                                    <p class="description">
                                        <?php echo esc_html__('Exemple : https://wordpress.org/news/wp-json/wp/v2/posts', 'boreal-estimateur'); ?>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <label for="sync_frequency"><?php echo esc_html__('Mise à jour périodique (WP-Cron)', 'boreal-estimateur'); ?></label>
                                </th>
                                <td>
                                    <select id="sync_frequency" name="sync_frequency">
                                        <option value="hourly" <?php selected($frequency, 'hourly'); ?>><?php echo esc_html__('Toutes les heures (Recommandé)', 'boreal-estimateur'); ?></option>
                                        <option value="every_six_hours" <?php selected($frequency, 'every_six_hours'); ?>><?php echo esc_html__('Toutes les 6 heures', 'boreal-estimateur'); ?></option>
                                        <option value="twicedaily" <?php selected($frequency, 'twicedaily'); ?>><?php echo esc_html__('Deux fois par jour', 'boreal-estimateur'); ?></option>
                                        <option value="daily" <?php selected($frequency, 'daily'); ?>><?php echo esc_html__('Une fois par jour', 'boreal-estimateur'); ?></option>
                                        <option value="manual" <?php selected($frequency, 'manual'); ?>><?php echo esc_html__('Manuelle uniquement (Désactiver Cron)', 'boreal-estimateur'); ?></option>
                                    </select>
                                    <p class="description">
                                        <?php
                                        if ($next_cron) {
                                            printf(
                                                esc_html__('Prochaine exécution automatique prévue : dans %s (%s)', 'boreal-estimateur'),
                                                human_time_diff($next_cron),
                                                wp_date('d/m/Y H:i', $next_cron)
                                            );
                                        } else {
                                            echo esc_html__('Aucune tâche automatique planifiée.', 'boreal-estimateur');
                                        }
                                        ?>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <label for="sync_count"><?php echo esc_html__('Nombre d\'articles à synchroniser', 'boreal-estimateur'); ?></label>
                                </th>
                                <td>
                                    <input
                                        type="number"
                                        id="sync_count"
                                        name="sync_count"
                                        value="10"
                                        min="1"
                                        max="50"
                                        class="small-text"
                                    />
                                    <p class="description">
                                        <?php echo esc_html__('Articles récents récupérés à chaque synchronisation.', 'boreal-estimateur'); ?>
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p class="submit" style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
                            <button type="submit" class="button button-primary button-large">
                                <span class="dashicons dashicons-update" style="vertical-align: middle; margin-right: 5px;"></span>
                                <?php echo esc_html__('Enregistrer et Synchroniser maintenant', 'boreal-estimateur'); ?>
                            </button>
                        </p>
                    </form>
                </div>

                <!-- Status & Info Card -->
                <div style="flex: 1; min-width: 280px;">
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
                            <span class="dashicons dashicons-shield"></span>
                            <?php echo esc_html__('Contrôle Anti-Doublons', 'boreal-estimateur'); ?>
                        </h3>
                        <p style="font-size: 13px; color: #444; line-height: 1.5;">
                            <?php echo esc_html__('Chaque article distant possède un identifiant unique (ID) stocké dans la métadonnée <code>_remote_post_id</code>. Avant chaque insertion, le système vérifie si cet ID existe déjà :', 'boreal-estimateur'); ?>
                        </p>
                        <ul style="font-size: 13px; color: #555; list-style: disc; margin-left: 20px; line-height: 1.5;">
                            <li><strong><?php echo esc_html__('Article existant inchangé :', 'boreal-estimateur'); ?></strong> <?php echo esc_html__('Ignoré, aucun doublon créé.', 'boreal-estimateur'); ?></li>
                            <li><strong><?php echo esc_html__('Article modifié à la source :', 'boreal-estimateur'); ?></strong> <?php echo esc_html__('Mise à jour automatique du titre, contenu et extrait.', 'boreal-estimateur'); ?></li>
                            <li><strong><?php echo esc_html__('Nouvel article :', 'boreal-estimateur'); ?></strong> <?php echo esc_html__('Inséré dans le post-type « réalisation ».', 'boreal-estimateur'); ?></li>
                        </ul>
                    </div>

                    <div style="background: #f0f6fc; padding: 20px; border-radius: 8px; border: 1px solid #c8d8ea;">
                        <h3 style="margin-top: 0;"><?php echo esc_html__('📊 État Actuel', 'boreal-estimateur'); ?></h3>
                        <p><strong><?php echo esc_html__('Total réalisations en BDD :', 'boreal-estimateur'); ?></strong> <span class="badge" style="background:#2271b1; color:#fff; padding: 2px 8px; border-radius: 12px; font-weight: bold;"><?php echo intval($total_posts); ?></span></p>
                        <?php if (!empty($last_sync['date_str'])): ?>
                            <p><strong><?php echo esc_html__('Dernière sync :', 'boreal-estimateur'); ?></strong> <?php echo esc_html(wp_date('d/m/Y H:i:s', $last_sync['timestamp'])); ?></p>
                            <p><strong><?php echo esc_html__('Statut :', 'boreal-estimateur'); ?></strong> 
                                <?php if ($last_sync['status'] === 'success'): ?>
                                    <span style="color: #008a20; font-weight: bold;">✔ <?php echo esc_html__('Succès', 'boreal-estimateur'); ?></span>
                                <?php else: ?>
                                    <span style="color: #d63638; font-weight: bold;">✖ <?php echo esc_html__('Erreur', 'boreal-estimateur'); ?></span>
                                <?php endif; ?>
                            </p>
                        <?php else: ?>
                            <p><em><?php echo esc_html__('Aucune synchronisation effectuée pour le moment.', 'boreal-estimateur'); ?></em></p>
                        <?php endif; ?>

                        <hr style="margin: 15px 0; border: none; border-top: 1px solid #d0d7de;">
                        <h4 style="margin: 10px 0 5px;"><?php echo esc_html__('📖 Shortcodes disponibles :', 'boreal-estimateur'); ?></h4>
                        <p style="margin: 4px 0;"><code style="font-size: 12px;">[boreal_api_posts]</code><br><small><?php echo esc_html__('Affiche 5 posts via API REST distante en direct', 'boreal-estimateur'); ?></small></p>
                        <p style="margin: 4px 0;"><code style="font-size: 12px;">[boreal_api_posts source="cpt"]</code><br><small><?php echo esc_html__('Affiche 5 posts depuis les réalisations importées', 'boreal-estimateur'); ?></small></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * WP-CLI command integration
     */
    public static function cli_sync_posts($args, $assoc_args) {
        $count    = isset($assoc_args['count']) ? intval($assoc_args['count']) : 10;
        $endpoint = isset($assoc_args['endpoint']) ? esc_url_raw($assoc_args['endpoint']) : get_option(self::OPTION_ENDPOINT, self::DEFAULT_ENDPOINT);

        WP_CLI::log(sprintf('Fetching %d posts from %s...', $count, $endpoint));
        $result = self::sync_posts_from_api($endpoint, $count);

        if ($result['success']) {
            WP_CLI::success(sprintf(
                'Sync finished: %d imported, %d updated, %d skipped (Total: %d).',
                $result['imported'],
                $result['updated'],
                $result['skipped'],
                $result['total']
            ));
        } else {
            WP_CLI::error('Sync failed: ' . $result['message']);
        }
    }
}
