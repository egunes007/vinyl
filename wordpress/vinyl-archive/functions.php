<?php
/** VINYL ARCHIVE theme setup. No database mutations or external API calls. */
defined('ABSPATH') || exit;
function vinyl_archive_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'gallery', 'caption', 'style', 'script'));
}
add_action('after_setup_theme', 'vinyl_archive_setup');
function vinyl_archive_assets() {
    $uri = get_template_directory_uri();
    wp_enqueue_style('vinyl-archive', $uri . '/assets/archive.css', array(), '0.2.0');
    wp_enqueue_style('vinyl-wordpress', $uri . '/assets/wordpress.css', array('vinyl-archive'), '0.2.0');
    if (vinyl_archive_view() !== 'content') {
        wp_enqueue_script_module('vinyl-archive', $uri . '/assets/app.js', array(), '0.2.0');
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
