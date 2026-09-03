-- Paridade com produção (Lovable Cloud) — PARTE 1: estrutura
create table if not exists public.execucao_its (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid,
  user_id          uuid,
  pop_codigo       text,
  it_codigo        text,
  responsavel_nome text,
  observacoes      text,
  data_execucao    timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.execucao_its enable row level security;

-- Usa o padrão correto (is_membro_empresa), NAO a policy vazada da producao
drop policy if exists "Acesso por dono ou membro empresa" on public.execucao_its;
create policy "Acesso por dono ou membro empresa"
  on public.execucao_its for all to authenticated
  using (auth.uid() = user_id
         or (empresa_id is not null and is_membro_empresa(empresa_id, auth.uid())))
  with check (auth.uid() = user_id
         and (empresa_id is null or pode_usar_empresa(empresa_id, auth.uid())));

drop trigger if exists trg_audit_execucao_its on public.execucao_its;
create trigger trg_audit_execucao_its
  after insert or update or delete on public.execucao_its
  for each row execute function public.process_audit_log();

alter table public.arquivos_bpf
  add column if not exists metadata jsonb,
  add column if not exists versao   integer default 1;
