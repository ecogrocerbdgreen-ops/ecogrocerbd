-- Allow GitHub Pages to read active public catalogue and delivery data.
-- No client-side write permissions are granted; orders remain handled by the place-order Edge Function.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.delivery_slots enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on table
  public.categories,
  public.products,
  public.delivery_areas,
  public.delivery_slots
from anon, authenticated;

grant select on table
  public.categories,
  public.products,
  public.delivery_areas,
  public.delivery_slots
to anon, authenticated;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
  on public.categories for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active delivery areas" on public.delivery_areas;
create policy "Public can read active delivery areas"
  on public.delivery_areas for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active delivery slots" on public.delivery_slots;
create policy "Public can read active delivery slots"
  on public.delivery_slots for select to anon, authenticated
  using (is_active = true);
