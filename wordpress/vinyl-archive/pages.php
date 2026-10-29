<?php
/** Create the archive pages requested by the site owner; preserve existing pages. */
defined('ABSPATH') || exit;
function vinyl_archive_ensure_pages() {
    if (!current_user_can('manage_options')) return;
    $created = false;
    foreach (array('koleksiyon'=>'Koleksiyonum', 'imzali-plaklar'=>'İmzalı Plaklar', 'sanatcilar'=>'Sanatçılar', 'turler'=>'Türler', 'hakkimda'=>'Hakkımda') as $slug=>$title) {
        if (get_page_by_path($slug, OBJECT, 'page')) continue;
        $result = wp_insert_post(array(
            'post_type'=>'page', 'post_status'=>'publish', 'post_name'=>$slug,
            'post_title'=>$title, 'post_content'=>'', 'comment_status'=>'closed', 'ping_status'=>'closed'
        ), true);
        if (is_wp_error($result) || !$result) {
            add_action('admin_notices', 'vinyl_archive_pages_error');
            continue; // Retry at the next administrator visit; never mark a failed insert complete.
        }
        $created = true;
    }
    if ($created) flush_rewrite_rules(false);
}
function vinyl_archive_pages_error() {
    echo '<div class="notice notice-error"><p>VINYL ARCHIVE: Arşiv sayfası oluşturulamadı. Sayfalar bölümünde Koleksiyonum, İmzalı Plaklar, Sanatçılar, Türler ve Hakkımda sayfalarını kontrol edin. Bir sonraki yönetici ziyaretinde yeniden denenecek.</p></div>';
}
add_action('after_switch_theme', 'vinyl_archive_ensure_pages');
// Theme ZIP updates do not run after_switch_theme. Handle already-active installations too.
add_action('admin_init', 'vinyl_archive_ensure_pages');
