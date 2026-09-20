/**
 * Clínica Alvea - Utilitário de envio de e-mail
 *
 * Usa Nodemailer com uma conta Gmail (via Senha de App) para enviar
 * confirmações de agendamento reais ao paciente.
 *
 * Configuração necessária no .env:
 *   EMAIL_USER=seuemail@gmail.com
 *   EMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx  (senha de app de 16 caracteres, não a senha normal)
 *
 * Caso essas variáveis não estejam configuradas, o envio é automaticamente
 * ignorado (modo silencioso) e a ação principal (ex: criar agendamento)
 * continua funcionando normalmente — o e-mail é um "extra", nunca bloqueia
 * o fluxo do usuário.
 */

const nodemailer = require("nodemailer");
require("dotenv").config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

const emailConfigurado = Boolean(EMAIL_USER && EMAIL_APP_PASSWORD);

let transporter = null;

if (emailConfigurado) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
} else {
  console.warn(
    "[email] EMAIL_USER/EMAIL_APP_PASSWORD não configurados no .env — envio de e-mail desativado (modo silencioso)."
  );
}

/**
 * Envia um e-mail. Retorna { enviado: boolean, erro?: string }.
 * Nunca lança exceção — falha de envio não deve derrubar a requisição principal.
 */
async function enviarEmail({ destinatario, assunto, html }) {
  if (!emailConfigurado) {
    return { enviado: false, erro: "E-mail não configurado no servidor (.env)." };
  }

  try {
    await transporter.sendMail({
      from: `"Clínica Alvea" <${EMAIL_USER}>`,
      to: destinatario,
      subject: assunto,
      html,
    });
    return { enviado: true };
  } catch (erro) {
    console.error("[email] Falha ao enviar:", erro.message);
    return { enviado: false, erro: erro.message };
  }
}

function templateConfirmacaoAgendamento({ nomePaciente, especialidade, profissionalNome, dataHora }) {
  const data = new Date(dataHora);
  const dataFormatada = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const horaFormatada = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #333;">
      <h2 style="color: #0F6E8C;">Agendamento confirmado — Clínica Alvea</h2>
      <p>Olá, ${nomePaciente}!</p>
      <p>Seu agendamento foi confirmado com sucesso. Confira os detalhes:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #6B7280;">Especialidade</td><td style="padding: 8px 0; font-weight: bold;">${especialidade}</td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">Profissional</td><td style="padding: 8px 0; font-weight: bold;">${profissionalNome}</td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">Data</td><td style="padding: 8px 0; font-weight: bold;">${dataFormatada}</td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">Horário</td><td style="padding: 8px 0; font-weight: bold;">${horaFormatada}</td></tr>
      </table>
      <p style="color: #6B7280; font-size: 13px;">Caso precise cancelar, acesse sua área do paciente na plataforma da Clínica Alvea.</p>
      <p style="color: #6B7280; font-size: 13px; margin-top: 24px;">Clínica Alvea — Tecnologia que respira cuidado.</p>
    </div>
  `;
}

module.exports = { enviarEmail, templateConfirmacaoAgendamento, emailConfigurado };
