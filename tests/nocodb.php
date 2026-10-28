<?php
// Standalone WordPress HTTP/cache harness; no real credentials or network calls.
define('ABSPATH', __DIR__);
define('MINUTE_IN_SECONDS', 60);
class WP_Error {
    public function __construct(public $code, public $message) {}
    public function get_error_message() {return $this->message;}
}
function add_action(...$args) {}
function wp_parse_args($args, $defaults) {return array_merge($defaults, $args);}
function get_option($key, $default = null) {return $GLOBALS['options'][$key] ?? $default;}
function get_transient($key) {return $GLOBALS['cache'] ?? false;}
function set_transient($key,$value,$ttl) {$GLOBALS['cache']=$value;}
function is_wp_error($value) {return $value instanceof WP_Error;}
function wp_remote_get($url,$args) {
    check($args['headers']['xc-token']==='test-only-token', 'server header');
    check($args['redirection']===0, 'no token forwarding redirects');
    check($args['sslverify']===true, 'TLS verification');
    $GLOBALS['requests'][]=$url;
    return array_shift($GLOBALS['responses']);
}
function wp_remote_retrieve_response_code($r) {return $r['status'];}
function wp_remote_retrieve_body($r) {return json_encode($r['body']);}
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
$GLOBALS['options']=[];
check(is_wp_error(va_nc_fetch(true)),'missing token');
echo "PASS: field allowlist, visibility, signatures, pagination, caching, HTTP/schema/network failures, missing credentials\n";
