const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || '';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function isConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && NOTIFY_EMAIL);
}

async function sendAlert(subject, html) {
  if (!isConfigured()) return false;
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: NOTIFY_EMAIL,
      subject: `[Zênite] ${subject}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err.message || err);
    return false;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function notifyVencimentos(items) {
  if (items.length === 0) return;
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;color:${i.dias_atraso > 0 ? '#dc3545' : '#cc7a00'}">${escHtml(i.tipo)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${escHtml(i.titulo || '-')}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${escHtml(i.veiculo_id || '-')}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${escHtml(i.data)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold">${i.dias_atraso > 0 ? `${escHtml(i.dias_atraso)} dia(s) atrasado` : 'Vence em breve'}</td>
    </tr>
  `).join('');

  await sendAlert(`${items.length} vencimento(s) pendente(s)`, `
    <h2>Vencimentos Pendentes</h2>
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <thead><tr style="background:#f5f5f5">
        <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left">Tipo</th>
        <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left">Descrição</th>
        <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left">Veículo</th>
        <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left">Data</th>
        <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left">Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;color:#888;font-size:12px">Acesse o dashboard para mais detalhes.</p>
  `);
}

module.exports = { sendAlert, notifyVencimentos, isConfigured };
