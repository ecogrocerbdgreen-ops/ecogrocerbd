-- EcoGrocer BD: production e-commerce core
-- Applied automatically by Netlify Database migrations on supported database plans.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  name_bn text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.products (
  id text primary key,
  category_id text not null references public.categories(id),
  name text not null,
  english_name text not null default '',
  description text not null default '',
  aliases text[] not null default '{}',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  unit text not null,
  image_url text not null default '',
  featured boolean not null default false,
  is_active boolean not null default true,
  track_inventory boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_areas (
  id text primary key,
  name text not null,
  fee numeric(10,2) not null check (fee >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.delivery_slots (
  id text primary key,
  label text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.coupons (
  code text primary key,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_discount numeric(10,2),
  minimum_order numeric(10,2) not null default 0,
  usage_limit integer,
  usage_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','out_for_delivery','delivered','cancelled','refunded')),
  payment_method text not null check (payment_method in ('cod','bkash','nagad','rocket')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending_verification','paid','failed','refunded')),
  payment_gateway text not null default '',
  payment_gateway_transaction_id text not null default '',
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null default '',
  customer_phone text not null,
  delivery_area_id text not null references public.delivery_areas(id),
  delivery_area_name text not null,
  delivery_fee numeric(10,2) not null,
  block_name text not null,
  road_name text not null,
  house_number text not null,
  full_address text not null,
  delivery_slot_id text not null references public.delivery_slots(id),
  delivery_notes text not null default '',
  payer_phone text not null default '',
  transaction_id text not null default '',
  coupon_code text,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  grand_total numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  gateway text not null,
  gateway_transaction_id text not null unique,
  session_key text not null default '',
  validation_id text not null default '',
  bank_transaction_id text not null default '',
  amount numeric(10,2) not null,
  currency text not null default 'BDT',
  status text not null default 'initiated'
    check (status in ('initiated','pending','paid','failed','cancelled','review')),
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  unit text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  inventory_reserved boolean not null default false
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_phone_idx on public.orders(customer_phone);
create index if not exists products_category_active_idx on public.products(category_id, is_active);
create index if not exists products_featured_idx on public.products(featured) where is_active = true;
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists orders_customer_user_idx on public.orders(customer_user_id);
create index if not exists payments_order_idx on public.payment_transactions(order_id);

insert into public.categories (id,name,name_bn,sort_order) values
('grocery','Grocery','মুদি পণ্য',1),
('vegetables','Vegetables','শাক-সবজি',2),
('meat','Meat','মাংস',3),
('fish','Fish','মাছ',4)
on conflict (id) do nothing;

insert into public.products
(id,category_id,name,english_name,price,unit,featured,aliases,image_url,sort_order)
values
('g01','grocery','মিনিকেট চাল','Miniket Rice',389,'৫ কেজি',true,array['miniket','chal','chaal','rice'],'https://images.pexels.com/photos/31555432/pexels-photo-31555432/free-photo-of-white-bowl-of-uncooked-rice-close-up.jpeg?auto=compress&dpr=1&h=750&w=1260',1),
('g02','grocery','সয়াবিন তেল','Soybean Oil',189,'১ লিটার',true,array['tel','oil','soybean'],'https://images.unsplash.com/photo-1763704189952-660d9055abbb?auto=format&fit=crop&w=900&q=80',2),
('g03','grocery','মসুর ডাল','Red Lentils',109,'১ কেজি',true,array['moshur dal','masoor dal','dal','lentil'],'https://images.unsplash.com/photo-1730591857303-0fa44be3f677?auto=format&fit=crop&w=900&q=80',3),
('g04','grocery','চিনি','Sugar',80,'১ কেজি',false,array['chini','sugar'],'https://images.pexels.com/photos/15206766/pexels-photo-15206766/free-photo-of-spoon-in-glass-of-sugar.jpeg?auto=compress&dpr=1&h=750&w=1260',4),
('g05','grocery','ডিম (লেয়ার)','Layer Eggs',135,'১২টি',true,array['dim','egg','eggs'],'https://images.unsplash.com/photo-1772472023164-61a6f0da9200?auto=format&fit=crop&w=900&q=80',5),
('g06','grocery','আটা','Wheat Flour',115,'২ কেজি',false,array['atta','flour','wheat'],'https://images.pexels.com/photos/17236203/pexels-photo-17236203/free-photo-of-a-bowl-of-flour.jpeg?auto=compress&dpr=1&h=750&w=1260',6),
('g07','grocery','আয়োডিনযুক্ত লবণ','Iodized Salt',37,'১ কেজি',false,array['lobon','salt','iodized salt'],'https://images.unsplash.com/photo-1745192621767-0393e7161f11?auto=format&fit=crop&w=900&q=80',7),
('g08','grocery','চিনিগুঁড়া চাল','Chinigura Rice',133,'১ কেজি',false,array['chini gura','chinigura','aromatic rice'],'https://images.pexels.com/photos/31555433/pexels-photo-31555433/free-photo-of-bowl-of-raw-rice-on-a-white-background.jpeg?auto=compress&dpr=1&h=750&w=1260',8),
('v01','vegetables','আলু','Regular Potato',29,'১ কেজি',true,array['alu','aloo','potato'],'https://images.unsplash.com/photo-1635847163737-c93e3d73bcc6?auto=format&fit=crop&w=900&q=80',1),
('v02','vegetables','টমেটো','Red Tomato',99,'৫০০ গ্রাম',true,array['tomato','tometo'],'https://images.unsplash.com/photo-1769489023736-ae94eb8f3a38?auto=format&fit=crop&w=900&q=80',2),
('v03','vegetables','ধনেপাতা','Coriander Leaves',25,'১০০ গ্রাম',false,array['dhonepata','dhonia pata','coriander'],'https://images.unsplash.com/photo-1767156969831-0beee76fa958?auto=format&fit=crop&w=900&q=80',3),
('v04','vegetables','রসুন (ইমপোর্টেড)','Imported Garlic',79,'৫০০ গ্রাম',false,array['roshun','rosun','garlic'],'https://images.unsplash.com/photo-1754891785053-854ef42468cc?auto=format&fit=crop&w=900&q=80',4),
('v05','vegetables','কাঁচা মরিচ','Green Chilli',89,'২৫০ গ্রাম',false,array['kacha morich','morich','chilli','chili'],'https://images.unsplash.com/photo-1756363866183-56d98ad88214?auto=format&fit=crop&w=900&q=80',5),
('v06','vegetables','দেশি শসা','Local Cucumber',39,'৫০০ গ্রাম',false,array['shosha','sosha','cucumber'],'https://images.unsplash.com/photo-1757892797773-dd669db9af90?auto=format&fit=crop&w=900&q=80',6),
('v07','vegetables','দেশি পেঁয়াজ','Local Onion',39,'১ কেজি',false,array['peyaj','piyaj','onion'],'https://images.unsplash.com/photo-1543077689-082dc39735be?auto=format&fit=crop&w=900&q=80',7),
('v08','vegetables','দেশি গাজর','Local Carrot',49,'৫০০ গ্রাম',false,array['gajor','carrot'],'https://images.unsplash.com/photo-1717959159782-98c42b1d4f37?auto=format&fit=crop&w=900&q=80',8),
('m01','meat','ব্রয়লার মুরগি (চামড়া ছাড়া)','Broiler Chicken Skin Off',359,'১ কেজি',true,array['murgi','chicken','broiler'],'https://images.unsplash.com/photo-1642497394469-188b0f4bcae6?auto=format&fit=crop&w=900&q=80',1),
('m02','meat','ব্রয়লার মুরগি (চামড়াসহ)','Broiler Chicken Skin On',319,'১ কেজি',false,array['murgi','chicken','broiler skin on'],'https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg?auto=compress&dpr=1&h=750&w=1260',2),
('m03','meat','চিকেন লেগ (চামড়াসহ)','Chicken Leg Skin On',519,'১ কেজি',false,array['chicken leg','leg piece'],'https://images.pexels.com/photos/7140316/pexels-photo-7140316.jpeg?auto=compress&dpr=1&h=750&w=1260',3),
('m04','meat','দেশি মুরগি (চামড়া ছাড়া)','Deshi Chicken Skin Off',639,'৫০০ গ্রাম',false,array['deshi murgi','native chicken'],'https://images.unsplash.com/photo-1642102903996-cdad15f5dcdd?auto=format&fit=crop&w=900&q=80',4),
('m05','meat','গরুর মাংস (বোনলেস)','Beef Boneless',619,'৫০০ গ্রাম',true,array['gorur mangsho','beef','boneless'],'https://images.pexels.com/photos/7495481/pexels-photo-7495481.png?auto=compress&dpr=1&h=750&w=1260',5),
('m06','meat','গরুর মাংস (হাড়সহ)','Beef Bone In',799,'১ কেজি',false,array['gorur mangsho','beef','bone in'],'https://images.pexels.com/photos/6896518/pexels-photo-6896518.jpeg?auto=compress&dpr=1&h=750&w=1260',6),
('m07','meat','গরুর কলিজা','Beef Liver',409,'৫০০ গ্রাম',false,array['kolija','liver','beef liver'],'https://images.pexels.com/photos/18606624/pexels-photo-18606624/free-photo-of-close-up-of-meat-and-livers.jpeg?auto=compress&dpr=1&h=750&w=1260',7),
('m08','meat','খাসির মাংস (হাড়সহ)','Mutton Bone In',1249,'১ কেজি',false,array['khashi','khasi','mutton','goat meat'],'https://images.pexels.com/photos/31732110/pexels-photo-31732110/free-photo-of-close-up-of-raw-lamb-chops-with-marbling.jpeg?auto=compress&dpr=1&h=750&w=1260',8),
('f01','fish','তেলাপিয়া মাছ','Tilapia Fish',250,'১ কেজি',true,array['telapia','tilapia','fish','mach'],'https://images.pexels.com/photos/15553656/pexels-photo-15553656/free-photo-of-stack-of-fresh-fish-at-market.jpeg?auto=compress&dpr=1&h=750&w=1260',1),
('f02','fish','রুই মাছ','Rui Fish',400,'১ কেজি',true,array['rui','rohu','fish','mach'],'https://images.pexels.com/photos/10112470/pexels-photo-10112470.jpeg?auto=compress&dpr=1&h=750&w=1260',2),
('f03','fish','কাতলা মাছ','Katla Fish',600,'১ কেজি',false,array['katla','catla','fish','mach'],'https://images.pexels.com/photos/29307537/pexels-photo-29307537/free-photo-of-fresh-fish-display-on-a-market-stall.jpeg?auto=compress&dpr=1&h=750&w=1260',3),
('f04','fish','মৃগেল মাছ','Mrigel Fish',250,'১ কেজি',false,array['mrigel','fish','mach'],'https://images.pexels.com/photos/36122229/pexels-photo-36122229/free-photo-of-fresh-fish-display-at-local-market-stall.jpeg?auto=compress&dpr=1&h=750&w=1260',4),
('f05','fish','শিং মাছ','Shing Fish',450,'১ কেজি',false,array['shing','sing','fish','mach'],'https://images.pexels.com/photos/7451965/pexels-photo-7451965.jpeg?auto=compress&dpr=1&h=750&w=1260',5),
('f06','fish','পাঙ্গাস মাছ','Pangas Fish',240,'১ কেজি',false,array['pangas','pangash','fish','mach'],'https://images.pexels.com/photos/40700642/pexels-photo-40700642/free-photo-of-fresh-hilsa-fish-on-ice-in-dhaka-market.jpeg?auto=compress&dpr=1&h=750&w=1260',6),
('f07','fish','পাবদা মাছ','Pabda Fish',400,'১ কেজি',false,array['pabda','fish','mach'],'https://images.unsplash.com/photo-1756361945963-4b08e8b7ef3e?auto=format&fit=crop&w=900&q=80',7),
('f08','fish','কৈ মাছ (চাষের)','Farmed Koi Fish',210,'১ কেজি',false,array['koi','koi mach','fish','mach'],'https://images.unsplash.com/photo-1773158096376-3e0f1af05706?auto=format&fit=crop&w=900&q=80',8)
on conflict (id) do nothing;

insert into public.delivery_areas (id,name,fee,sort_order) values
('gulshan-1','গুলশান ১',60,1),('gulshan-2','গুলশান ২',60,2),('niketon','নিকেতন',60,3),
('baridhara','বারিধারা ডিপ্লোম্যাটিক জোন',70,4),('banani','বনানী',70,5),('mohakhali','মহাখালী',80,6),
('baridhara-dohs','বারিধারা DOHS',90,7),('banani-dohs','বনানী DOHS',90,8),
('mohakhali-dohs','মহাখালী DOHS',90,9),('badda','বাড্ডা',100,10),
('shahjadpur','শাহজাদপুর',100,11),('notun-bazar','নতুন বাজার',100,12)
on conflict (id) do nothing;

insert into public.delivery_slots (id,label,sort_order) values
('08:00-11:00','সকাল ৮টা – ১১টা',1),
('11:00-14:00','সকাল ১১টা – দুপুর ২টা',2),
('14:00-17:00','দুপুর ২টা – বিকাল ৫টা',3),
('17:00-20:00','বিকাল ৫টা – রাত ৮টা',4),
('20:00-22:00','রাত ৮টা – রাত ১০টা',5)
on conflict (id) do nothing;

insert into public.coupons (code,discount_type,discount_value,max_discount,minimum_order) values
('ECO10','percent',10,100,200),
('FRESH50','fixed',50,null,500)
on conflict (code) do nothing;

create or replace function public.place_ecogrocer_order(p_order jsonb, p_customer_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer jsonb := coalesce(p_order->'customer','{}'::jsonb);
  v_delivery jsonb := coalesce(p_order->'delivery','{}'::jsonb);
  v_payment jsonb := coalesce(p_order->'payment','{}'::jsonb);
  v_name text := trim(coalesce(v_customer->>'name',''));
  v_phone text := regexp_replace(coalesce(v_customer->>'phone',''), '\s','','g');
  v_area_id text := coalesce(v_delivery->>'areaId','');
  v_slot_id text := coalesce(v_delivery->>'slot','');
  v_area public.delivery_areas%rowtype;
  v_slot public.delivery_slots%rowtype;
  v_coupon public.coupons%rowtype;
  v_code text := upper(trim(coalesce(p_order->>'couponCode','')));
  v_payment_method text := coalesce(v_payment->>'method','cod');
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_delivery numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_line numeric(10,2);
  v_count integer := 0;
  v_payment_status text := 'unpaid';
begin
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'সঠিক নাম লিখুন।';
  end if;
  if v_phone !~ '^01[3-9][0-9]{8}$' then
    raise exception 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন।';
  end if;
  if v_payment_method not in ('cod','bkash','nagad','rocket') then
    raise exception 'পেমেন্ট পদ্ধতি সঠিক নয়।';
  end if;
  if length(trim(coalesce(v_delivery->>'block',''))) = 0
    or length(trim(coalesce(v_delivery->>'road',''))) = 0
    or length(trim(coalesce(v_delivery->>'house',''))) = 0
    or length(trim(coalesce(v_delivery->>'fullAddress',''))) < 8 then
    raise exception 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।';
  end if;

  select * into v_area from public.delivery_areas where id = v_area_id and is_active = true;
  if not found then raise exception 'ডেলিভারি এলাকা পাওয়া যায়নি।'; end if;
  select * into v_slot from public.delivery_slots where id = v_slot_id and is_active = true;
  if not found then raise exception 'ডেলিভারি সময় পাওয়া যায়নি।'; end if;

  if jsonb_typeof(p_order->'items') is distinct from 'array' then
    raise exception 'কার্টে পণ্যের তালিকা সঠিক নয়।';
  end if;
  if jsonb_array_length(p_order->'items') < 1 or jsonb_array_length(p_order->'items') > 32 then
    raise exception 'কার্টে পণ্যের তালিকা সঠিক নয়।';
  end if;

  for v_item in select value from jsonb_array_elements(p_order->'items') order by value->>'id'
  loop
    v_count := v_count + 1;
    if coalesce(v_item->>'quantity','') !~ '^[0-9]+$' then
      raise exception 'পণ্যের পরিমাণ সঠিক নয়।';
    end if;
    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 or v_qty > 99 then
      raise exception 'পণ্যের পরিমাণ সঠিক নয়।';
    end if;
    select * into v_product from public.products
      where id = v_item->>'id' and is_active = true for update;
    if not found then raise exception 'একটি পণ্য বর্তমানে পাওয়া যাচ্ছে না।'; end if;
    if v_product.track_inventory and v_product.stock_quantity < v_qty then
      raise exception 'স্টকে পর্যাপ্ত পণ্য নেই: %', v_product.name;
    end if;
    v_line := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line;
    if v_product.track_inventory then
      update public.products
      set stock_quantity = stock_quantity - v_qty, updated_at = now()
      where id = v_product.id;
    end if;
  end loop;

  if v_count <> (select count(distinct value->>'id') from jsonb_array_elements(p_order->'items')) then
    raise exception 'একই পণ্য একাধিকবার পাঠানো যাবে না।';
  end if;

  if v_code <> '' then
    select * into v_coupon from public.coupons where code = v_code and is_active = true for update;
    if not found then raise exception 'কুপন কোডটি বৈধ নয়।'; end if;
    if v_coupon.starts_at is not null and now() < v_coupon.starts_at then raise exception 'কুপনটি এখনো চালু হয়নি।'; end if;
    if v_coupon.expires_at is not null and now() > v_coupon.expires_at then raise exception 'কুপনের মেয়াদ শেষ।'; end if;
    if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then raise exception 'কুপনের ব্যবহার সীমা শেষ।'; end if;
    if v_subtotal < v_coupon.minimum_order then raise exception 'এই কুপনের জন্য ন্যূনতম অর্ডার ৳' || v_coupon.minimum_order || '।'; end if;
    if v_coupon.discount_type = 'fixed' then
      v_discount := least(v_subtotal,v_coupon.discount_value);
    else
      v_discount := round(v_subtotal * v_coupon.discount_value / 100,2);
      if v_coupon.max_discount is not null then v_discount := least(v_discount,v_coupon.max_discount); end if;
    end if;
    update public.coupons set usage_count = usage_count + 1 where code = v_code;
  end if;

  v_delivery := v_area.fee;
  v_total := greatest(0,v_subtotal + v_delivery - v_discount);
  if v_payment_method <> 'cod' then v_payment_status := 'pending_verification'; end if;

  v_order_number := 'EG' || to_char(now() at time zone 'Asia/Dhaka','YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders (
    order_number,status,payment_method,payment_status,customer_user_id,customer_name,customer_email,customer_phone,
    delivery_area_id,delivery_area_name,delivery_fee,block_name,road_name,house_number,
    full_address,delivery_slot_id,delivery_notes,payer_phone,transaction_id,coupon_code,
    subtotal,discount,grand_total
  ) values (
    v_order_number,'pending',v_payment_method,v_payment_status,p_customer_user_id,v_name,
    trim(coalesce(v_customer->>'email','')),v_phone,v_area.id,v_area.name,v_delivery,trim(v_delivery->>'block'),trim(v_delivery->>'road'),
    trim(v_delivery->>'house'),trim(v_delivery->>'fullAddress'),v_slot.id,
    coalesce(trim(v_delivery->>'notes'),''),regexp_replace(coalesce(v_payment->>'payerPhone',''),'\s','','g'),
    trim(coalesce(v_payment->>'transactionId','')),nullif(v_code,''),v_subtotal,v_discount,v_total
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_order->'items')
  loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = v_item->>'id';
    v_line := v_product.price * v_qty;
    insert into public.order_items(order_id,product_id,product_name,unit,quantity,unit_price,line_total,inventory_reserved)
    values(v_order_id,v_product.id,v_product.name,v_product.unit,v_qty,v_product.price,v_line,v_product.track_inventory);
  end loop;

  return jsonb_build_object(
    'success',true,'orderId',v_order_number,'subtotal',v_subtotal,
    'deliveryCharge',v_delivery,'discount',v_discount,'grandTotal',v_total,
    'paymentStatus',v_payment_status
  );
end;
$$;

create or replace function public.set_ecogrocer_order_status(p_order_id uuid,p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  if p_status not in ('pending','confirmed','processing','out_for_delivery','delivered','cancelled','refunded') then
    raise exception 'অর্ডারের Status সঠিক নয়।';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'অর্ডার পাওয়া যায়নি।'; end if;

  if p_status = 'cancelled' and v_order.status <> 'cancelled' then
    for v_item in
      select product_id,quantity,inventory_reserved from public.order_items where order_id = v_order.id
    loop
      if v_item.product_id is not null and v_item.inventory_reserved then
        update public.products
        set stock_quantity = stock_quantity + v_item.quantity, updated_at = now()
        where id = v_item.product_id;
      end if;
    end loop;
  elsif v_order.status = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'বাতিল অর্ডার পুনরায় চালু করতে নতুন অর্ডার তৈরি করুন।';
  end if;

  update public.orders set status = p_status, updated_at = now() where id = v_order.id;
  insert into public.admin_audit_log(action,entity_type,entity_id,details)
  values('status_changed','order',v_order.order_number,jsonb_build_object('from',v_order.status,'to',p_status));
  return jsonb_build_object('success',true,'orderId',v_order.order_number,'status',p_status);
end;
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.delivery_slots enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.admin_audit_log enable row level security;

revoke all on public.categories,public.products,public.delivery_areas,public.delivery_slots,
  public.coupons,public.orders,public.order_items,public.payment_transactions,public.admin_audit_log from anon,authenticated;
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
revoke all on function public.place_ecogrocer_order(jsonb,uuid) from public, anon, authenticated;
revoke all on function public.set_ecogrocer_order_status(uuid,text) from public, anon, authenticated;
grant execute on function public.place_ecogrocer_order(jsonb,uuid) to service_role;
grant execute on function public.set_ecogrocer_order_status(uuid,text) to service_role;


create or replace function public.set_ecogrocer_payment_status(
  p_order_id uuid,
  p_payment_status text,
  p_gateway text,
  p_gateway_transaction_id text,
  p_validation_id text default '',
  p_bank_transaction_id text default '',
  p_response jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_payment_status not in ('pending_verification','paid','failed','refunded') then
    raise exception 'পেমেন্ট Status সঠিক নয়।';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'অর্ডার পাওয়া যায়নি।'; end if;
  if v_order.payment_status = 'paid' and p_payment_status <> 'refunded' then
    raise exception 'এই অর্ডারের পেমেন্ট ইতিমধ্যে Verified।';
  end if;

  update public.orders
  set payment_status = p_payment_status,
      payment_gateway = p_gateway,
      payment_gateway_transaction_id = p_gateway_transaction_id,
      transaction_id = case when p_bank_transaction_id <> '' then p_bank_transaction_id else transaction_id end,
      updated_at = now()
  where id = p_order_id;

  update public.payment_transactions
  set status = case
        when p_payment_status = 'paid' then 'paid'
        when p_payment_status = 'failed' then 'failed'
        when p_payment_status = 'refunded' then 'failed'
        when p_payment_status = 'pending_verification' then 'review'
        else 'pending'
      end,
      validation_id = coalesce(nullif(p_validation_id,''),validation_id),
      bank_transaction_id = coalesce(nullif(p_bank_transaction_id,''),bank_transaction_id),
      raw_response = coalesce(p_response,'{}'::jsonb),
      updated_at = now()
  where gateway_transaction_id = p_gateway_transaction_id;

  insert into public.admin_audit_log(action,entity_type,entity_id,details)
  values('payment_status_changed','order',v_order.order_number,
    jsonb_build_object('from',v_order.payment_status,'to',p_payment_status,'gateway',p_gateway,'transaction',p_gateway_transaction_id));

  return jsonb_build_object('success',true,'orderId',v_order.order_number,'paymentStatus',p_payment_status);
end;
$$;

revoke all on function public.set_ecogrocer_payment_status(uuid,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.set_ecogrocer_payment_status(uuid,text,text,text,text,text,jsonb) to service_role;
