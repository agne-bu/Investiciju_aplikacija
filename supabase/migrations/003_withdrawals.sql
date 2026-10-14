-- Allow cash withdrawals and keep their rows free of stock trade fields.
alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('deposit', 'withdrawal', 'buy', 'sell'));

alter table public.transactions
  drop constraint if exists deposit_fields;

alter table public.transactions
  add constraint deposit_fields check (
    type not in ('deposit', 'withdrawal') or (
      symbol is null
      and quantity is null
      and price_cents is null
      and fee_cents = 0
      and amount_cents > 0
    )
  );
