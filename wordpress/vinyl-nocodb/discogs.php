<?php
/** Discogs cover metadata stays on WordPress; no writes to NocoDB. */
defined('ABSPATH') || exit;
function va_dc_token() { return defined('VINYL_DISCOGS_TOKEN') ? VINYL_DISCOGS_TOKEN : get_option('va_dc_token', ''); }
function va_dc_enabled() { return (bool) get_option('va_dc_enabled', false) && va_dc_token() !== ''; }
function va_dc_id($value) {
    $id = va_nc_text($value);
    return preg_match('/^[1-9][0-9]{0,11}$/D', $id) ? $id : '';
}
function va_dc_image_url($url) {
    if (!is_string($url)) return '';
    $parts = wp_parse_url($url);
    return $parts && ($parts['scheme'] ?? '') === 'https' && in_array($parts['host'] ?? '', array('i.discogs.com', 'img.discogs.com'), true) && !isset($parts['user']) && !isset($parts['pass']) && !isset($parts['port']) ? $url : '';
}
function va_dc_entries() { $value = get_option('va_dc_covers', array()); return is_array($value) ? $value : array(); }
function va_dc_enrich($records) {
    $covers = va_dc_enabled() ? va_dc_entries() : array();
    foreach ($records as &$record) {
        $id = va_dc_id($record['discogsId'] ?? '');
        $entry = $covers[$id] ?? array();
        $record['coverImage'] = ($entry['expires'] ?? 0) > time() ? va_dc_image_url($entry['image'] ?? '') : '';
        $record['discogsUrl'] = $id ? 'https://www.discogs.com/release/' . $id : '';
    }
    unset($record);
    return $records;
}
function va_dc_ids() {
    $records = va_nc_fetch();
    if (is_wp_error($records)) return $records;
    $ids = array();
    foreach ($records as $record) { $id = va_dc_id($record['discogsId'] ?? ''); if ($id !== '') $ids[$id] = $id; }
    return array_values($ids);
}
function va_dc_pending($ids, $refresh = true) {
    $covers = va_dc_entries();
    // Refresh well before expiry. Failed/missing images are retried after one hour.
    foreach ($ids as $id) {
        $entry = $covers[$id] ?? array();
        $due = $refresh ? ($entry['refresh'] ?? 0) : ($entry['expires'] ?? 0);
        if ($due <= time()) return $id;
    }
    return '';
}
function va_dc_fetch_cover($id) {
    if (!va_dc_enabled() || va_dc_id($id) === '') return new WP_Error('disabled', 'Discogs etkin değil veya ID geçersiz.');
    $until = (int) get_option('va_dc_wait_until', 0);
    if ($until > time()) return new WP_Error('throttle', 'Discogs bekleme süresi sürüyor.');
    // Atomic shared lock across admin requests and WP-Cron. At most one API request every two seconds.
    $locked = (int) get_option('va_dc_request_lock', 0);
    if ($locked && $locked < time() - 30) delete_option('va_dc_request_lock');
    if (!add_option('va_dc_request_lock', time(), '', false)) return new WP_Error('throttle', 'Başka bir kapak isteği işleniyor.');
    update_option('va_dc_wait_until', time() + 2, false);
    try {
        $response = wp_remote_get('https://api.discogs.com/releases/' . $id, array(
            'timeout'=>20, 'redirection'=>0, 'sslverify'=>true, 'limit_response_size'=>2 * 1024 * 1024,
            'user-agent'=>'VinylArchive/1.1.1 +https://github.com/egunes007/vinyl',
            'headers'=>array('Authorization'=>'Discogs token=' . va_dc_token(), 'Accept'=>'application/json')
        ));
        if (is_wp_error($response)) return new WP_Error('network', 'Discogs bağlantısı kurulamadı. Sunucunun HTTPS çıkışını kontrol edin.');
        $status = wp_remote_retrieve_response_code($response);
        if ($status === 429) {
            $retry = max(60, min(3600, (int) wp_remote_retrieve_header($response, 'retry-after')));
            update_option('va_dc_wait_until', time() + $retry, false);
            return new WP_Error('throttle', 'Discogs hız sınırı; otomatik olarak beklenecek.');
        }
        if ($status === 401 || $status === 403) {
            update_option('va_dc_wait_until', time() + HOUR_IN_SECONDS, false);
            return new WP_Error('auth', 'Discogs erişimi reddedildi. Token ve API erişim yetkisini kontrol edin.');
        }
        if ($status !== 200 && $status !== 404) return new WP_Error('http', 'Discogs HTTP ' . intval($status) . ' döndürdü.');
        $image = '';
        if ($status === 200) {
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (!is_array($data) || (string) ($data['id'] ?? '') !== (string) $id) return new WP_Error('schema', 'Discogs release yanıtı beklenen biçimde değil.');
            $images = $data['images'] ?? array();
            if (!is_array($images)) return new WP_Error('schema', 'Discogs görsel listesi geçersiz.');
            foreach ($images as $candidate) {
                if (!is_array($candidate)) continue;
                $url = va_dc_image_url($candidate['uri'] ?? '');
                if ($url && (!$image || ($candidate['type'] ?? '') === 'primary')) $image = $url;
                if ($image && ($candidate['type'] ?? '') === 'primary') break;
            }
        }
        $remaining = wp_remote_retrieve_header($response, 'x-discogs-ratelimit-remaining');
        if ($remaining !== '' && is_numeric($remaining) && (int) $remaining <= 1) update_option('va_dc_wait_until', time() + 60, false);
        $entries = va_dc_entries();
        $entries[$id] = array('image'=>$image, 'expires'=>time()+6*HOUR_IN_SECONDS, 'refresh'=>time()+HOUR_IN_SECONDS);
        update_option('va_dc_covers', $entries, false);
        return array('found'=>$image !== '', 'id'=>$id);
    } finally { delete_option('va_dc_request_lock'); }
}
// No API calls on visitor page loads: admin sync and WP-Cron do the work.
add_filter('cron_schedules', function ($schedules) { $schedules['va_dc_minute'] = array('interval'=>60, 'display'=>'Vinyl Discogs'); return $schedules; });
add_action('init', function () {
    if (va_dc_enabled() && !wp_next_scheduled('va_dc_refresh')) wp_schedule_event(time()+60, 'va_dc_minute', 'va_dc_refresh');
    if (!va_dc_enabled()) wp_clear_scheduled_hook('va_dc_refresh');
});
add_action('va_dc_refresh', function () {
    if (!va_dc_enabled()) return;
    $started = microtime(true);
    $ids = va_dc_ids(); if (is_wp_error($ids)) return;
    if (microtime(true) - $started >= 5) return;
    for ($i = 0; $i < 2; $i++) {
        $id = va_dc_pending($ids);
        if (!$id || is_wp_error(va_dc_fetch_cover($id))) break;
        // Leave room for another full HTTP timeout within a typical 30-second PHP budget.
        if ($i === 0) {
            if (microtime(true) - $started >= 3) break;
            sleep(2);
        }
    }
});
add_action('admin_menu', function () { add_options_page('Discogs Kapakları', 'Vinyl Discogs', 'manage_options', 'vinyl-discogs', 'va_dc_admin'); });
add_action('wp_ajax_va_dc_sync', function () {
    if (!current_user_can('manage_options')) wp_send_json_error(array('message'=>'Yetki yok.'), 403);
    check_ajax_referer('va_dc_sync');
    if (!va_dc_enabled()) wp_send_json_error(array('message'=>'Önce Discogs ayarlarını kaydedin.'), 400);
    $ids = va_dc_ids();
    if (is_wp_error($ids)) wp_send_json_error(array('message'=>$ids->get_error_message()), 400);
    $id = va_dc_pending($ids, false);
    if (!$id) wp_send_json_success(array('done'=>true, 'total'=>count($ids)));
    $result = va_dc_fetch_cover($id);
    if (is_wp_error($result)) {
        if ($result->get_error_code() === 'throttle') wp_send_json_success(array('done'=>false, 'wait'=>max(3, (int)get_option('va_dc_wait_until', 0)-time()), 'message'=>$result->get_error_message()));
        wp_send_json_error(array('message'=>$result->get_error_message()), 400);
    }
    wp_send_json_success(array('done'=>false, 'wait'=>2, 'message'=>'Discogs ' . $id . ($result['found'] ? ': kapak eşleştirildi.' : ': kapak bulunamadı; yer tutucu korunuyor.')));
});
function va_dc_admin() {
    if (!current_user_can('manage_options')) return;
    $message = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_admin_referer('va_dc_settings');
        update_option('va_dc_enabled', !empty($_POST['enabled']), false);
        if (!defined('VINYL_DISCOGS_TOKEN')) {
            $token = trim(wp_unslash($_POST['token'] ?? ''));
            if (!empty($_POST['delete_token'])) delete_option('va_dc_token');
            elseif ($token !== '' && preg_match('/^[A-Za-z0-9_-]+$/D', $token)) update_option('va_dc_token', $token, false);
            elseif ($token !== '') $message = 'Token biçimi geçersiz. ';
        }
        delete_option('va_dc_wait_until');
        $message .= 'Ayarlar kaydedildi.';
    }
    $entries = va_dc_entries(); $found = 0;
    foreach ($entries as $entry) if (($entry['expires'] ?? 0) > time() && va_dc_image_url($entry['image'] ?? '')) $found++;
    ?>
    <div class="wrap"><h1>VINYL ARCHIVE — Discogs Kapakları</h1>
    <?php if ($message) : ?><div class="notice notice-info"><p><?php echo esc_html($message); ?></p></div><?php endif; ?>
    <p>NocoDB Discogs_ID alanındaki sayısal release ID değerleri kullanılır. NocoDB’ye yazılmaz; görseller kopyalanmaz, Discogs görsel adresleri geçici olarak saklanır.</p>
    <p><a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener noreferrer">Discogs hesabınızdan kişisel API token oluşturun</a>. Token’ı yalnızca buraya girin; sohbete göndermeyin.</p>
    <form method="post"><?php wp_nonce_field('va_dc_settings'); ?>
    <p><label><input type="checkbox" name="enabled" value="1" <?php checked((bool)get_option('va_dc_enabled', false)); ?>> Discogs kapak eşleştirmesini etkinleştir</label></p>
    <p><label for="dc-token">Discogs API token</label> <input id="dc-token" type="password" name="token" autocomplete="new-password" value="" <?php disabled(defined('VINYL_DISCOGS_TOKEN')); ?>></p>
    <p><?php echo va_dc_token() ? 'Token tanımlı; güvenlik nedeniyle gösterilmez.' : 'Token henüz tanımlanmadı.'; ?> Boş bırakırsanız korunur. NocoDB token’ından farklıdır.</p>
    <?php if (!defined('VINYL_DISCOGS_TOKEN')) : ?><p><label><input name="delete_token" type="checkbox" value="1"> Discogs token’ını sil</label></p><?php endif; ?>
    <p>Token sunucunun WordPress veritabanında saklanır; alternatif olarak wp-config.php içinde VINYL_DISCOGS_TOKEN sabiti tanımlanabilir.</p>
    <p><a href="https://www.discogs.com/developers" target="_blank" rel="noopener noreferrer">API belgeleri</a> · <a href="https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use" target="_blank" rel="noopener noreferrer">API kullanım koşulları</a>. Kapakların telif hakları hak sahiplerindedir; API erişimi görsel lisansı sağlamaz. Kullanımınız için gerekli izinleri kontrol edin.</p>
    <?php submit_button('Ayarları kaydet'); ?></form>
    <hr><p><?php echo intval($found); ?> geçerli kapak eşleşmesi önbellekte. Kapaksız ve geçersiz ID’li plaklarda yer tutucu gösterilir.</p>
    <button id="va-dc-start" class="button button-primary" <?php disabled(!va_dc_enabled()); ?>>Kapakları eşleştir / devam et</button> <button id="va-dc-stop" class="button" disabled>Duraklat</button>
    <p id="va-dc-status" aria-live="polite">İlk eşleştirme bağlantı hızına göre uzun sürebilir. İstek başına 10 saniye sürerse 316 kapak yaklaşık bir saatte tamamlanır. Bu sayfayı açık tutun; duraklatıp sonra devam edebilirsiniz.</p>
    <p>Görsel adresleri en fazla 6 saat saklanır. WordPress zamanlayıcısı arka planda yeniler; az ziyaret edilen sitelerde gecikebilir. Gerekirse bu ekrandan yeniden eşleştirin. Herkese açık sayfalar ve CDN önbelleği kullanıyorsanız eşleştirme sonrası onları da temizleyin.</p></div>
    <script>
    (()=>{const start=document.getElementById('va-dc-start'),stop=document.getElementById('va-dc-stop'),status=document.getElementById('va-dc-status');let running=false,timer,processed=0;
    const halt=()=>{running=false;clearTimeout(timer);start.disabled=false;stop.disabled=true;};
    stop.onclick=()=>{halt();status.textContent='Duraklatıldı. Tamamlanan eşleşmeler korunur.';};
    async function step(){try{const body=new URLSearchParams({action:'va_dc_sync',_ajax_nonce:<?php echo wp_json_encode(wp_create_nonce('va_dc_sync')); ?>});
    const response=await fetch(ajaxurl,{method:'POST',body,credentials:'same-origin'});const result=await response.json();if(!running)return;
    if(!result.success)throw new Error(result.data?.message||'İşlem tamamlanamadı.');
    if(result.data.done){halt();status.textContent='Eşleştirme tamamlandı. '+result.data.total+' benzersiz Discogs release ID kontrol edildi. Siteyi yenileyin.';return;}
    if(result.data.message?.includes('eşleştirildi')||result.data.message?.includes('bulunamadı'))processed++;
    status.textContent=processed+' işlem tamamlandı. '+result.data.message;timer=setTimeout(step,Math.max(2,result.data.wait||2)*1000);
    }catch(error){halt();status.textContent=error.message+' Ayarları kontrol edip devam edebilirsiniz.';}}
    start.onclick=()=>{running=true;processed=0;start.disabled=true;stop.disabled=false;status.textContent='Kapaklar kontrol ediliyor…';step();};})();
    </script>
    <?php
}
