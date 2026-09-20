-- ==========================================================================
-- Clínica Alvea — Schema do banco de dados (Supabase / PostgreSQL)
-- ==========================================================================
-- Como usar:
-- 1. Crie um projeto em https://supabase.com
-- 2. Abra "SQL Editor" no painel do Supabase
-- 3. Cole todo este arquivo e clique em "Run"
-- 4. Confira em "Table Editor" se as 7 tabelas foram criadas
--
-- Este schema assume que o backend acessa o banco usando a
-- SERVICE ROLE KEY (nunca a anon key) — por isso Row Level Security (RLS)
-- fica desativado: o controle de acesso continua sendo feito pelo próprio
-- backend Express (autenticação JWT + verificação de dono do registro),
-- exatamente como já funciona hoje. O navegador nunca fala diretamente
-- com o Supabase.
-- ==========================================================================

create extension if not exists "pgcrypto";

-- ---------- USUÁRIOS (pacientes e administradores) ----------

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  cpf text,                          -- criptografado pela aplicação (AES-256-GCM) antes de gravar
  role text not null default 'paciente' check (role in ('paciente', 'admin')),
  telefone text,
  endereco text,
  data_nascimento date,
  genero text,
  foto_url text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_usuarios_email on usuarios (lower(email));

-- ---------- PROFISSIONAIS ----------

create table if not exists profissionais (
  id text primary key,               -- mantém IDs curtos legíveis (p1, p2...) como no seed atual
  nome text not null,
  especialidade text not null,
  horarios_disponiveis jsonb not null default '[]'::jsonb  -- lista de strings ISO (AAAA-MM-DDTHH:MM)
);

-- ---------- FAMILIARES (pessoas que um paciente pode agendar consultas para) ----------

create table if not exists familiares (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references usuarios (id) on delete cascade,
  nome text not null,
  parentesco text not null,
  data_nascimento date,
  cpf text,                          -- criptografado pela aplicação, mesmo esquema do CPF do titular
  criado_em timestamptz not null default now()
);

create index if not exists idx_familiares_paciente on familiares (paciente_id);

-- ---------- AGENDAMENTOS ----------

create table if not exists agendamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references usuarios (id) on delete cascade,
  profissional_id text not null references profissionais (id),
  profissional_nome text not null,   -- snapshot: mantém o nome mesmo se o profissional for editado/removido depois
  especialidade text not null,       -- snapshot, pelo mesmo motivo
  data_hora timestamptz not null,
  status text not null default 'confirmado' check (status in ('confirmado', 'concluido', 'cancelado')),
  familiar_id uuid references familiares (id) on delete set null,  -- preenchido quando a consulta é para um familiar, não para o titular
  para_nome text,                    -- snapshot do nome do familiar (sobrevive se o familiar for removido depois)
  criado_em timestamptz not null default now()
);

create index if not exists idx_agendamentos_paciente on agendamentos (paciente_id);
create index if not exists idx_agendamentos_profissional on agendamentos (profissional_id);

-- ---------- EXAMES ----------

create table if not exists exames (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid references agendamentos (id) on delete set null,
  paciente_id uuid not null references usuarios (id) on delete cascade,
  tipo_exame text not null,
  data_realizacao date not null,
  status text not null default 'aguardando_resultado' check (status in ('aguardando_resultado', 'concluido')),
  laudo_texto text,
  arquivo_url text
);

create index if not exists idx_exames_paciente on exames (paciente_id);

-- ---------- NOTIFICAÇÕES ----------

create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  canal text not null check (canal in ('email', 'sms')),
  destinatario text not null,
  paciente_id uuid references usuarios (id) on delete cascade,
  agendamento_id uuid references agendamentos (id) on delete set null,
  tipo text not null,
  simulado boolean not null default false,
  enviado boolean not null default false,
  erro text,
  criado_em timestamptz not null default now()
);

-- ---------- CONTATOS CORPORATIVOS (Plano Corporativo) ----------

create table if not exists contatos_corporativos (
  id uuid primary key default gen_random_uuid(),
  nome_empresa text not null,
  cnpj text,
  responsavel text not null,
  email text not null,
  telefone text not null,
  numero_colaboradores text,
  mensagem text,
  status text not null default 'novo' check (status in ('novo', 'contatado')),
  criado_em timestamptz not null default now()
);

-- ---------- Dados de exemplo (seed) ----------
-- Só insere se a tabela de profissionais estiver vazia, para não duplicar
-- em execuções repetidas deste script.

insert into profissionais (id, nome, especialidade, horarios_disponiveis)
select * from (values
  ('p1', 'Dra. Ana Souza', 'Clínico Geral', '[]'::jsonb),
  ('p2', 'Dr. Carlos Mendes', 'Cardiologia', '[]'::jsonb),
  ('p3', 'Dra. Beatriz Lima', 'Nutrição', '[]'::jsonb),
  ('p4', 'Dr. Rafael Torres', 'Exames Laboratoriais', '[]'::jsonb),
  ('p5', 'Dra. Marina Alves', 'Exames de Imagem', '[]'::jsonb),
  ('p6', 'Dra. Catarina', 'Medicina do Trabalho', '[]'::jsonb),
  ('p7', 'Dr. Lucas Andrade', 'Fisioterapia', '[]'::jsonb)
) as seed(id, nome, especialidade, horarios_disponiveis)
where not exists (select 1 from profissionais limit 1);

-- Admin de exemplo — senha "123456" (hash bcrypt já pronto).
-- Troque a senha assim que possível em um ambiente que não seja de teste.
insert into usuarios (id, nome, email, senha_hash, role, criado_em)
select '00000000-0000-0000-0000-000000000001', 'Recepção Clínica Alvea', 'admin@clinicaalvea.com.br',
       '$2a$10$ZkoYIsY9ynAvSFLH39WBGOFbS371IOafH2TwJuxaZ0BoSWz4s7TQ2', 'admin', now()
where not exists (select 1 from usuarios where email = 'admin@clinicaalvea.com.br');

-- Paciente de exemplo — senha "123456". CPF em texto puro de propósito
-- (veja nota na seção de Segurança do README sobre a chave de criptografia).
insert into usuarios (id, nome, email, senha_hash, cpf, role, telefone, endereco, data_nascimento, genero, criado_em)
select '00000000-0000-0000-0000-000000000002', 'João da Silva', 'joao.silva@email.com',
       '$2a$10$ZysksRYr.WiMgd2E1.qWxOAOj255t7SN/xpqdrbnCfzdtniZmBwVy', '123.456.789-00', 'paciente',
       '(11) 98765-4321', 'Rua das Palmeiras, 120 — São Paulo, SP', '1990-04-12', 'masculino', now()
where not exists (select 1 from usuarios where email = 'joao.silva@email.com');
