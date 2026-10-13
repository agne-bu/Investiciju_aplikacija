-- Transactions table: deposits, buys and sells.
-- All money values are stored as integer cents (no floats).
create table public.transactions (
  id           bigint generated always as identity primary key,
  type         text    not null check (type in ('deposit', 'buy', 'sell')),
  date         date    not null,
  symbol       text,
  quantity     integer,
  price_cents  bigint,
  fee_cents    bigint  not null default 0,
  amount_cents bigint  not null,
  created_at   timestamptz not null default now(),

  -- Deposit: only date and amount, no stock fields, no fee.
  constraint deposit_fields check (
    type <> 'deposit' or (
      symbol is null
      and quantity is null
      and price_cents is null
      and fee_cents = 0
      and amount_cents > 0
    )
  ),

  -- Buy / sell: stock fields required and valid.
  constraint trade_fields check (
    type not in ('buy', 'sell') or (
      symbol is not null
      and length(trim(symbol)) > 0
      and quantity is not null and quantity > 0
      and price_cents is not null and price_cents > 0
      and fee_cents >= 0
    )
  ),

  -- buy:  quantity * price + fee
  constraint buy_amount check (
    type <> 'buy' or amount_cents = quantity * price_cents + fee_cents
  ),
  -- sell: quantity * price - fee
  constraint sell_amount check (
    type <> 'sell' or amount_cents = quantity * price_cents - fee_cents
  )
);

create index transactions_symbol_date_idx on public.transactions (symbol, date);
create index transactions_date_idx on public.transactions (date desc);

-- Row Level Security (TEMPORARY open access for the MVP, no authentication)
alter table public.transactions enable row level security;

create policy "mvp_open_select" on public.transactions
  for select to anon using (true);
create policy "mvp_open_insert" on public.transactions
  for insert to anon with check (true);
create policy "mvp_open_update" on public.transactions
  for update to anon using (true) with check (true);
create policy "mvp_open_delete" on public.transactions
  for delete to anon using (true);