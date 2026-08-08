-- VProject — esquema de sincronização na nuvem (opcional).
--
-- Estratégia: uma tabela genérica chave/valor por utilizador. Cada chave
-- corresponde a uma chave localStorage da app (peso, medidas, treinos,
-- refeições, água, hábitos, notas, definições, ...), guardada como JSONB.
-- Isto acompanha automaticamente qualquer novo tipo de dado que a app venha
-- a guardar, sem migrações de esquema constantes.
--
-- Como aplicar: Supabase Dashboard -> SQL Editor -> cola este ficheiro -> Run.
-- (ou `supabase db push` se estiveres a usar a CLI com migrations locais)

create table if not exists public.user_data (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_data_user_id_idx on public.user_data (user_id);

alter table public.user_data enable row level security;

-- Cada utilizador só pode ler/escrever os seus próprios dados.
create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);

create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id);

create policy "user_data_delete_own" on public.user_data
  for delete using (auth.uid() = user_id);

-- Mantém updated_at correto em qualquer UPDATE feito fora do cliente.
create or replace function public.touch_user_data_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
  before update on public.user_data
  for each row execute function public.touch_user_data_updated_at();
