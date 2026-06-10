const { LogAuditoria } = require('../database/models');

async function logAudit({ user_id, username, acao, entidade, entidade_id, descricao, dados_antigos, dados_novos, ip }) {
  try {
    await LogAuditoria.create({
      user_id: user_id || null,
      username: username || 'sistema',
      acao,
      entidade,
      entidade_id: entidade_id || null,
      descricao: descricao || null,
      dados_antigos: dados_antigos ? JSON.stringify(dados_antigos) : null,
      dados_novos: dados_novos ? JSON.stringify(dados_novos) : null,
      ip: ip || null,
    });
  } catch (err) {
    console.error('Audit log error:', err.message || err);
  }
}

module.exports = { logAudit };
