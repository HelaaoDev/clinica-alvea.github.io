/**
 * Clínica Alvea - Configuração central da URL da API
 *
 * Único lugar do frontend onde a URL do backend é definida. Todas as
 * outras páginas/scripts leem `window.ALVEA_API_BASE_URL` em vez de
 * cada um ter sua própria URL fixa — assim, ao publicar o site, só é
 * preciso editar esta linha (em vez de procurar em vários arquivos).
 *
 * Detecção automática: se a página estiver rodando em localhost/127.0.0.1
 * (ambiente de desenvolvimento), usa o backend local na porta 3000.
 * Caso contrário (site publicado), usa a URL de produção definida abaixo.
 */

window.ALVEA_API_BASE_URL = (function () {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  // ⚠️ TROQUE a linha abaixo pela URL real do backend publicado
  // (ex: o endereço gerado pelo Render, Railway, etc.) antes de ir ao ar.
  return "https://SEU-BACKEND-AQUI.onrender.com";
})();
