<?php
/** Aggregate only public, deduplicated records. Never retain individual purchase dates. */
defined('ABSPATH') || exit;
function va_nc_format($value) {
    $s = strtolower(str_replace(array('İ','ı','″','“','”','’','×'), array('i','i','"','"','"', "'", 'x'), va_nc_text($value)));
    $s = preg_replace('/\s+/u', ' ', $s);
    // Confirmed NocoDB values: LP / 2LP / Boxset / 10″ / Single / 78 RPM / Flex.
    // Keep explicit aliases; never classify unknown multi-disc formats as single LP.
    $formats = array(
        'lp'=>'lp', '1 lp'=>'lp', '1lp'=>'lp',
        '2lp'=>'double', '2 lp'=>'double', '2 x lp'=>'double', '2xlp'=>'double', 'ikili lp'=>'double', 'double lp'=>'double',
        'boxset'=>'boxset', 'box set'=>'boxset',
        '10"'=>'ten', '10 inch'=>'ten', '10 inç'=>'ten',
        'single'=>'single', '7"'=>'single', '7 inch'=>'single',
        '78 rpm'=>'shellac', 'taş plak'=>'shellac', 'shellac'=>'shellac',
        'flex'=>'flexi', 'flexi'=>'flexi'
    );
    return $formats[$s] ?? 'other';
}
function va_nc_dashboard_add(&$stats, $row) {
    $format = va_nc_format($row['Format'] ?? '');
    $date = va_nc_text($row['Purchase_Date'] ?? '');
    // Accept ISO dates/timestamps only, validating the calendar date before grouping.
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/D', $date, $m) || !checkdate((int)$m[2], (int)$m[3], (int)$m[1])) {
        $stats['undated']++;
        return;
    }
    $year = $m[1]; $month = (int)$m[2];
    if (!isset($stats['years'][$year][$month])) $stats['years'][$year][$month] = array('lp'=>0,'double'=>0,'single'=>0,'boxset'=>0,'total'=>0);
    $stats['years'][$year][$month]['total']++;
    if (isset($stats['years'][$year][$month][$format])) $stats['years'][$year][$month][$format]++;
}
