-- Allow flexible Bangladesh-style delivery address details.
-- Block, road and house/flat are optional free-text fields; full address remains required.
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
  v_delivery_fee numeric(10,2) := 0;
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
  -- Block, road and house/flat formats vary by location; accept free-form or blank values.
  -- Keep the customer's complete address as the only required free-text address field.
  if length(trim(coalesce(v_delivery->>'fullAddress',''))) = 0 then
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
    if v_subtotal < v_coupon.minimum_order then raise exception '%', 'এই কুপনের জন্য ন্যূনতম অর্ডার ৳' || v_coupon.minimum_order || '।'; end if;
    if v_coupon.discount_type = 'fixed' then
      v_discount := least(v_subtotal,v_coupon.discount_value);
    else
      v_discount := round(v_subtotal * v_coupon.discount_value / 100,2);
      if v_coupon.max_discount is not null then v_discount := least(v_discount,v_coupon.max_discount); end if;
    end if;
    update public.coupons set usage_count = usage_count + 1 where code = v_code;
  end if;

  v_delivery_fee := v_area.fee;
  v_total := greatest(0,v_subtotal + v_delivery_fee - v_discount);
  if v_payment_method <> 'cod' then v_payment_status := 'pending_verification'; end if;

  v_order_number := 'EG' || to_char(now() at time zone 'Asia/Dhaka','YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders (
    order_number,status,payment_method,payment_status,customer_user_id,customer_name,customer_email,customer_phone,
    delivery_area_id,delivery_area_name,delivery_fee,block_name,road_name,house_number,
    full_address,delivery_slot_id,delivery_notes,payer_phone,transaction_id,coupon_code,
    subtotal,discount,grand_total
  ) values (
    v_order_number,'pending',v_payment_method,v_payment_status,p_customer_user_id,v_name,
    trim(coalesce(v_customer->>'email','')),v_phone,v_area.id,v_area.name,v_delivery_fee,trim(v_delivery->>'block'),trim(v_delivery->>'road'),
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
    'deliveryCharge',v_delivery_fee,'discount',v_discount,'grandTotal',v_total,
    'paymentStatus',v_payment_status
  );
end;
$$;
