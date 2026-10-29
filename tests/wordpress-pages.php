<?php
define('ABSPATH', __DIR__);
define('OBJECT', 'OBJECT');
$GLOBALS['pages']=[]; $GLOBALS['allowed']=true; $GLOBALS['flushes']=0; $GLOBALS['fail']=false; $GLOBALS['hooks']=[];
function current_user_can($cap) {return $GLOBALS['allowed'];}
function get_page_by_path($slug,$output,$type) {return $GLOBALS['pages'][$slug] ?? null;}
function wp_insert_post($post,$error) {
    if($GLOBALS['fail']) return new stdClass();
    $GLOBALS['pages'][$post['post_name']]=$post;
    return count($GLOBALS['pages']);
}
function is_wp_error($value) {return is_object($value);}
function add_action($hook,$callback) {$GLOBALS['hooks'][$hook][]=$callback;}
function flush_rewrite_rules($hard) {if($hard)throw new Exception('hard flush');$GLOBALS['flushes']++;}
function verify($value,$message) {if(!$value)throw new Exception($message);}
require __DIR__.'/../wordpress/vinyl-archive/pages.php';
verify(isset($GLOBALS['hooks']['after_switch_theme'],$GLOBALS['hooks']['admin_init']),'activation and active-theme upgrade hooks');
$GLOBALS['allowed']=false;vinyl_archive_ensure_pages();verify(!$GLOBALS['pages'],'no visitor writes');
$GLOBALS['allowed']=true;vinyl_archive_ensure_pages();
verify(count($GLOBALS['pages'])===2,'both real pages created');
verify($GLOBALS['pages']['koleksiyon']['post_status']==='publish','collection published');
verify($GLOBALS['pages']['imzali-plaklar']['post_title']==='İmzalı Plaklar','signed page');
verify($GLOBALS['flushes']===1,'refresh permalinks once');
$GLOBALS['pages']['koleksiyon']['post_content']='Existing content';$GLOBALS['pages']['koleksiyon']['post_status']='draft';
vinyl_archive_ensure_pages();verify(count($GLOBALS['pages'])===2&&$GLOBALS['flushes']===1,'idempotent');
verify($GLOBALS['pages']['koleksiyon']['post_content']==='Existing content'&&$GLOBALS['pages']['koleksiyon']['post_status']==='draft','preserve content and visibility');
unset($GLOBALS['pages']['imzali-plaklar']);$GLOBALS['fail']=true;vinyl_archive_ensure_pages();
verify(count($GLOBALS['pages'])===1&&isset($GLOBALS['hooks']['admin_notices']),'failed create visible');
$GLOBALS['fail']=false;vinyl_archive_ensure_pages();verify(count($GLOBALS['pages'])===2,'retry after failure');
echo "PASS: published archive pages, active-theme upgrade, permissions, idempotency, existing content/privacy and failure retry\n";
