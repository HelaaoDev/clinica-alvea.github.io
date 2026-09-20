/**
 * Clínica Alvea - Utilitário de validação de entrada
 *
 * Funções pequenas e reutilizáveis para validar dados recebidos do
 * cliente antes de gravá-los. Evita que dados malformados, tipos
 * inesperados (objetos/arrays onde se espera string) ou strings
 * absurdamente longas cheguem aos arquivos JSON.
 */

function ehStringValida(valor, { min = 1, max = 300 } = {}) {
  return typeof valor === "string" && valor.trim().length >= min && valor.trim().length <= max;
}

function ehEmailValido(valor) {
  return typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) && valor.length <= 200;
}

function ehDataHoraValida(valor) {
  // Formato esperado: AAAA-MM-DDTHH:MM (datetime-local)
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor);
}

function ehDataValida(valor) {
  // Formato esperado: AAAA-MM-DD
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function ehArrayDeDataHorasValido(valor) {
  return Array.isArray(valor) && valor.every((v) => ehDataHoraValida(v));
}

function sanitizarTexto(valor) {
  return typeof valor === "string" ? valor.trim().slice(0, 5000) : valor;
}

module.exports = {
  ehStringValida,
  ehEmailValido,
  ehDataHoraValida,
  ehDataValida,
  ehArrayDeDataHorasValido,
  sanitizarTexto,
};
