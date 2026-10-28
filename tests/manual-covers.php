<?php
require __DIR__.'/nocodb.php';
function rest_url($path) {return 'https://site.test/wp-json/'.$path;}
$GLOBALS['options']['va_nc_token']='test-only-token';
check(va_nc_attachment_url([['path'=>'download/noco/base/table/cover.jpg']])==='http://192.168.1.13:8080/download/noco/base/table/cover.jpg','attachment path');
check(va_nc_attachment_url('[{"url":"http://casaos.local:8080/download/noco/cover.jpg"}]')==='http://192.168.1.13:8080/download/noco/cover.jpg','JSON attachment and rebase');
check(va_nc_attachment_url([['signedUrl'=>'https://evil.test/download/test.png?signature=private']])==='http://192.168.1.13:8080/download/test.png?signature=private','destination always configured NocoDB');
foreach (['file:///download/x','http://user:pass@server/download/x','http://host/api/v2/tables/x','/download/../api/x','/download/%252e%252e/api/x','/download/x%00.jpg','/download/x%5cy.jpg'] as $url) check(va_nc_attachment_url([['url'=>$url]])==='','reject unsafe path '.$url);
$source='http://192.168.1.13:8080/download/cover.png?signature=private';
$key=hash('sha256',$source);
$GLOBALS['cache']=[['manualCoverKey'=>$key,'artist'=>'A','album'=>'B']];
$GLOBALS['options']['va_nc_attachment_sources']=[$key=>$source];
$public=va_nc_manual_enrich($GLOBALS['cache']);
check(!isset($public[0]['manualCoverKey']),'private key metadata removed');
check(!str_contains(json_encode($public),'signature=private'),'private source URL not disclosed');
check(str_starts_with($public[0]['manualCoverUrl'],'https://site.test/wp-json/'),'site image endpoint');
$GLOBALS['responses']=[['status'=>200,'raw'=>base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZWQAAAAASUVORK5CYII=')]];
$image=va_nc_manual_image($key);
check($image['type']==='image/png','validated raster image proxy');
check(end($GLOBALS['requests'])===$source,'request sent only to configured NocoDB');
$GLOBALS['responses']=[['status'=>200,'raw'=>'<svg onload="alert(1)"></svg>']];
check(is_wp_error(va_nc_manual_image($key)),'SVG/HTML rejected');
$GLOBALS['responses']=[['status'=>302,'body'=>[]]];
check(is_wp_error(va_nc_manual_image($key)),'redirect rejected without token forwarding');
$GLOBALS['cache']=[];
check(is_wp_error(va_nc_manual_image($key)),'removed/hidden record cannot serve image');
check(is_wp_error(va_nc_manual_image('../bad')),'invalid image key');
// Full fetch publishes only public records and privately records attachment sources.
$GLOBALS['cache']=false;
$GLOBALS['responses']=[['status'=>200,'body'=>['list'=>[
 ['Id'=>1,'Artist'=>'A','Album'=>'B','Cover_Image'=>[['url'=>$source]]],
 ['Id'=>2,'Artist'=>'Private','Album'=>'Secret','Is_Public'=>false,'Cover_Image'=>[['path'=>'download/secret.jpg']]]
]]]];
$result=va_nc_fetch(true);
check(count($result)===1 && isset($result[0]['manualCoverKey']),'public cover mapping');
check(count($GLOBALS['options']['va_nc_attachment_sources'])===1,'no hidden attachment stored');
check(!str_contains(json_encode(va_nc_manual_enrich($result)),'signature=private'),'no private URL in public collection');
echo "PASS: manual attachment parsing, private URL isolation, fixed destination, image validation, redirects, hidden records, full collection mapping\n";
