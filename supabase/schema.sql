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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Every query the app makes filters by user_id (WHERE user_id = auth.uid()),
-- so this index is what keeps sync fast as the table grows across all users.
create index if not exists user_data_user_id_idx on public.user_data (user_id);

alter table public.user_data enable row level security;

-- Cada utilizador só pode ler/escrever os seus próprios dados. `with check`
-- está explícito também no UPDATE (não só no USING) para impedir que uma
-- linha seja re-escrita com um user_id diferente do dono autenticado.
create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);

create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_data_delete_own" on public.user_data
  for delete using (auth.uid() = user_id);

-- IMPORTANT: updated_at is set by the client on every upsert, from the exact
-- moment the row's data actually changed locally — it is the timestamp the
-- app's conflict resolution (last-write-wins / merge) relies on. Do NOT add
-- a trigger that overwrites it with now() on UPDATE: that would replace the
-- real edit time with "when this row happened to reach the server", which
-- silently breaks conflict resolution across devices (a device that was
-- offline and syncs later could then wrongly appear "newest" and clobber a
-- genuinely more recent edit from another device). If you previously applied
-- an earlier version of this schema with such a trigger, drop it:
drop trigger if exists user_data_touch on public.user_data;
drop function if exists public.touch_user_data_updated_at();
