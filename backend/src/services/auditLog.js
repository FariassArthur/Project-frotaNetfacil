const { run } = require('../database/connection');

async function logAudit({ user_id, username, acao, entidade, entidade_id, descricao, dados_antigos, dados_novos, ip }) {
  try {
    await run(
      `INSERT INTO logs_auditoria (user_id, username, acao, entidade, entidade_id, descricao, dados_antigos, dados_novos, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id || null, username || 'sistema', acao, entidade, entidade_id || null, descricao || null,
       dados_antigos ? JSON.stringify(dados_antigos) : null,
       dados_novos ? JSON.stringify(dados_novos) : null,
       ip || null]
    );
  } catch (err) {
    console.error('Audit log error:', err.message || err);
  }
}

module.exports = { logAudit };
