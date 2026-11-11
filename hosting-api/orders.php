<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$configFile = dirname(__DIR__, 2) . '/private/ecogrocer-config.php';
if (!is_file($configFile)) reply(500, ['success' => false, 'message' => 'অর্ডার সার্ভারের কনফিগারেশন সম্পূর্ণ হয়নি।']);
$config = require $configFile;
if (!is_array($config)) reply(500, ['success' => false, 'message' => 'সার্ভার কনফিগারেশন পড়া যায়নি।']);

date_default_timezone_set((string)($config['timezone'] ?? 'Asia/Dhaka'));

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedOrigins = is_array($config['allowed_origins'] ?? null) ? $config['allowed_origins'] : [];
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    reply(403, ['success' => false, 'message' => 'এই ওয়েবসাইট থেকে অর্ডার পাঠানোর অনুমতি নেই।']);
}
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    reply(405, ['success' => false, 'message' => 'শুধু POST অনুরোধ গ্রহণ করা হয়।']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 100000) reply(413, ['success' => false, 'message' => 'অর্ডারের তথ্যের আকার গ্রহণযোগ্য সীমা ছাড়িয়েছে।']);
$data = json_decode($raw, true);
if (!is_array($data)) reply(400, ['success' => false, 'message' => 'অর্ডারের তথ্য সঠিক ফরম্যাটে পাওয়া যায়নি।']);

$catalog = [
'g01'=>389,'g02'=>189,'g03'=>109,'g04'=>80,'g05'=>135,'g06'=>115,'g07'=>37,'g08'=>133,
'v01'=>29,'v02'=>99,'v03'=>25,'v04'=>79,'v05'=>89,'v06'=>39,'v07'=>39,'v08'=>49,
'm01'=>359,'m02'=>319,'m03'=>519,'m04'=>639,'m05'=>619,'m06'=>799,'m07'=>409,'m08'=>1249,
'f01'=>250,'f02'=>400,'f03'=>600,'f04'=>250,'f05'=>450,'f06'=>240,'f07'=>400,'f08'=>210
];

$productMeta = [
'g01'=>['name'=>'মিনিকেট চাল','unit'=>'৫ কেজি'],
'g02'=>['name'=>'সয়াবিন তেল','unit'=>'১ লিটার'],
'g03'=>['name'=>'মসুর ডাল','unit'=>'১ কেজি'],
'g04'=>['name'=>'চিনি','unit'=>'১ কেজি'],
'g05'=>['name'=>'ডিম (লেয়ার)','unit'=>'১২টি'],
'g06'=>['name'=>'আটা','unit'=>'২ কেজি'],
'g07'=>['name'=>'আয়োডিনযুক্ত লবণ','unit'=>'১ কেজি'],
'g08'=>['name'=>'চিনিগুঁড়া চাল','unit'=>'১ কেজি'],
'v01'=>['name'=>'আলু','unit'=>'১ কেজি'],
'v02'=>['name'=>'টমেটো','unit'=>'৫০০ গ্রাম'],
'v03'=>['name'=>'ধনেপাতা','unit'=>'১০০ গ্রাম'],
'v04'=>['name'=>'রসুন (ইমপোর্টেড)','unit'=>'৫০০ গ্রাম'],
'v05'=>['name'=>'কাঁচা মরিচ','unit'=>'২৫০ গ্রাম'],
'v06'=>['name'=>'দেশি শসা','unit'=>'৫০০ গ্রাম'],
'v07'=>['name'=>'দেশি পেঁয়াজ','unit'=>'১ কেজি'],
'v08'=>['name'=>'দেশি গাজর','unit'=>'৫০০ গ্রাম'],
'm01'=>['name'=>'ব্রয়লার মুরগি (চামড়া ছাড়া)','unit'=>'১ কেজি'],
'm02'=>['name'=>'ব্রয়লার মুরগি (চামড়াসহ)','unit'=>'১ কেজি'],
'm03'=>['name'=>'চিকেন লেগ (চামড়াসহ)','unit'=>'১ কেজি'],
'm04'=>['name'=>'দেশি মুরগি (চামড়া ছাড়া)','unit'=>'৫০০ গ্রাম'],
'm05'=>['name'=>'গরুর মাংস (বোনলেস)','unit'=>'৫০০ গ্রাম'],
'm06'=>['name'=>'গরুর মাংস (হাড়সহ)','unit'=>'১ কেজি'],
'm07'=>['name'=>'গরুর কলিজা','unit'=>'৫০০ গ্রাম'],
'm08'=>['name'=>'খাসির মাংস (হাড়সহ)','unit'=>'১ কেজি'],
'f01'=>['name'=>'তেলাপিয়া মাছ','unit'=>'১ কেজি'],
'f02'=>['name'=>'রুই মাছ','unit'=>'১ কেজি'],
'f03'=>['name'=>'কাতলা মাছ','unit'=>'১ কেজি'],
'f04'=>['name'=>'মৃগেল মাছ','unit'=>'১ কেজি'],
'f05'=>['name'=>'শিং মাছ','unit'=>'১ কেজি'],
'f06'=>['name'=>'পাঙ্গাস মাছ','unit'=>'১ কেজি'],
'f07'=>['name'=>'পাবদা মাছ','unit'=>'১ কেজি'],
'f08'=>['name'=>'কৈ মাছ (চাষের)','unit'=>'১ কেজি']
];

