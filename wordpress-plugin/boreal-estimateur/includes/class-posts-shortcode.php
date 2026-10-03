<?php
/**
 * Shortcode to display posts from WordPress REST API (/wp-json/wp/v2/posts)
 * or from the local 'realisation' CPT.
 *
 * @package Boreal_Estimateur
 */

if (!defined('ABSPATH')) {
    exit;
}

class Boreal_Posts_Shortcode {

    /**
     * Register shortcode and assets
     */
    public static function init() {
        // Register shortcodes (with convenient aliases)
        add_shortcode('wp_api_posts', array(__CLASS__, 'render_shortcode'));
        add_shortcode('boreal_api_posts', array(__CLASS__, 'render_shortcode'));
        add_shortcode('boreal_realisations', array(__CLASS__, 'render_cpt_shortcode'));

        // Register CSS
        add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
    }

    /**
     * Register frontend CSS
     */
    public static function register_assets() {
        wp_register_style(
            'boreal-posts-style',
            BOREAL_ESTIMATEUR_PLUGIN_URL . 'assets/css/boreal-posts.css',
            array(),
            BOREAL_ESTIMATEUR_VERSION
        );
    }

    /**
     * Shortcode alias specifically for CPT
     */
    public static function render_cpt_shortcode($atts) {
        $atts = is_array($atts) ? $atts : array();
        $atts['source'] = 'cpt';
        return self::render_shortcode($atts);
    }

    /**
     * Main shortcode handler
     *
     * Usage :
     * [wp_api_posts]
     * [wp_api_posts count="5" url="https://wordpress.org/news"]
     * [wp_api_posts source="cpt" count="5"]
     *
     * @param array $atts Shortcode attributes
     * @return string Rendered HTML
     */
    public static function render_shortcode($atts) {
        $attributes = shortcode_atts(
            array(
                'url'      => 'https://wordpress.org/news',
                'endpoint' => '',
                'count'    => 5,
                'source'   => 'api', // 'api' or 'cpt'
                'cache'    => 3600,  // Cache TTL in seconds (1 hour)
                'columns'  => 3,     // 1, 2, or 3
                'class'    => '',
            ),
            $atts,
            'wp_api_posts'
        );

        wp_enqueue_style('boreal-posts-style');

        $count   = max(1, min(20, intval($attributes['count'])));
        $source  = sanitize_key($attributes['source']);
        $columns = max(1, min(4, intval($attributes['columns'])));
        $class   = sanitize_html_class($attributes['class']);

        $posts_data = array();

        if ($source === 'cpt' || $source === 'realisation') {
            $posts_data = self::get_posts_from_cpt($count);
        } else {
            // Resolve endpoint URL
            $endpoint = !empty($attributes['endpoint'])
                ? esc_url_raw($attributes['endpoint'])
                : trailingslashit(esc_url_raw($attributes['url'])) . 'wp-json/wp/v2/posts';

            $cache_ttl = intval($attributes['cache']);
            $posts_data = self::get_posts_from_rest_api($endpoint, $count, $cache_ttl);
        }

        // Render HTML
        return self::render_posts_html($posts_data, $columns, $class, $source);
    }

