<?php
/** Aggregate only public, deduplicated records. Never retain individual purchase dates. */
defined('ABSPATH') || exit;
function va_nc_format($value) {
    $s = strtolower(str_replace(array('İ','ı','″','“','”','’','×'), array('i','i','"','"','"', "'", 'x'), va_nc_text($value)));
    $s = preg_replace('/\s+/u', ' ', $s);
    // Confirmed NocoDB values: LP / LP (2) / Boxset / 10″ / Single / 78 / Flaxy.
    // Keep explicit aliases; never classify unknown multi-disc formats as single LP.
    $formats = array(
        'lp'=>'lp', '1 lp'=>'lp', '1lp'=>'lp',
        'lp (2)'=>'double', '2lp'=>'double', '2 lp'=>'double', '2 x lp'=>'double', '2xlp'=>'double', 'ikili lp'=>'double', 'double lp'=>'double',
        'boxset'=>'boxset', 'box set'=>'boxset',
        '10"'=>'ten', '10 inch'=>'ten', '10 inç'=>'ten',
        'single'=>'single', '7"'=>'single', '7 inch'=>'single',
        '78'=>'shellac', '78 rpm'=>'shellac', 'taş plak'=>'shellac', 'shellac'=>'shellac',
        'flaxy'=>'flexi', 'flex'=>'flexi', 'flexi'=>'flexi'
    );
    return $formats[$s] ?? 'other';
}
/** Parse private purchase months. Two-digit years consistently mean 2000–2099. */
function va_nc_purchase_month($value) {
    $date = va_nc_text($value);
    $months = array('january'=>1,'february'=>2,'march'=>3,'april'=>4,'may'=>5,'june'=>6,'july'=>7,'august'=>8,'september'=>9,'october'=>10,'november'=>11,'december'=>12);
    if (preg_match('/^([a-z]+)\s+(\d{2}|\d{4})$/iD', $date, $m) && isset($months[strtolower($m[1])])) {
        $year = strlen($m[2]) === 2 ? 2000 + (int)$m[2] : (int)$m[2];
        return $year > 0 ? array($year, $months[strtolower($m[1])]) : null;
    }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/D', $date, $m) && checkdate((int)$m[2], (int)$m[3], (int)$m[1])) return array((int)$m[1], (int)$m[2]);
    return null;
}
function va_nc_dashboard_add(&$stats, $row) {
    $format = va_nc_format($row['Format'] ?? '');
    $month = va_nc_purchase_month($row['Purchase_Date'] ?? '');
    if ($month === null) { $stats['undated']++; return; }
    list($year, $month) = $month;
    if (!isset($stats['years'][$year][$month])) $stats['years'][$year][$month] = array('lp'=>0,'double'=>0,'single'=>0,'boxset'=>0,'total'=>0);
    $stats['years'][$year][$month]['total']++;
    if (isset($stats['years'][$year][$month][$format])) $stats['years'][$year][$month][$format]++;
}
