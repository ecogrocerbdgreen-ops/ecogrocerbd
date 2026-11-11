create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.order_api_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now()
);
alter table private.order_api_rate_limits enable row level security;
revoke all on private.order_api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on private.order_api_rate_limits to service_role;
create index if not exists order_api_rate_limits_updated_at_idx
  on private.order_api_rate_limits(updated_at);

create or replace function public.consume_ecogrocer_order_rate_limit(
  p_key_hash text,
  p_max_requests integer default 5,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Rate limit key is invalid.';
  end if;
  if p_max_requests < 1 or p_max_requests > 20
     or p_window_seconds < 60 or p_window_seconds > 3600 then
    raise exception 'Rate limit configuration is invalid.';
  end if;

  insert into private.order_api_rate_limits(key_hash,window_started_at,request_count,updated_at)
  values(p_key_hash,v_now,1,v_now)
  on conflict(key_hash) do update
    set window_started_at = case
          when v_now >= private.order_api_rate_limits.window_started_at
                         + make_interval(secs => p_window_seconds)
          then v_now else private.order_api_rate_limits.window_started_at end,
        request_count = case
          when v_now >= private.order_api_rate_limits.window_started_at
                         + make_interval(secs => p_window_seconds)
          then 1 else private.order_api_rate_limits.request_count + 1 end,
        updated_at = v_now
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.consume_ecogrocer_order_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_ecogrocer_order_rate_limit(text,integer,integer) to service_role;
