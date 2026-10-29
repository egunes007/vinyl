<?php
/** VINYL ARCHIVE theme setup. Public data rendering and archive page setup. */
defined('ABSPATH') || exit;
require_once __DIR__ . '/pages.php';
function vinyl_archive_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'gallery', 'caption', 'style', 'script'));
}
add_action('after_setup_theme', 'vinyl_archive_setup');
function vinyl_archive_assets() {
    $uri = get_template_directory_uri();
    wp_enqueue_style('vinyl-archive', $uri . '/assets/archive.css', array(), '0.8.0');
    wp_enqueue_style('vinyl-wordpress', $uri . '/assets/wordpress.css', array('vinyl-archive'), '0.8.0');
    if (vinyl_archive_view() !== 'content') {
        wp_enqueue_script_module('vinyl-archive', $uri . '/assets/app.js', array(), '0.8.0');
    }
}
add_action('wp_enqueue_scripts', 'vinyl_archive_assets');
function vinyl_archive_view() {
    if (is_front_page()) return 'home';
    $views = array('koleksiyon'=>'collection', 'imzali-plaklar'=>'signed', 'sanatcilar'=>'artists', 'turler'=>'genres', 'hakkimda'=>'about');
    foreach ($views as $slug=>$view) {
        if (is_page($slug)) return $view;
    }
    return 'content';
}

// Only the explicit public payload is embedded. Token and raw NocoDB responses never leave PHP.
add_action('wp_head', function () {
    if (vinyl_archive_view() === 'content' || !function_exists('va_nc_fetch')) return;
    $result = va_nc_fetch();
    if (!is_wp_error($result) && function_exists('va_dc_enrich')) $result = va_dc_enrich($result);
    if (!is_wp_error($result) && function_exists('va_nc_manual_enrich')) $result = va_nc_manual_enrich($result);
    $payload = is_wp_error($result)
        ? array('live'=>true, 'albums'=>array(), 'error'=>true)
        : array('live'=>true, 'albums'=>$result, 'dashboard'=>get_option('va_nc_dashboard', array('years'=>array(), 'undated'=>0)), 'error'=>false);
    echo '<script type="application/json" id="vinyl-collection-data">' . wp_json_encode($payload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . '</script>';
});
