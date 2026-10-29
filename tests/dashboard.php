<?php
require __DIR__ . '/nocodb.php';
foreach (['LP'=>'lp','1 LP'=>'lp','LP (2)'=>'double','2LP'=>'double','2 x LP'=>'double','İkili LP'=>'double','Boxset'=>'boxset','3LP'=>'other','10″'=>'ten','Single'=>'single','7 inch'=>'single','Taş plak'=>'shellac','78'=>'shellac','78 RPM'=>'shellac','Flaxy'=>'flexi','Flex'=>'flexi','Flexi'=>'flexi','CD'=>'other',''=>'other'] as $value=>$expected) {
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

check(va_nc_purchase_month('September 25')===[2025,9],'English month and two digit year');
check(va_nc_purchase_month(' JANUARY 24 ')===[2024,1],'trim and case');
check(va_nc_purchase_month('December 1999')===[1999,12],'four digit year');
foreach (['Septembr 25','September','September 20255','2024-02-30',''] as $bad) check(va_nc_purchase_month($bad)===null,'invalid month: '.$bad);
$GLOBALS['responses']=[['status'=>200,'body'=>['list'=>[
 ['Id'=>1,'Artist'=>'A','Album'=>'First','Format'=>'LP (2)','Purchase_Date'=>'September 25'],
 ['Id'=>2,'Artist'=>'B','Album'=>'Second','Format'=>'Flaxy','Purchase_Date'=>'January 24'],
 ['Id'=>3,'Artist'=>'C','Album'=>'Third','Format'=>'78','Purchase_Date'=>'September 25'],
 ['Id'=>4,'Artist'=>'D','Album'=>'Unknown','Format'=>'LP','Purchase_Date'=>''],
]]]];
$records=va_nc_fetch(true);$summary=$GLOBALS['options']['va_nc_dashboard'];
check(array_column($records,'purchaseOrder')===[1,0,1,null],'relative month ordering with ties and unknown');
check($summary['years'][2025][9]['double']===1 && $summary['years'][2025][9]['total']===2,'real month format aggregation');
check($summary['years'][2024][1]['total']===1,'Flaxy monthly count');
check(array_column($records,'formatClass')===['double','flexi','shellac','lp'],'actual DB formats');
check(!str_contains(json_encode($records),'September')&&!str_contains(json_encode($records),'2025')&&!str_contains(json_encode($records),'Purchase_Date'),'purchase month never sent on records');
echo "PASS: actual NocoDB format values, English purchase months, aggregate counts and private relative sorting ranks\n";
