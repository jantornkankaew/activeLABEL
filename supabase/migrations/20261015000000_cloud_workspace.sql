create table if not exists public.labelcraft_documents (
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null,
  revision integer not null check (revision >= 0),
  title text not null check (char_length(title) <= 120),
  document jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, document_id)
);

create table if not exists public.labelcraft_user_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  active_document_id text,
  updated_at timestamptz not null default now()
);

alter table public.labelcraft_documents enable row level security;
alter table public.labelcraft_user_state enable row level security;

create policy "owners manage label documents" on public.labelcraft_documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage label state" on public.labelcraft_user_state
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
