<?php
/** NocoDB attachment read support. Public routes never disclose source URL or token. */
defined('ABSPATH') || exit;
function va_nc_attachment_url($value) {
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        $value = is_array($decoded) ? $decoded : array(array('url'=>$value));
    }
    if (!is_array($value)) return '';
    if (!array_is_list($value)) $value = array($value);
    $base = va_nc_settings()['url'];
    foreach ($value as $attachment) {
        if (!is_array($attachment)) continue;
        foreach (array('signedUrl', 'url', 'path') as $field) {
            $candidate = $attachment[$field] ?? '';
            if (!is_string($candidate) || $candidate === '') continue;
            $parts = wp_parse_url($candidate);
            if (!$parts || isset($parts['user']) || isset($parts['pass']) || isset($parts['fragment'])) continue;
            if (isset($parts['scheme']) && !in_array($parts['scheme'], array('http','https'), true)) continue;
            $path = '/' . ltrim($parts['path'] ?? '', '/');
            $decoded = rawurldecode(rawurldecode($path));
            if (!str_starts_with($decoded, '/download/') || preg_match('/[\x00-\x1f\x7f\\\\]/', $decoded)) continue;
            $segments = explode('/', $decoded);
            if (in_array('..', $segments, true) || in_array('.', $segments, true)) continue;
            // Rebase only the known download path onto the configured NocoDB server.
            // Attachment metadata can never choose a destination for the token.
            $path = implode('/', array_map('rawurlencode', $segments));
            $query = isset($parts['query']) ? '?' . $parts['query'] : '';
            if (preg_match('/[\r\n]/', $query)) continue;
            return $base . $path . $query;
        }
    }
    return '';
}
function va_nc_manual_enrich($records) {
    foreach ($records as &$record) {
        $key = $record['manualCoverKey'] ?? '';
        $record['manualCoverUrl'] = preg_match('/^[a-f0-9]{64}$/D', $key) ? rest_url('vinyl-archive/v1/cover/' . $key) : '';
        unset($record['manualCoverKey']);
    }
    unset($record);
    return $records;
}
function va_nc_manual_image($key) {
    if (!preg_match('/^[a-f0-9]{64}$/D', $key)) return new WP_Error('not_found','Kapak bulunamadı.',array('status'=>404));
    $records = va_nc_fetch();
    if (is_wp_error($records)) return new WP_Error('unavailable','Kapak şu anda kullanılamıyor.',array('status'=>503));
    $allowed = false;
    foreach ($records as $record) if (($record['manualCoverKey'] ?? '') === $key) { $allowed = true; break; }
    $sources = get_option('va_nc_attachment_sources', array());
    if (!$allowed || !is_array($sources) || !isset($sources[$key])) return new WP_Error('not_found','Kapak bulunamadı.',array('status'=>404));
    $url = va_nc_attachment_url(array(array('url'=>$sources[$key])));
    if ($url === '' || !va_nc_token()) return new WP_Error('not_found','Kapak bulunamadı.',array('status'=>404));
    $max = 8 * 1024 * 1024;
    $response = wp_remote_get($url, array('timeout'=>20,'redirection'=>0,'sslverify'=>true,'limit_response_size'=>$max+1,'headers'=>array('xc-token'=>va_nc_token())));
    if (is_wp_error($response) || wp_remote_retrieve_response_code($response)!==200) return new WP_Error('download','Kapak alınamadı.',array('status'=>502));
    $body = wp_remote_retrieve_body($response);
    $info = strlen($body) <= $max ? @getimagesizefromstring($body) : false;
    if (!$info || !in_array($info['mime'] ?? '', array('image/jpeg','image/png','image/webp','image/gif'), true) || $info[0]*$info[1] > 40000000) return new WP_Error('image','Desteklenmeyen veya çok büyük görsel.',array('status'=>415));
    return array('body'=>$body, 'type'=>$info['mime']);
}
add_action('rest_api_init', function () {
    register_rest_route('vinyl-archive/v1', '/cover/(?P<key>[a-f0-9]{64})', array('methods'=>'GET','permission_callback'=>'__return_true','callback'=>function ($request) {
        $image = va_nc_manual_image($request['key']);
        if (is_wp_error($image)) return $image;
        header('Content-Type: '.$image['type']);
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, max-age=300');
        echo $image['body'];
        exit;
    }));
});
