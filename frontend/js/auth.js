/* ==========================================================================
   Clínica Alvea — Utilitário de autenticação (frontend)
   Centraliza chamadas à API de auth, sessão local e proteção de rotas.
   ========================================================================== */

const ALVEA_API_BASE_URL = window.ALVEA_API_BASE_URL;
const ALVEA_TOKEN_KEY = 'alveatech_token';
const ALVEA_USER_KEY = 'alveatech_usuario';

/**
 * Executa uma requisição à API Clínica Alvea.
 * Lança um Error com a mensagem vinda do backend em caso de falha.
 */
async function alveaApiRequest(path, options = {}) {
  let resposta;

  try {
    resposta = await fetch(`${ALVEA_API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (erroDeRede) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Ocorreu um erro. Tente novamente.');
  }

  return dados;
}

function alveaSaveSession(usuario, token) {
  localStorage.setItem(ALVEA_TOKEN_KEY, token);
  localStorage.setItem(ALVEA_USER_KEY, JSON.stringify(usuario));
}

function alveaGetSession() {
  const token = localStorage.getItem(ALVEA_TOKEN_KEY);
  const usuarioRaw = localStorage.getItem(ALVEA_USER_KEY);

  if (!token || !usuarioRaw) return null;

  try {
    return { token, usuario: JSON.parse(usuarioRaw) };
  } catch (erro) {
    return null;
  }
}

function alveaClearSession() {
  localStorage.removeItem(ALVEA_TOKEN_KEY);
  localStorage.removeItem(ALVEA_USER_KEY);
}

/**
 * Protege páginas que exigem login. Redireciona para o login caso
 * não haja sessão válida. Retorna a sessão quando existente.
 */
function alveaRequireAuth(redirectTo = 'login.html') {
  const session = alveaGetSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

function alveaRedirectByRole(usuario) {
  if (usuario.role === 'admin') {
    window.location.href = '../admin/dashboard.html';
  } else {
    window.location.href = 'home.html';
  }
}

function alveaLogout(redirectTo = 'login.html') {
  alveaClearSession();
  window.location.href = redirectTo;
}

/**
 * Protege páginas administrativas. Exige sessão válida E role admin.
 * Paciente autenticado tentando acessar é redirecionado para sua home.
 */
function alveaRequireAdmin(redirectTo = '../paciente/login.html') {
  const session = alveaGetSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  if (session.usuario.role !== 'admin') {
    window.location.href = '../paciente/home.html';
    return null;
  }
  return session;
}

/**
 * Resolve a URL de um arquivo retornado pela API. Caminhos relativos
 * (ex: "/uploads/exames/arquivo.pdf") são servidos pelo backend, não
 * pelo frontend — então precisam ser prefixados com a URL da API.
 * Links absolutos (http://...) são retornados como estão.
 */
function alveaResolverUrlArquivo(caminho) {
  if (!caminho) return '';
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) return caminho;
  return `${ALVEA_API_BASE_URL}${caminho}`;
}

/**
 * Retorna as iniciais (até 2 letras) do nome de uma pessoa.
 */
function alveaIniciais(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

/**
 * Renderiza o avatar do usuário no elemento indicado: foto de perfil
 * (se existir) ou iniciais do nome como fallback.
 */
function alveaRenderAvatar(elementId, usuario) {
  const el = document.getElementById(elementId);
  if (!el || !usuario) return;

  if (usuario.fotoUrl) {
    el.innerHTML = `<img src="${ALVEA_API_BASE_URL}${usuario.fotoUrl}" alt="Foto de perfil">`;
  } else {
    el.textContent = alveaIniciais(usuario.nome || '');
  }
}

/**
 * Executa upload multipart/form-data autenticado (ex: foto de perfil,
 * arquivo de laudo). Não define Content-Type manualmente — o navegador
 * define o boundary correto automaticamente para FormData.
 */
async function alveaApiUpload(path, formData, token, method = 'POST') {
  let resposta;

  try {
    resposta = await fetch(`${ALVEA_API_BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (erroDeRede) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Ocorreu um erro. Tente novamente.');
  }

  return dados;
}

/**
 * Aplica máscara de CPF (000.000.000-00) em um campo de input
 * conforme o usuário digita.
 */
function alveaAplicarMascaraCpf(input) {
  input.addEventListener('input', () => {
    let valor = input.value.replace(/\D/g, '').slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = valor;
  });
}

/**
 * Aplica máscara de telefone ((00) 00000-0000) em um campo de input.
 */
function alveaAplicarMascaraTelefone(input) {
  input.addEventListener('input', () => {
    let valor = input.value.replace(/\D/g, '').slice(0, 11);
    valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
    valor = valor.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    input.value = valor;
  });
}

/**
 * Exibe uma notificação temporária (toast) no canto da tela, substituindo
 * o alert() nativo do navegador — mais discreto e consistente com o
 * visual do resto do sistema. tipo: 'error' (padrão) ou 'success'.
 */
function alveaToast(mensagem, tipo = 'error') {
  let container = document.getElementById('alveaToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alveaToastContainer';
    container.className = 'alvea-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `alvea-toast alvea-toast-${tipo}`;
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${tipo === 'success'
        ? '<path d="M20 6L9 17l-5-5"/>'
        : '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'}
    </svg>
    <span>${mensagem}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}
