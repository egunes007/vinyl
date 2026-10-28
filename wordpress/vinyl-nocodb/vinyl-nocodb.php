<?php
/**
 * Plugin Name: Vinyl Archive — NocoDB
 * Description: NocoDB v2 koleksiyonunu salt okunur biçimde VINYL ARCHIVE temasına bağlar.
 * Version: 1.2.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 */
defined('ABSPATH') || exit;
require_once __DIR__ . '/public-record.php';
require_once __DIR__ . '/discogs.php';
require_once __DIR__ . '/manual-covers.php';
register_deactivation_hook(__FILE__, function () { wp_clear_scheduled_hook('va_dc_refresh'); });
function va_nc_settings() {
    return wp_parse_args(get_option('va_nc_settings', array()), array('url'=>'http://192.168.1.13:8080', 'table'=>'m4z9hmr4f6ylz8m'));
}
function va_nc_token() {
    return defined('VINYL_NOCODB_TOKEN') ? VINYL_NOCODB_TOKEN : get_option('va_nc_token', '');
}
function va_nc_key() { return 'va_nc_collection_v4'; }
function va_nc_fetch($refresh = false) {
    if (!$refresh) { $cached = get_transient(va_nc_key()); if (is_array($cached)) return $cached; }
    $settings = va_nc_settings();
    if (!va_nc_token()) return new WP_Error('missing_token', 'API token henüz tanımlanmadı.');
    $public = array();
    $seen = array();
    $attachments = array();
    for ($offset = 0; $offset < 10000; $offset += 100) {
        $url = $settings['url'] . '/api/v2/tables/' . rawurlencode($settings['table']) . '/records?limit=100&offset=' . $offset;
        $response = wp_remote_get($url, array('timeout'=>15, 'redirection'=>0, 'sslverify'=>true, 'limit_response_size'=>4 * 1024 * 1024, 'headers'=>array('xc-token'=>va_nc_token(), 'Accept'=>'application/json')));
        if (is_wp_error($response)) return new WP_Error('network', 'NocoDB bağlantısı kurulamadı. Adresi, portu ve Docker ağını kontrol edin.');
        $status = wp_remote_retrieve_response_code($response);
        if ($status !== 200) return new WP_Error('http', 'NocoDB HTTP ' . intval($status) . ' döndürdü. Adresi, tablo ID ve token yetkisini kontrol edin.');
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($body) || !isset($body['list']) || !is_array($body['list']) || !array_is_list($body['list'])) return new WP_Error('schema', 'NocoDB v2 liste yanıtı beklenen biçimde değil.');
        foreach ($body['list'] as $row) {
            if (!is_array($row) || !array_key_exists('Artist', $row) || !array_key_exists('Album', $row)) return new WP_Error('fields', 'Artist veya Album alanı bulunamadı. Tablo alan adlarını kontrol edin.');
            // Dedupe only by API primary key, never artist/title: separate pressings are valid.
            $source_id = $row['Id'] ?? $row['id'] ?? null;
            if (is_scalar($source_id) && (string) $source_id !== '') {
                $key = 'record:' . (string) $source_id;
                if (isset($seen[$key])) continue;
                $seen[$key] = true;
            }
            $record = va_nc_public_record($row, count($public));
            if ($record !== null) {
                $source = va_nc_attachment_url($row['Cover_Image'] ?? array());
                if ($source !== '') {
                    $cover_key = hash('sha256', $record['artist'] . "\0" . $record['album'] . "\0" . $source);
                    $attachments[$cover_key] = $source;
                    $record['manualCoverKey'] = $cover_key;
                }
                $public[] = $record;
            }
        }
        if (count($body['list']) < 100 || ($body['pageInfo']['isLastPage'] ?? false) === true) {
            update_option('va_nc_attachment_sources', $attachments, false);
            set_transient(va_nc_key(), $public, 5 * MINUTE_IN_SECONDS);
            return $public;
        }
    }
    return new WP_Error('limit', 'Koleksiyon 10.000 kayıt sınırına ulaştı; eksik liste yayımlanmadı.');
}
add_action('admin_menu', function () { add_options_page('NocoDB Bağlantısı', 'Vinyl NocoDB', 'manage_options', 'vinyl-nocodb', 'va_nc_admin'); });
function va_nc_admin() {
    if (!current_user_can('manage_options')) return;
    $message = ''; $error = false;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_admin_referer('va_nc_settings');
        $url = rtrim(sanitize_text_field(wp_unslash($_POST['url'] ?? '')), '/');
        $table = sanitize_text_field(wp_unslash($_POST['table'] ?? ''));
        $parts = wp_parse_url($url);
        if (!$parts || !in_array($parts['scheme'] ?? '', array('http','https'), true) || empty($parts['host']) || isset($parts['user']) || isset($parts['pass']) || !empty($parts['path']) || isset($parts['query']) || isset($parts['fragment']) || !preg_match('/^[A-Za-z0-9_-]+$/D', $table)) {
            $message = 'Geçerli bir sunucu adresi (http/https, yol ve kullanıcı bilgisi olmadan) ve tablo ID girin.'; $error = true;
        } else {
            update_option('va_nc_settings', array('url'=>$url, 'table'=>$table), false);
            if (!defined('VINYL_NOCODB_TOKEN')) {
                $token = trim(wp_unslash($_POST['token'] ?? ''));
                if (!empty($_POST['delete_token'])) delete_option('va_nc_token');
                elseif ($token !== '' && !preg_match('/[\r\n]/', $token)) update_option('va_nc_token', $token, false);
            }
            delete_transient(va_nc_key());
            if (isset($_POST['test'])) {
                $result = va_nc_fetch(true);
                $error = is_wp_error($result);
                $message = $error ? $result->get_error_message() : 'Bağlantı başarılı. ' . count($result) . ' halka açık plak okundu.';
            } else $message = 'Ayarlar kaydedildi; önbellek temizlendi.';
        }
    }
    $s = va_nc_settings();
    ?>
    <div class="wrap"><h1>VINYL ARCHIVE — NocoDB</h1>
    <?php if ($message) : ?><div class="notice <?php echo $error ? 'notice-error' : 'notice-success'; ?>"><p><?php echo esc_html($message); ?></p></div><?php endif; ?>
    <p>Mevcut koleksiyon salt okunur API v2 bağlantısıyla alınır. Notes, Price ve Purchase_Date ziyaretçilere gönderilmez.</p>
    <form method="post"><?php wp_nonce_field('va_nc_settings'); ?>
    <table class="form-table">
    <tr><th><label for="va-url">NocoDB adresi</label></th><td><input id="va-url" name="url" type="url" class="regular-text" required value="<?php echo esc_attr($s['url']); ?>"><p>Ev ağında HTTP kullanıldığında token ağda şifrelenmez. Güvenilir yerel ağ veya HTTPS kullanın.</p></td></tr>
    <tr><th><label for="va-table">Tablo ID</label></th><td><input id="va-table" name="table" required value="<?php echo esc_attr($s['table']); ?>"></td></tr>
    <tr><th><label for="va-token">API token</label></th><td><input id="va-token" name="token" type="password" autocomplete="new-password" value="" <?php disabled(defined('VINYL_NOCODB_TOKEN')); ?>>
    <p><?php echo va_nc_token() ? 'Token tanımlı. Değer güvenlik nedeniyle gösterilmez.' : 'Token eksik.'; ?> Boş bırakırsanız mevcut token korunur.</p>
    <?php if (!defined('VINYL_NOCODB_TOKEN')) : ?><label><input type="checkbox" name="delete_token" value="1"> Saklanan token’ı sil</label><?php endif; ?>
    <p>Token sunucunun WordPress veritabanında saklanır. Alternatif: wp-config.php içinde VINYL_NOCODB_TOKEN sabiti tanımlanabilir. Salt okunur yetkili token kullanın.</p></td></tr>
    </table><button class="button button-primary" name="save" value="1">Kaydet</button> <button class="button" name="test" value="1">Kaydet ve bağlantıyı test et</button></form>
    <p>Is_Public alanı varsa sadece açıkça doğru işaretlenen kayıtlar yayımlanır. Alan yoksa tüm kayıtların aşağıda izin verilen albüm bilgileri yayımlanır. İmzalı bilgisi Notes alanından türetilir; not metni aktarılmaz. Kapak eşleştirmesi için Ayarlar → Vinyl Discogs bölümünü kullanın.</p></div>
    <?php
}