$areas = [
'gulshan-1'=>['গুলশান ১',60], 'gulshan-2'=>['গুলশান ২',60], 'niketon'=>['নিকেতন',60],
'baridhara'=>['বারিধারা ডিপ্লোম্যাটিক জোন',70], 'banani'=>['বনানী',70], 'mohakhali'=>['মহাখালী',80],
'baridhara-dohs'=>['বারিধারা DOHS',90], 'banani-dohs'=>['বনানী DOHS',90],
'mohakhali-dohs'=>['মহাখালী DOHS',90], 'badda'=>['বাড্ডা',100],
'shahjadpur'=>['শাহজাদপুর',100], 'notun-bazar'=>['নতুন বাজার',100]
];
$slots = ['08:00-11:00','11:00-14:00','14:00-17:00','17:00-20:00','20:00-22:00'];
$methods = ['cod','bkash','nagad','rocket'];
$coupons = [
'ECO10'=>['percent',10,100,200],
'FRESH50'=>['fixed',50,50,500]
];

$customer = is_array($data['customer'] ?? null) ? $data['customer'] : [];
$delivery = is_array($data['delivery'] ?? null) ? $data['delivery'] : [];
$payment = is_array($data['payment'] ?? null) ? $data['payment'] : [];
$name = trim((string)($customer['name'] ?? ''));
$phone = preg_replace('/\s+/', '', trim((string)($customer['phone'] ?? '')));
$areaId = trim((string)($delivery['areaId'] ?? ''));
$block = trim((string)($delivery['block'] ?? ''));
$road = trim((string)($delivery['road'] ?? ''));
$house = trim((string)($delivery['house'] ?? ''));
$address = trim((string)($delivery['fullAddress'] ?? ''));
$slot = trim((string)($delivery['slot'] ?? ''));
$notes = trim((string)($delivery['notes'] ?? ''));
$paymentMethod = trim((string)($payment['method'] ?? 'cod'));
$payerPhone = preg_replace('/\s+/', '', trim((string)($payment['payerPhone'] ?? '')));
$transactionId = trim((string)($payment['transactionId'] ?? ''));
$couponCode = strtoupper(trim((string)($data['couponCode'] ?? '')));

if (mb_strlen($name, 'UTF-8') < 2 || mb_strlen($name, 'UTF-8') > 80) reply(422, ['success'=>false,'message'=>'সঠিক নাম লিখুন।']);
if (!preg_match('/^01[3-9][0-9]{8}$/', $phone)) reply(422, ['success'=>false,'message'=>'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন।']);
if (!isset($areas[$areaId])) reply(422, ['success'=>false,'message'=>'ডেলিভারি এলাকা নির্বাচন করুন।']);
if ($block === '' || $road === '' || $house === '' || mb_strlen($address, 'UTF-8') < 8) reply(422, ['success'=>false,'message'=>'Block, Road, House/Flat ও সম্পূর্ণ ঠিকানা পূরণ করুন।']);
if (!in_array($slot, $slots, true)) reply(422, ['success'=>false,'message'=>'ডেলিভারি সময় নির্বাচন করুন।']);
if (!in_array($paymentMethod, $methods, true)) reply(422, ['success'=>false,'message'=>'পেমেন্ট পদ্ধতি সঠিক নয়।']);
if ($payerPhone !== '' && !preg_match('/^01[3-9][0-9]{8}$/', $payerPhone)) reply(422, ['success'=>false,'message'=>'পেমেন্ট নম্বরটি সঠিক নয়।']);

