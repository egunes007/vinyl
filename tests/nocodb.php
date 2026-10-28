<?php
// Standalone WordPress HTTP/cache harness; no real credentials or network calls.
define('ABSPATH', __DIR__);
define('MINUTE_IN_SECONDS', 60);
define('HOUR_IN_SECONDS',3600);
class WP_Error {
    public function __construct(public $code, public $message) {}
    public function get_error_code() {return $this->code;}
    public function get_error_message() {return $this->message;}
}
function add_action(...$args) {}
function add_filter(...$args) {}
function register_deactivation_hook(...$args) {}
function wp_parse_args($args, $defaults) {return array_merge($defaults, $args);}
function get_option($key, $default = null) {return $GLOBALS['options'][$key] ?? $default;}
function wp_parse_url($url) {return parse_url($url);}
function update_option($key,$value,$autoload=false) {$GLOBALS['options'][$key]=$value;}
function add_option($key,$value,$deprecated='', $autoload=false) {if(isset($GLOBALS['options'][$key]))return false;$GLOBALS['options'][$key]=$value;return true;}
function delete_option($key) {unset($GLOBALS['options'][$key]);}
function wp_remote_retrieve_header($r,$key) {return $r['headers'][$key] ?? '';}
function get_transient($key) {return $GLOBALS['cache'] ?? false;}
function set_transient($key,$value,$ttl) {$GLOBALS['cache']=$value;}
function is_wp_error($value) {return $value instanceof WP_Error;}
function wp_remote_get($url,$args) {
    if (str_starts_with($url,'https://api.discogs.com/')) {
        check($args['headers']['Authorization']==='Discogs token=discogs-test-only', 'Discogs auth on server');
        check(!isset($args['headers']['xc-token']), 'no NocoDB token to Discogs');
        check($args['user-agent']!=='','Discogs user agent');
        check($args['timeout']===20,'allow observed 10.3-second Discogs response');
    } else check($args['headers']['xc-token']==='test-only-token', 'server header');
    check($args['redirection']===0, 'no token forwarding redirects');
    check($args['sslverify']===true, 'TLS verification');
    $GLOBALS['requests'][]=$url;
    return array_shift($GLOBALS['responses']);
}
function wp_remote_retrieve_response_code($r) {return $r['status'];}
function wp_remote_retrieve_body($r) {return $r['raw'] ?? json_encode($r['body']);}
function check($condition, $label) {if (!$condition) throw new Exception($label);}
require __DIR__.'/../wordpress/vinyl-nocodb/vinyl-nocodb.php';
$GLOBALS['options']=['va_nc_token'=>'test-only-token'];
$row=['Artist'=>'Sanatçı','Album'=>'Albüm','Notes'=>'İmzalı; özel not','Price'=>100,'Purchase_Date'=>'2025-01-01','Is_Public'=>true,'Pressing_Date'=>'2020','Genre'=>['Rock','Alternative']];
$mapped=va_nc_public_record($row,1);
check($mapped['signed']===true,'signed Turkish');
check($mapped['genre']==='Rock, Alternative','array field mapping');
check(!isset($mapped['Notes']) && !isset($mapped['Price']) && !isset($mapped['Purchase_Date']),'private fields excluded');
check(va_nc_public_record(array_merge($row,['Is_Public'=>false]),2)===null,'hidden records excluded');
check(va_nc_public_record(array_merge($row,['Is_Public'=>'false']),2)===null,'false string excluded');
check(va_nc_public_record(array_merge($row,['Is_Public'=>null]),2)===null,'null privacy fails closed');
foreach (['imzalı','İMZALI','imzali','Kapak imzalı.'] as $note) check(va_nc_signed($note),'positive: '.$note);
foreach (['imzasız','imzalı değil','imzali degil','İMZALI DEĞİL','imza yok','imzalıyım',''] as $note) check(!va_nc_signed($note),'negative: '.$note);
$GLOBALS['responses']=[['status'=>200,'body'=>['list'=>array_fill(0,100,$row),'pageInfo'=>['isLastPage'=>false]]],['status'=>200,'body'=>['list'=>[array_merge($row,['Is_Public'=>false]),$row],'pageInfo'=>['isLastPage'=>true]]]];
$result=va_nc_fetch(true);
check(count($result)===101,'pagination and visibility');
check(str_contains($GLOBALS['requests'][1],'offset=100'),'pagination offset');
check(count(array_unique(array_column($result,'id')))===101,'unique public ids');
check(!str_contains(json_encode($result),'özel not'),'no raw notes');
$beforeRequests=count($GLOBALS['requests']);
va_nc_fetch();check(count($GLOBALS['requests'])===$beforeRequests,'cache reused');
foreach ([['status'=>401,'body'=>['secret'=>'never show']],['status'=>200,'body'=>['list'=>[['wrong'=>'fields']]]],['status'=>200,'body'=>['wrong'=>'shape']]] as $response) {
 $GLOBALS['cache']=false;$GLOBALS['responses']=[$response];
 check(is_wp_error(va_nc_fetch(true)),'error response rejected');
 check($GLOBALS['cache']===false,'failed requests not cached');
}
$GLOBALS['responses']=[new WP_Error('transport','private network details')];
check(va_nc_fetch(true)->get_error_message()==='NocoDB bağlantısı kurulamadı. Adresi, portu ve Docker ağını kontrol edin.','network errors redacted');
// Regression: 316 populated records + 616 empty imported rows must count as 316.
$fixture=[];
for ($i=1;$i<=932;$i++) $fixture[]= $i<=316 ? array_merge($row,['Id'=>$i]) : ['Id'=>$i,'Artist'=>null,'Album'=>'  '];
$GLOBALS['cache']=false;$GLOBALS['responses']=[];
foreach (array_chunk($fixture,100) as $chunk) $GLOBALS['responses'][]=['status'=>200,'body'=>['list'=>$chunk]];
check(count(va_nc_fetch(true))===316,'316 records plus 616 blank rows');
check(va_nc_public_record(['Artist'=>'','Album'=>'Only album'],0)!==null,'preserve partial record');
check(va_nc_public_record(['Artist'=>'Only artist','Album'=>''],0)!==null,'preserve partial artist');
$GLOBALS['cache']=false;
$GLOBALS['responses']=[['status'=>200,'body'=>['list'=>[array_merge($row,['Id'=>1]),array_merge($row,['Id'=>1]),array_merge($row,['Id'=>2])]]]];
check(count(va_nc_fetch(true))===2,'same API ID deduped, distinct pressings retained');
$GLOBALS['options']=[];
check(is_wp_error(va_nc_fetch(true)),'missing token');
echo "PASS: field allowlist, visibility, signatures, pagination, caching, HTTP/schema/network failures, missing credentials, blank rows and duplicate API IDs\n";
