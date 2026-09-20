/**
 * Clínica Alvea - Configuração de upload de arquivos (Multer)
 *
 * Dois destinos:
 *  - uploads/exames  -> laudos em PDF ou imagem anexados pelo admin
 *  - uploads/perfis  -> foto de perfil do paciente
 *
 * Os arquivos são servidos estaticamente pelo Express em /uploads/...
 * (configurado em server.js).
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function garantirPasta(pasta) {
  const caminho = path.join(UPLOADS_DIR, pasta);
  if (!fs.existsSync(caminho)) {
    fs.mkdirSync(caminho, { recursive: true });
  }
  return caminho;
}

function nomeUnico(nomeOriginal) {
  const extensao = path.extname(nomeOriginal);
  const sufixo = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${sufixo}${extensao}`;
}

function criarStorage(pasta) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, garantirPasta(pasta)),
    filename: (req, file, cb) => cb(null, nomeUnico(file.originalname)),
  });
}

const FILTRO_EXAME = (req, file, cb) => {
  const permitidos = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de arquivo não permitido. Envie PDF, PNG, JPG ou WEBP."));
  }
};

const FILTRO_FOTO = (req, file, cb) => {
  const permitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de imagem não permitido. Envie PNG, JPG ou WEBP."));
  }
};

const uploadExame = multer({
  storage: criarStorage("exames"),
  fileFilter: FILTRO_EXAME,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadFotoPerfil = multer({
  storage: criarStorage("perfis"),
  fileFilter: FILTRO_FOTO,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { uploadExame, uploadFotoPerfil, UPLOADS_DIR };
