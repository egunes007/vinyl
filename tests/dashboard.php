<?php
require __DIR__ . '/nocodb.php';
foreach (['LP'=>'lp','1 LP'=>'lp','2LP'=>'double','2 x LP'=>'double','İkili LP'=>'double','Boxset'=>'boxset','3LP'=>'other','10″'=>'ten','Single'=>'single','7 inch'=>'single','Taş plak'=>'shellac','78 RPM'=>'shellac','Flex'=>'flexi','Flexi'=>'flexi','CD'=>'other',''=>'other'] as $value=>$expected) {
 check(va_nc_format($value)===$expected, 'format: '.$value);
}
$GLOBALS['options']=['va_nc_token'=>'test-only-token'];
$rows=[
 ['Id'=>1,'Artist'=>'A','Album'=>'One','Format'=>'LP','Artist_Country'=>'Türkiye','Purchase_Date'=>'2023-12-31'],
 ['Id'=>2,'Artist'=>'B','Album'=>'Two','Format'=>'2LP','Purchase_Date'=>'2024-01-01'],
 ['Id'=>3,'Artist'=>'B','Album'=>'Three','Format'=>'Single','Purchase_Date'=>'2024-02-29T12:00:00Z'],
 ['Id'=>4,'Artist'=>'B','Album'=>'Four','Format'=>'Boxset','Purchase_Date'=>'2024-12-01'],
 ['Id'=>5,'Artist'=>'C','Album'=>'Five','Format'=>'Flexi','Purchase_Date'=>'2024-01-01'],
 ['Id'=>6,'Artist'=>'C','Album'=>'Six','Format'=>'LP','Purchase_Date'=>'2023-02-29'],
 ['Id'=>7,'Artist'=>'D','Album'=>'Hidden','Format'=>'LP','Purchase_Date'=>'2022-01-01','Is_Public'=>false],
];
$rows[]=$rows[0]; // Duplicate primary key must affect neither totals nor months.
$GLOBALS['responses']=[['status'=>200,'body'=>['list'=>$rows]]];
$result=va_nc_fetch(true);$stats=$GLOBALS['options']['va_nc_dashboard'];
check(count($result)===6,'one collection record counts once');
check($stats['years'][2023][12]['lp']===1,'previous year');
check($stats['years'][2024][1]['double']===1,'double LP counts as one');
check($stats['years'][2024][1]['total']===2,'other formats included in monthly total');
check($stats['years'][2024][2]['single']===1,'leap day and timestamp');
check($stats['years'][2024][12]['boxset']===1,'boxset');
check($stats['undated']===1,'invalid calendar date');
check(!isset($stats['years'][2022]),'private rows excluded from aggregates');
check($result[0]['artistCountry']==='Türkiye','artist country independent of pressing country');
$encoded=json_encode(['albums'=>$result,'dashboard'=>$stats]);
check(!str_contains($encoded,'Purchase_Date')&&!str_contains($encoded,'2023-12-31')&&!str_contains($encoded,'2024-02-29'),'no individual dates in public payload');
echo "PASS: format classification, public-only monthly aggregation, deduplication, invalid dates and date privacy\n";
