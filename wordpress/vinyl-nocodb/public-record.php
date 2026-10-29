<?php
/** Explicit public allowlist: never return original rows or Notes. */
defined('ABSPATH') || exit;
function va_nc_text($value) {
    if (is_array($value)) $value = implode(', ', array_filter($value, 'is_scalar'));
    return is_scalar($value) ? trim(strip_tags((string) $value)) : '';
}
function va_nc_true($value) { return in_array($value, array(true, 1, '1', 'true', 'TRUE'), true); }
function va_nc_signed($notes) {
    $notes = str_replace(array('İ','I'), array('i','ı'), va_nc_text($notes));
    // Recognize Turkish and ASCII spellings, never mark explicit negatives as signed.
    if (preg_match('/(?<![\p{L}\p{N}])(?:imzas[ıi]z|imzal[ıi]\s*(?:de[gğ]il|yok)|imza\s*yok)(?![\p{L}\p{N}])/iu', $notes)) return false;
    return (bool) preg_match('/(?<![\p{L}\p{N}])imzal[ıi](?![\p{L}\p{N}])/iu', $notes);
}
function va_nc_public_record($row, $fallback) {
    if (array_key_exists('Is_Public', $row) && !va_nc_true($row['Is_Public'])) return null;
    // Empty imported rows are not collection items. Preserve partially filled albums.
    if (va_nc_text($row['Artist'] ?? '') === '' && va_nc_text($row['Album'] ?? '') === '') return null;
    return array(
        'id'=>(string) $fallback,
        'artist'=>va_nc_text($row['Artist'] ?? ''), 'album'=>va_nc_text($row['Album'] ?? ''),
        'year'=>va_nc_text($row['Release_Date'] ?? ''), 'pressingYear'=>va_nc_text($row['Pressing_Date'] ?? ''),
        'country'=>va_nc_text($row['Pressing_Country'] ?? ''), 'label'=>va_nc_text($row['Label'] ?? ''),
        'genre'=>va_nc_text($row['Genre'] ?? ''), 'style'=>va_nc_text($row['Style'] ?? ''),
        'formatClass'=>va_nc_format($row['Format'] ?? ''),
        'artistCountry'=>va_nc_text($row['Artist_Country'] ?? ''),
        'format'=>va_nc_text($row['Format'] ?? ''), 'signed'=>va_nc_signed($row['Notes'] ?? ''),
        'featured'=>va_nc_true($row['Featured'] ?? false),
        'discogsId'=>va_dc_id($row['Discogs_ID'] ?? '')
    );
}