$submitted = is_array($data['items'] ?? null) ? $data['items'] : [];
if (count($submitted) < 1 || count($submitted) > 32) reply(422, ['success'=>false,'message'=>'কার্টে থাকা পণ্যের তালিকা সঠিক নয়।']);
$items = [];
$subtotal = 0;
$seen = [];
foreach ($submitted as $line) {
    if (!is_array($line)) reply(422, ['success'=>false,'message'=>'পণ্যের তথ্য সঠিক নয়।']);
    $id = trim((string)($line['id'] ?? ''));
    $qty = filter_var($line['quantity'] ?? null, FILTER_VALIDATE_INT);
    if (!isset($catalog[$id]) || $qty === false || $qty < 1 || $qty > 99 || isset($seen[$id])) {
        reply(422, ['success'=>false,'message'=>'কার্টে থাকা পণ্যের আইডি বা পরিমাণ সঠিক নয়।']);
    }
    $seen[$id] = true;
    $lineTotal = $catalog[$id] * $qty;
    $subtotal += $lineTotal;
    $items[] = ['id'=>$id,'name'=>$productMeta[$id]['name'],'unit'=>$productMeta[$id]['unit'],'quantity'=>$qty,'unitPrice'=>$catalog[$id],'lineTotal'=>$lineTotal];
}

$discount = 0;
if ($couponCode !== '') {
    if (!isset($coupons[$couponCode])) reply(422, ['success'=>false,'message'=>'কুপন কোডটি বৈধ নয়।']);
    [$type,$value,$cap,$minimum] = $coupons[$couponCode];
    if ($subtotal < $minimum) reply(422, ['success'=>false,'message'=>'এই কুপনের জন্য ন্যূনতম ৳' . $minimum . ' কেনাকাটা করতে হবে।']);
    $discount = $type === 'fixed' ? min($subtotal,$value) : min((int)round($subtotal*$value/100),$cap);
}
$deliveryFee = (int)$areas[$areaId][1];
$grandTotal = $subtotal + $deliveryFee - $discount;
$orderCode = 'EG' . date('ymd') . strtoupper(substr(bin2hex(random_bytes(4)),0,8));

try {
    $pdo = new PDO((string)($config['dsn'] ?? ''),(string)($config['username'] ?? ''),(string)($config['password'] ?? ''),[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false
    ]);
    $sql = 'INSERT INTO ecogrocer_orders
      (order_code,customer_name,phone,area_id,area_name,block_name,road_name,house_number,full_address,
       delivery_slot,notes,payment_method,payer_phone,transaction_id,coupon_code,items_json,
       subtotal,delivery_charge,discount,grand_total,order_status)
      VALUES
      (:code,:name,:phone,:area_id,:area_name,:block,:road,:house,:address,:slot,:notes,:payment,
       :payer,:trx,:coupon,:items,:subtotal,:delivery,:discount,:total,:status)';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':code'=>$orderCode,':name'=>$name,':phone'=>$phone,':area_id'=>$areaId,':area_name'=>$areas[$areaId][0],
        ':block'=>$block,':road'=>$road,':house'=>$house,':address'=>$address,':slot'=>$slot,':notes'=>$notes,
        ':payment'=>$paymentMethod,':payer'=>$payerPhone,':trx'=>$transactionId,':coupon'=>$couponCode,
        ':items'=>json_encode($items,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),
        ':subtotal'=>$subtotal,':delivery'=>$deliveryFee,':discount'=>$discount,':total'=>$grandTotal,':status'=>'pending'
    ]);
} catch (Throwable $e) {
    error_log('EcoGrocer order API: ' . $e->getMessage());
    reply(500, ['success'=>false,'message'=>'অর্ডার সংরক্ষণ করা যায়নি। সার্ভার সেটআপ যাচাই করে আবার চেষ্টা করুন।']);
}

reply(201, [
    'success'=>true,
    'orderId'=>$orderCode,
    'subtotal'=>$subtotal,
    'deliveryCharge'=>$deliveryFee,
    'discount'=>$discount,
    'grandTotal'=>$grandTotal,
    'message'=>'অর্ডার সফলভাবে গ্রহণ করা হয়েছে।'
]);
