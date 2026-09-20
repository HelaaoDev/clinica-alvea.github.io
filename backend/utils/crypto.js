/**
 * Clínica Alvea - Criptografia de dados sensíveis em repouso
 *
 * Usa AES-256-GCM (autenticado) para criptografar campos sensíveis
 * antes de gravá-los nos arquivos JSON (ex: CPF).
 *
 * A chave vem de DATA_ENCRYPTION_KEY no .env — uma string de 32 bytes
 * (64 caracteres hexadecimais). Se não estiver configurada, uma chave
 * é derivada do JWT_SECRET como fallback (funciona, mas o ideal é ter
 * uma chave dedicada — veja .env.example).
 *
 * Formato armazenado: "enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * Valores que já não estão nesse formato (dados antigos/legados) são
 * tratados como texto puro e migrados automaticamente na leitura.
 */

const crypto = require("crypto");
require("dotenv").config();

const ALGORITMO = "aes-256-gcm";
const PREFIXO = "enc:";

function obterChave() {
  const chaveConfigurada = process.env.DATA_ENCRYPTION_KEY;

  if (chaveConfigurada && chaveConfigurada.length >= 32) {
    return crypto.createHash("sha256").update(chaveConfigurada).digest();
  }

  // Fallback: deriva uma chave a partir do JWT_SECRET para não quebrar
  // ambientes que ainda não configuraram DATA_ENCRYPTION_KEY.
  const segredoBase = process.env.JWT_SECRET || "clinica_alvea_fallback_key";
  return crypto.createHash("sha256").update(`alvea-data-key:${segredoBase}`).digest();
}

function criptografar(textoPlano) {
  if (textoPlano === null || textoPlano === undefined || textoPlano === "") {
    return textoPlano;
  }

  const chave = obterChave();
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv(ALGORITMO, chave, iv);

  const criptografado = Buffer.concat([
    cifra.update(String(textoPlano), "utf8"),
    cifra.final(),
  ]);
  const authTag = cifra.getAuthTag();

  return `${PREFIXO}${iv.toString("hex")}:${authTag.toString("hex")}:${criptografado.toString("hex")}`;
}

function descriptografar(valorArmazenado) {
  if (!valorArmazenado || typeof valorArmazenado !== "string" || !valorArmazenado.startsWith(PREFIXO)) {
    // Não está criptografado (dado legado/texto puro) — retorna como está
    return valorArmazenado;
  }

  try {
    const partes = valorArmazenado.slice(PREFIXO.length).split(":");
    const [ivHex, authTagHex, dadosHex] = partes;

    const chave = obterChave();
    const decifra = crypto.createDecipheriv(ALGORITMO, chave, Buffer.from(ivHex, "hex"));
    decifra.setAuthTag(Buffer.from(authTagHex, "hex"));

    const decifrado = Buffer.concat([
      decifra.update(Buffer.from(dadosHex, "hex")),
      decifra.final(),
    ]);

    return decifrado.toString("utf8");
  } catch (erro) {
    console.error("[crypto] Falha ao descriptografar valor:", erro.message);
    return null;
  }
}

module.exports = { criptografar, descriptografar };
