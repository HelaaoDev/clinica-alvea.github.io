# Clínica Alvea — Sistema de Agendamento (Clínica de Saúde)

Projeto acadêmico: aplicação completa (backend + frontend) para marcação de consultas/exames em uma clínica de saúde, com login de pacientes, área administrativa e consulta de exames/resultados.

Consulte também `BRANDING.md` para a identidade de marca completa (missão, valores, paleta de cores, tipografia e referência visual).

---

## Status atual do projeto

**Projeto completo** — todas as funcionalidades planejadas foram implementadas e testadas de ponta a ponta.

✅ Planejamento completo (escopo, modelo de dados, endpoints, fluxo de telas)
✅ Identidade de marca (Clínica Alvea)
✅ **Backend completo** (Express + Supabase/PostgreSQL + autenticação JWT + autorização por role)
✅ **Landing page institucional** (frontend/index.html)
✅ **Área do paciente completa:**
  - Login e cadastro
  - Home com acesso às funcionalidades
  - Agendar Consulta — wizard de 4 etapas
  - Meus Agendamentos — listagem, filtros e cancelamento
  - Meus Exames — listagem, filtros e detalhe de laudo
✅ **Área administrativa completa:**
  - Dashboard com estatísticas em tempo real
  - Gestão de profissionais (criar, editar, remover, horários dinâmicos)
  - Gestão de agendamentos (listar todos, filtrar, marcar concluído/cancelar)
  - Gestão de exames (registrar exame, lançar/publicar resultado com upload de PDF/imagem, ver laudo)
  - Listagem, busca e **exclusão de pacientes** (com exclusão em cascata de todos os dados vinculados)

✅ **Melhorias adicionais:**
  - Detalhe de cada serviço (`servico.html`) com "Saiba mais", profissionais responsáveis e CTA de agendamento
  - Seção "Nossos Profissionais" na landing page, carregada dinamicamente da API
  - Carrossel de depoimentos de pacientes
  - Edição de perfil do paciente (dados pessoais, foto, troca de senha com confirmação)
  - Familiares: paciente cadastra pessoas da família e pode agendar consultas para elas
  - Notificação de confirmação de agendamento por **e-mail real** (Nodemailer/Gmail) ou SMS simulado
  - Upload de arquivos reais (laudos em PDF/imagem, fotos de perfil) via Multer
  - Scripts `iniciar.bat` / `parar.bat` para rodar o projeto no Windows sem configuração manual
  - Formulário de contato corporativo (Plano Corporativo → "Falar com a clínica"), com gestão das solicitações no admin
  - Hardening de segurança (rate limiting, criptografia de CPF, headers HTTP, validação de entrada, proteção contra bots — veja seção "Segurança")

---

## Banco de dados (Supabase) — obrigatório, faça isso primeiro

O backend armazena todos os dados em um banco PostgreSQL hospedado no [Supabase](https://supabase.com) (plano gratuito é suficiente). O servidor **não inicia** sem isso configurado.

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com)
2. No painel do projeto, abra **SQL Editor**, cole todo o conteúdo de `backend/supabase/schema.sql` e clique em **Run** — isso cria as 7 tabelas e já insere os dados de exemplo (admin, paciente João da Silva, os 7 profissionais)
3. Pegue as duas credenciais que o backend precisa:
   - **Project Settings → Data API** → "Project URL"
   - **Project Settings → API Keys** → chave **`service_role`** (secret) — nunca a `anon public`
4. Preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` em `backend/.env` (o `iniciar.bat` cria esse arquivo vazio na primeira execução; se estiver rodando manualmente, copie `backend/.env.example`)
5. Confira a conexão antes de subir o app:
   ```bash
   cd backend
   npm run testar-db
   ```
   Deve mostrar "✅" nas 7 tabelas. Se der erro, confira se colou a chave `service_role` (não `anon`) e se rodou o `schema.sql`.

---

## Como rodar o projeto (Windows — recomendado)

O jeito mais simples de rodar o projeto é usando os scripts prontos na raiz do projeto:

1. Dê duplo clique em **`iniciar.bat`**
2. O script vai automaticamente:
   - Verificar se Node.js e Python estão instalados (avisa e indica onde baixar, caso não estejam)
   - Criar o arquivo `backend/.env` (com um segredo JWT gerado automaticamente e os campos do Supabase em branco), caso ainda não exista
   - Avisar e parar se `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` ainda não tiverem sido preenchidos (veja a seção "Banco de dados" acima)
   - Instalar as dependências do backend (`npm install`), caso ainda não tenham sido instaladas
   - Abrir duas janelas de terminal: uma com o backend (porta 3000) e outra com o frontend (porta 8080)
   - Abrir o navegador automaticamente em `http://localhost:8080/index.html`
