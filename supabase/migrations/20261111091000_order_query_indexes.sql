create index if not exists order_items_product_id_idx
  on public.order_items(product_id);
create index if not exists orders_delivery_area_id_idx
  on public.orders(delivery_area_id);
create index if not exists orders_delivery_slot_id_idx
  on public.orders(delivery_slot_id);