    /**
     * Fetch posts directly from remote WordPress REST API with Transient caching
     *
     * @param string $endpoint The full REST API endpoint
     * @param int    $count    Number of posts to fetch
     * @param int    $cache_ttl Cache expiration in seconds
     * @return array Standardized array of posts or WP_Error
     */
    public static function get_posts_from_rest_api($endpoint, $count = 5, $cache_ttl = 3600) {
        $cache_key = 'boreal_rest_posts_' . md5($endpoint . '_' . $count);

        if ($cache_ttl > 0) {
            $cached = get_transient($cache_key);
            if (false !== $cached && is_array($cached)) {
                return $cached;
            }
        }

        $url = add_query_arg(
            array(
                'per_page' => $count,
                '_embed'   => 1,
            ),
            $endpoint
        );

        $response = wp_remote_get($url, array(
            'timeout'    => 15,
            'sslverify'  => true,
            'user-agent' => 'WordPress/' . get_bloginfo('version'),
            'headers'    => array('Accept' => 'application/json'),
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return new WP_Error('http_error', sprintf(__('Erreur API REST HTTP %d', 'boreal-estimateur'), $code));
        }

        $raw_body = wp_remote_retrieve_body($response);
        $json = json_decode($raw_body, true);

        if (!is_array($json)) {
            return new WP_Error('json_error', __('Impossible de décoder les données JSON de l\'API.', 'boreal-estimateur'));
        }

        $items = array();
        foreach ($json as $item) {
            // Raw title & clean HTML
            $raw_title = isset($item['title']['rendered']) ? $item['title']['rendered'] : '';
            $title     = wp_strip_all_tags(html_entity_decode($raw_title, ENT_QUOTES, 'UTF-8'));

            // Raw excerpt & clean HTML
            $raw_excerpt   = isset($item['excerpt']['rendered']) ? $item['excerpt']['rendered'] : '';
            $clean_excerpt = wp_strip_all_tags(html_entity_decode($raw_excerpt, ENT_QUOTES, 'UTF-8'));

            // Trim excerpt nicely
            $trimmed_excerpt = wp_trim_words($clean_excerpt, 30, '…');

            // Date
            $raw_date = isset($item['date']) ? $item['date'] : '';

            // Link
            $link = isset($item['link']) ? esc_url_raw($item['link']) : '#';

            // Thumbnail if embedded
            $thumb_url = '';
            if (!empty($item['_embedded']['wp:featuredmedia'][0]['source_url'])) {
                $thumb_url = esc_url_raw($item['_embedded']['wp:featuredmedia'][0]['source_url']);
            }

            $items[] = array(
                'id'        => isset($item['id']) ? intval($item['id']) : 0,
                'title'     => $title,
                'date'      => $raw_date,
                'excerpt'   => $trimmed_excerpt,
                'link'      => $link,
                'thumbnail' => $thumb_url,
            );
        }

        if ($cache_ttl > 0 && !empty($items)) {
            set_transient($cache_key, $items, $cache_ttl);
        }

        return $items;
    }

    /**
     * Fetch posts from local CPT 'realisation'
     *
     * @param int $count Number of posts
     * @return array
     */
    public static function get_posts_from_cpt($count = 5) {
        $query = new WP_Query(array(
            'post_type'      => Boreal_Realisations_CPT::POST_TYPE,
            'post_status'    => 'publish',
            'posts_per_page' => $count,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ));

        $items = array();
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();

                $remote_link = get_post_meta($post_id, '_remote_original_link', true);
                $link = !empty($remote_link) ? $remote_link : get_permalink($post_id);

                $excerpt = get_the_excerpt($post_id);
                $clean_excerpt = wp_strip_all_tags(html_entity_decode($excerpt, ENT_QUOTES, 'UTF-8'));
                $trimmed_excerpt = wp_trim_words($clean_excerpt, 30, '…');

                $items[] = array(
                    'id'        => $post_id,
                    'title'     => get_the_title($post_id),
                    'date'      => get_the_date('c', $post_id),
                    'excerpt'   => $trimmed_excerpt,
                    'link'      => esc_url($link),
                    'thumbnail' => get_the_post_thumbnail_url($post_id, 'medium_large'),
                );
            }
            wp_reset_postdata();
        }

        return $items;
    }

    /**
     * Render the HTML markup for posts list
     *
     * @param array|WP_Error $posts_data
     * @param int            $columns
     * @param string         $custom_class
     * @param string         $source
     * @return string
     */
    private static function render_posts_html($posts_data, $columns = 3, $custom_class = '', $source = 'api') {
        if (is_wp_error($posts_data)) {
            return sprintf(
                '<div class="boreal-posts-error"><p><strong>%s</strong> %s</p></div>',
                esc_html__('Erreur lors du chargement des articles :', 'boreal-estimateur'),
                esc_html($posts_data->get_error_message())
            );
        }

        if (empty($posts_data)) {
            return sprintf(
                '<div class="boreal-posts-empty"><p>%s</p></div>',
                esc_html__('Aucun article à afficher pour le moment.', 'boreal-estimateur')
            );
        }

        $date_format = get_option('date_format', 'j F Y');
        $grid_cols_class = 'boreal-cols-' . $columns;

        ob_start();
        ?>
        <div class="boreal-posts-container <?php echo esc_attr($grid_cols_class . ' ' . $custom_class); ?>" data-source="<?php echo esc_attr($source); ?>">
            <div class="boreal-posts-grid">
                <?php foreach ($posts_data as $post): ?>
                    <?php
                    $timestamp = !empty($post['date']) ? strtotime($post['date']) : time();
                    $formatted_date = wp_date($date_format, $timestamp);
                    $iso_date = wp_date('c', $timestamp);
                    ?>
                    <article class="boreal-post-card">
                        <?php if (!empty($post['thumbnail'])): ?>
                            <div class="boreal-post-thumbnail">
                                <a href="<?php echo esc_url($post['link']); ?>" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
                                    <img src="<?php echo esc_url($post['thumbnail']); ?>" alt="<?php echo esc_attr($post['title']); ?>" loading="lazy" />
                                </a>
                            </div>
                        <?php endif; ?>

                        <div class="boreal-post-body">
                            <div class="boreal-post-meta">
                                <time class="boreal-post-date" datetime="<?php echo esc_attr($iso_date); ?>">
                                    <span class="boreal-calendar-icon" aria-hidden="true">📅</span>
                                    <?php echo esc_html($formatted_date); ?>
                                </time>
                            </div>

                            <h3 class="boreal-post-title">
                                <a href="<?php echo esc_url($post['link']); ?>" target="_blank" rel="noopener noreferrer">
                                    <?php echo esc_html($post['title']); ?>
                                </a>
                            </h3>

                            <div class="boreal-post-excerpt">
                                <p><?php echo esc_html($post['excerpt']); ?></p>
                            </div>

                            <div class="boreal-post-footer">
                                <a href="<?php echo esc_url($post['link']); ?>" class="boreal-post-link" target="_blank" rel="noopener noreferrer">
                                    <span><?php echo esc_html__('Lire l\'article', 'boreal-estimateur'); ?></span>
                                    <span class="boreal-link-arrow" aria-hidden="true">&rarr;</span>
                                </a>
                            </div>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