3. **Não feche as duas janelas de terminal** enquanto estiver usando o sistema — são o backend e o frontend rodando
4. Para encerrar tudo de uma vez, dê duplo clique em **`parar.bat`** (ou simplesmente feche as duas janelas)

### Pré-requisitos (só precisam ser instalados uma vez)

- **Node.js** (versão LTS): [nodejs.org](https://nodejs.org)
- **Python** (versão 3.x): [python.org/downloads](https://www.python.org/downloads/) — marque a opção **"Add python.exe to PATH"** durante a instalação, senão o `iniciar.bat` não vai encontrar o comando
- Um projeto Supabase configurado (veja "Banco de dados" acima)

### Ativar envio real de e-mail (opcional)

Por padrão, o sistema funciona sem enviar e-mails de verdade (fica registrado como "simulado" no histórico de notificações). Para ativar o envio real:

1. Ative a verificação em duas etapas na sua conta Google: `myaccount.google.com/security`
2. Gere uma Senha de App em `myaccount.google.com/apppasswords`
3. Abra o arquivo `backend/.env` (criado automaticamente pelo `iniciar.bat` na primeira execução) e preencha:
   ```
   EMAIL_USER=seuemail@gmail.com
   EMAIL_APP_PASSWORD=código de 16 letras gerado
   ```
4. Rode `parar.bat` e depois `iniciar.bat` novamente para aplicar

### Problemas comuns no Windows

| Sintoma | Causa provável | Solução |
|---|---|---|
| `node não é reconhecido...` | Node.js não instalado ou terminal aberto antes da instalação | Instale o Node.js e feche/reabra o terminal |
| `npm.ps1 cannot be loaded because running scripts is disabled` | Só acontece se você rodar `npm` diretamente no **PowerShell** (não acontece usando `iniciar.bat`, que roda via `cmd`) | Use o `iniciar.bat`. Se precisar rodar comandos manualmente no PowerShell, execute como administrador: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `Não foi possível conectar ao servidor` no navegador | O backend não está rodando, ou o Firewall do Windows bloqueou o Node.js na primeira execução | Confirme que a janela "Clinica Alvea - Backend" está aberta sem erros. Se o Firewall perguntou para permitir o Node.js e foi negado, libere manualmente em "Permitir um aplicativo pelo Firewall do Windows Defender" |
| Página carrega mas fica em branco/erro estranho | Você abriu o arquivo `.html` direto pelo Explorer (URL começando com `file:///`) em vez de pela porta 8080 | Sempre acesse via `http://localhost:8080/...`, nunca abrindo o arquivo diretamente |

---

## Como rodar manualmente (Windows, Mac ou Linux)

Se preferir não usar os scripts `.bat`, ou estiver em Mac/Linux:

**1. Backend** (em um terminal):
```bash
cd backend
npm install
npm run dev
```
Sobe em `http://localhost:3000`. Antes de rodar, crie o arquivo `.env` na pasta `backend/` (use `.env.example` como base) e configure o Supabase — veja a seção "Banco de dados" acima:
```
PORT=3000
SUPABASE_URL=<Project URL do seu projeto Supabase>
SUPABASE_SERVICE_ROLE_KEY=<chave service_role do seu projeto Supabase>
JWT_SECRET=troque_por_um_segredo_forte
JWT_EXPIRES_IN=8h
EMAIL_USER=
EMAIL_APP_PASSWORD=
```

**2. Frontend** (em outro terminal):
```bash
cd frontend
python3 -m http.server 8080
```
No Windows, o comando pode se chamar `python` em vez de `python3`.

Acesse `http://localhost:8080/index.html` (landing page) ou `http://localhost:8080/paciente/login.html` (login).

> O frontend detecta o ambiente automaticamente em `frontend/js/config.js` (`window.ALVEA_API_BASE_URL`): em `localhost`/`127.0.0.1` usa `http://localhost:3000`; em qualquer outro domínio (site publicado), usa a URL de produção definida nesse arquivo — troque-a antes de publicar o site de verdade. Todas as páginas carregam `config.js` antes de `auth.js`/`main.js`. Os dois servidores (frontend e backend) precisam estar rodando ao mesmo tempo para o sistema funcionar.

> Nota: as fotos da landing page e das telas de login/cadastro já usam fotografia real (pasta `frontend/img/`), conforme a diretriz do `BRANDING.md`.

## Usuários de teste (já cadastrados via `backend/supabase/schema.sql`)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@clinicaalvea.com.br | 123456 |
| Paciente | joao.silva@email.com | 123456 |

> Senhas armazenadas com hash `bcrypt`. Nunca em texto puro.
> Novas contas criadas pela tela de cadastro (`/auth/registrar`) são sempre `role: paciente`.

---

## Endpoints disponíveis

### Públicos
- `GET /` — healthcheck
- `POST /auth/registrar` — cadastro de paciente (nome, cpf, email, senha)
- `POST /auth/login` — login (email, senha) → retorna `{ usuario, token }`
- `GET /especialidades` — lista especialidades
- `GET /profissionais?especialidade=X` — lista profissionais
- `GET /profissionais/:id/horarios` — horários disponíveis (já descontando ocupados)
- `POST /contato/corporativo` — envia solicitação de contato de uma empresa (Plano Corporativo)

### Autenticados (paciente) — requer header `Authorization: Bearer <token>`
- `POST /agendamentos` — cria agendamento `{ profissionalId, dataHora, canalNotificacao?, familiarId? }` (envia confirmação por e-mail real ou SMS simulado; `familiarId` opcional agenda a consulta para um familiar cadastrado em vez do próprio titular)
- `GET /agendamentos/meus` — lista agendamentos do paciente logado
- `DELETE /agendamentos/:id` — cancela agendamento (somente o próprio)
- `GET /familiares` — lista os familiares cadastrados pelo paciente logado
- `POST /familiares` — cadastra um familiar `{ nome, parentesco, dataNascimento?, cpf? }`
- `PUT /familiares/:id` — atualiza um familiar (somente do próprio paciente)
- `DELETE /familiares/:id` — remove um familiar (somente do próprio paciente)
- `GET /exames/meus` — lista exames do paciente logado
- `GET /exames/:id` — detalhe de um exame (somente do próprio paciente)
- `GET /auth/perfil` — dados atualizados do usuário logado
- `PUT /auth/perfil` — atualiza `{ nome, telefone, endereco, dataNascimento, genero }`
- `PUT /auth/senha` — troca de senha `{ senhaAtual, novaSenha }` (exige senha atual correta)
- `POST /auth/foto-perfil` — upload de foto de perfil (`multipart/form-data`, campo `foto`)

### Administrativos — requer token com `role: admin`
- `POST /admin/profissionais` — cadastra profissional
- `PUT /admin/profissionais/:id` — edita profissional
- `DELETE /admin/profissionais/:id` — remove profissional
- `GET /admin/agendamentos` — lista todos (filtros: `status`, `profissionalId`, `data`)
- `PUT /admin/agendamentos/:id/status` — altera status (`confirmado` | `concluido` | `cancelado`)
- `GET /admin/exames` — lista todos os exames (filtros: `pacienteId`, `status`)
- `POST /admin/exames` — cria exame vinculado a um paciente
- `PUT /admin/exames/:id/resultado` — lança laudo/resultado (`multipart/form-data`, campo `arquivo` para PDF/imagem, ou `arquivoUrl` como link alternativo)
- `GET /admin/pacientes` — lista pacientes cadastrados
- `DELETE /admin/pacientes/:id` — exclui paciente **e todos os dados vinculados** (agendamentos, exames, arquivos, notificações) — exclusão definitiva, sem soft-delete
- `GET /admin/contatos-corporativos` — lista solicitações de contato de empresas (filtro: `status`)
- `PUT /admin/contatos-corporativos/:id/status` — altera status (`novo` | `contatado`)
- `DELETE /admin/contatos-corporativos/:id` — remove uma solicitação

---

## Estrutura do projeto

```
alvea-tech-clinica/
├── iniciar.bat             # Inicia backend + frontend automaticamente (Windows)
├── parar.bat               # Encerra backend + frontend (Windows)
├── .gitignore               # Segredos, node_modules, uploads de usuário nunca versionados
├── BRANDING.md
├── README.md
├── backend/
│   ├── server.js            # helmet, HTTPS forçado (produção), rate limit geral
│   ├── package.json
│   ├── .env.example
│   ├── middleware/
│   │   ├── auth.js          # valida token JWT
│   │   ├── isAdmin.js       # valida role admin
│   │   └── rateLimit.js     # limites de login, cadastro e API geral
│   ├── supabase/
│   │   └── schema.sql       # schema completo (7 tabelas) + seed — rode no SQL Editor do Supabase
│   ├── scripts/
│   │   └── testar-supabase.js  # `npm run testar-db` — confere a conexão e as tabelas
│   ├── utils/
│   │   ├── supabaseClient.js # cliente Supabase (service_role key), usado por todas as rotas
│   │   ├── mappers.js       # converte linhas do banco (snake_case) <-> objetos da API (camelCase)
│   │   ├── upload.js        # configuração do multer (upload de arquivos)
│   │   ├── email.js         # envio real de e-mail (Nodemailer/Gmail)
│   │   ├── notificacoes.js  # orquestra envio + log de notificações (tabela `notificacoes`)
│   │   ├── crypto.js        # criptografia AES-256-GCM de dados sensíveis (CPF)
│   │   ├── validacao.js     # validação de formato/tipo/tamanho de entrada
│   │   └── garantirHorarios.js  # regenera horários de exemplo (sempre no futuro) a cada início do servidor
│   ├── uploads/
│   │   ├── exames/          # laudos em PDF/imagem enviados pelo admin
│   │   └── perfis/          # fotos de perfil dos pacientes
│   └── routes/
│       ├── auth.js          # login, cadastro, perfil, troca de senha, foto
│       ├── especialidades.js
│       ├── profissionais.js
│       ├── agendamentos.js
│       ├── familiares.js    # CRUD dos familiares de um paciente (agendáveis)
│       ├── exames.js
│       ├── contato.js       # recebe solicitações de contato corporativo (pública)
│       └── admin.js         # CRUD profissionais, agendamentos, exames, pacientes, contatos corporativos
└── frontend/
    ├── index.html            # Landing page institucional
    ├── servico.html          # Detalhe de serviço (?tipo=medico|exames|nutricao|outros)
    ├── contato-empresa.html  # Formulário de contato do Plano Corporativo
    ├── css/
    │   ├── style.css         # Design tokens + landing page
    │   ├── auth.css          # Telas de login/cadastro
    │   ├── app.css           # Área logada do paciente (header, cards, back-link)
    │   ├── perfil.css        # Edição de perfil do paciente + familiares
    │   ├── agendar.css       # Wizard de agendamento
    │   ├── agendamentos.css  # Listagem de agendamentos + modal de cancelamento
    │   ├── exames.css        # Listagem de exames + modal de laudo
    │   ├── servico.css       # Página de detalhe de serviço
    │   ├── contato-empresa.css # Formulário de contato corporativo
    │   └── admin.css         # Layout da área administrativa
    ├── js/
    │   ├── config.js         # define window.ALVEA_API_BASE_URL (local vs. produção) — carregado antes de auth.js/main.js em toda página
    │   ├── main.js           # Landing page: menu, FAQ, profissionais, carrossel, sessão no header público
    │   └── auth.js           # Sessão, chamadas à API, upload, guards de rota
    ├── paciente/
    │   ├── login.html
    │   ├── cadastro.html
    │   ├── home.html
    │   ├── perfil.html          # Editar dados pessoais, foto, senha e familiares
    │   ├── agendar.html         # Wizard: especialidade → profissional → horário → confirmação (com seletor "para quem")
    │   ├── agendamentos.html    # Meus Agendamentos: listar, filtrar, cancelar
    │   └── exames.html          # Meus Exames: listar, filtrar, ver laudo (com download de arquivo)
    └── admin/
        ├── dashboard.html       # Estatísticas e atalhos
        ├── profissionais.html   # CRUD de profissionais + horários
        ├── agendamentos.html    # Gestão de todos os agendamentos
        ├── exames.html          # Registrar exame + lançar resultado (com upload de PDF/imagem)
        ├── pacientes.html       # Listagem, busca e exclusão de pacientes
        └── contatos.html        # Solicitações de contato do Plano Corporativo
```

## Modelo de dados

O banco é PostgreSQL (Supabase). O schema completo — 7 tabelas, índices, foreign keys e seed de exemplo — está em `backend/supabase/schema.sql`; rode-o no SQL Editor do Supabase para criar tudo de uma vez. `backend/utils/mappers.js` converte as colunas `snake_case` do banco para os objetos `camelCase` que a API retorna, então os exemplos abaixo mostram o formato **da API** (o que o frontend realmente recebe):

**Usuário** (tabela `usuarios`)
```json
{
  "id": "00000000-0000-0000-0000-000000000002",
  "nome": "João da Silva",
  "cpf": "123.456.789-00",
  "email": "joao.silva@email.com",
  "role": "paciente"
}
```

**Profissional** (tabela `profissionais`)
```json
{
  "id": "p3",
  "nome": "Dra. Beatriz Lima",
  "especialidade": "Nutrição",
  "horariosDisponiveis": ["2026-08-19T08:00"]
}
```

**Familiar** (tabela `familiares`) — pessoa cadastrada por um paciente para poder agendar consultas em nome dela
```json
{
  "id": "...",
  "pacienteId": "00000000-0000-0000-0000-000000000002",
  "nome": "Maria da Silva",
  "parentesco": "Filho(a)",
  "dataNascimento": "2015-05-10",
  "cpf": null
}
```

**Agendamento** (tabela `agendamentos`) — `paraFamiliarId`/`paraNome` só aparecem quando a consulta foi marcada para um familiar em vez do titular
```json
{
  "id": "...",
  "pacienteId": "00000000-0000-0000-0000-000000000002",
  "profissionalId": "p3",
  "especialidade": "Nutrição",
  "dataHora": "2026-08-19T08:00",
  "status": "confirmado",
  "paraFamiliarId": null,
  "paraNome": null
}
```

**Exame** (tabela `exames`)
```json
{
  "id": "...",
  "pacienteId": "00000000-0000-0000-0000-000000000002",
  "agendamentoId": "...",
  "tipoExame": "Hemograma completo",
  "status": "concluido",
  "resultado": {
    "laudoTexto": "...",
    "arquivoUrl": null
  }
}
```

---

## Credenciais de acesso rápido

| Perfil | E-mail | Senha | Redireciona para |
|---|---|---|---|
| Administrador | admin@clinicaalvea.com.br | 123456 | `admin/dashboard.html` |
| Paciente | joao.silva@email.com | 123456 | `paciente/home.html` |

> Os horários de exemplo dos profissionais são regenerados automaticamente
> toda vez que o backend inicia (veja `backend/utils/garantirHorarios.js`),
> sempre a partir da data atual — então nunca aparecem "no passado" para
> quem for testar, não importa quando isso aconteça.

## Segurança

Esta seção documenta as medidas de segurança implementadas e as decisões de escopo tomadas — importante para justificar o que foi feito (e por quê) na apresentação do trabalho.

### ✅ Implementado

| Medida | Onde | Detalhe |
|---|---|---|
| **Segredos fora do Git** | `.gitignore` (raiz e `backend/`) | `.env`, `node_modules`, uploads de usuário e logs nunca são versionados. Nenhum segredo hardcoded no código — tudo vem de `process.env`. |
| **Senhas com hash** | `bcryptjs`, 10 rounds | Senhas nunca armazenadas em texto puro. |
| **CPF criptografado em repouso** | `backend/utils/crypto.js` (AES-256-GCM) | CPF fica ilegível no banco; só é descriptografado nas respostas autenticadas ao próprio dono ou ao admin. Todo CPF cadastrado através do sistema (`POST /auth/registrar`) é criptografado automaticamente — a exceção é o CPF do paciente de demonstração (`joao.silva@email.com`) no seed do `schema.sql`, mantido em texto puro de propósito, já que a chave de criptografia é gerada aleatoriamente a cada instalação (`iniciar.bat`) e um valor pré-criptografado com outra chave nunca seria legível em uma instalação nova. |
| **Autenticação obrigatória no servidor** | Middleware `auth.js` + `isAdmin.js` | Todas as rotas que retornam dado sensível exigem token JWT válido; rotas administrativas exigem `role: admin`. |
| **Controle de acesso por registro** | `agendamentos.js`, `exames.js` | Paciente só acessa/cancela/vê os próprios agendamentos e exames (`pacienteId === req.usuario.id`), nunca de outro paciente. |
| **Rate limiting** | `backend/middleware/rateLimit.js` | Login: 10 tentativas/15min por IP · Cadastro: 5/hora por IP · API geral: 300/15min por IP. |
| **Proteção contra bots** | Campo honeypot no cadastro | Campo invisível que só um bot preencheria; se vier preenchido, a submissão é silenciosamente ignorada. |
| **Validação de entrada** | `backend/utils/validacao.js` | Tipos, formatos (data, e-mail, URL) e tamanhos validados nas rotas de cadastro, login, perfil, profissionais e exames. |
| **Headers de segurança HTTP** | `helmet` em `server.js` | `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, etc. |
| **HTTPS forçado em produção** | Middleware em `server.js` | Redireciona HTTP→HTTPS quando `NODE_ENV=production` (atrás de um proxy/load balancer). Não afeta o ambiente local de desenvolvimento. |
| **Dependências sem vulnerabilidades conhecidas** | `npm audit` | 0 vulnerabilidades no momento da entrega (rode `npm audit` periodicamente para reconfirmar). |
| **CORS restrito a origens conhecidas** | `server.js` | Só aceita requisições de navegador vindas de domínios na lista `ALLOWED_ORIGINS` (padrão: `localhost:8080`/`127.0.0.1:8080` para desenvolvimento). Origem não autorizada recebe `403` em JSON, não a página de erro padrão do Express. |

### ⚠️ Decisões de escopo (não implementado, e por quê)

- **Cookies de sessão seguros:** o sistema usa JWT via header `Authorization: Bearer` (armazenado no `localStorage`), não cookies. Migrar para cookies `httpOnly`/`Secure` exigiria reescrever todas as chamadas `fetch()` do frontend e adicionar proteção CSRF — mudança arquitetural grande demais para o escopo do trabalho. O padrão Bearer token é uma alternativa razoavelmente segura, desde que o frontend não tenha vulnerabilidades de XSS (validação de entrada ajuda a mitigar isso).
- **Parametrização de queries:** não é um problema em aberto — todo acesso ao banco passa pelo SDK oficial do Supabase (`@supabase/supabase-js`), que monta as queries de forma parametrizada internamente; o backend nunca concatena strings SQL manualmente, então não há superfície de SQL Injection.
- **CAPTCHA real (reCAPTCHA/hCaptcha):** exigiria criar uma conta e configurar chaves de API externas, seguindo o mesmo princípio usado para e-mail (não deixamos o projeto dependente de contas externas para rodar). O honeypot implementado cobre bots simples; para produção real, recomenda-se adicionar reCAPTCHA.
- **Content-Security-Policy (CSP) no frontend:** o `helmet` protege as respostas do backend (API), mas o HTML é servido por um servidor estático separado (`python -m http.server`, porta 8080) que não passa pelo Express. Um CSP real exigiria um servidor web de verdade (Nginx, Vercel, etc.) na frente do frontend — fora do escopo deste projeto acadêmico.

### Configuração recomendada do `.env` para produção

```
SUPABASE_URL=<Project URL do seu projeto Supabase>
SUPABASE_SERVICE_ROLE_KEY=<chave service_role do seu projeto Supabase>
NODE_ENV=production
JWT_SECRET=<string aleatória forte, 32+ caracteres>
DATA_ENCRYPTION_KEY=<string aleatória forte, 32+ caracteres, diferente do JWT_SECRET>
ALLOWED_ORIGINS=https://seu-dominio-real.com.br
```

---

## Possíveis evoluções futuras

O escopo definido no planejamento inicial está implementado e funcional. Para além do que foi pedido no trabalho, algumas ideias de evolução:

1. Publicar o backend em produção (Render, Railway etc.) e trocar a URL em `frontend/js/config.js`
2. Notificações por e-mail ao paciente quando um resultado de exame é publicado
3. Paginação nas tabelas administrativas para grandes volumes de dados
4. Testes automatizados (unitários no backend, E2E no frontend)
5. Row Level Security (RLS) no Supabase, caso o frontend algum dia passe a falar diretamente com o banco (hoje só o backend acessa o Supabase, com a service role key)
