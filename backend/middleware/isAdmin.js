/**
 * Clínica Alvea - Middleware de autorização (admin)
 *
 * Deve ser usado sempre DEPOIS do middleware `auth`, pois depende
 * de req.usuario já estar preenchido. Bloqueia o acesso caso o
 * usuário autenticado não tenha o papel (role) "admin".
 */

function isAdmin(req, res, next) {
  if (!req.usuario || req.usuario.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  next();
}

module.exports = isAdmin;
