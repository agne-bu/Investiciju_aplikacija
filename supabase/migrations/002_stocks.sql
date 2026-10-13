-- 1. Stocks table
create table public.stocks (
  id         bigint generated always as identity primary key,
  symbol     text not null unique,
  name       text,
  created_at timestamptz not null default now()
);

-- 2. Relationship: transactions -> stocks
alter table public.transactions
  add column stock_id bigint references public.stocks(id) on delete restrict;

create index transactions_stock_id_idx on public.transactions (stock_id);

-- 3. Row Level Security
alter table public.stocks enable row level security;

create policy "mvp_open_select" on public.stocks
  for select to anon using (true);
create policy "mvp_open_insert" on public.stocks
  for insert to anon with check (true);
create policy "mvp_open_update" on public.stocks
  for update to anon using (true) with check (true);
create policy "mvp_open_delete" on public.stocks
  for delete to anon using (true);