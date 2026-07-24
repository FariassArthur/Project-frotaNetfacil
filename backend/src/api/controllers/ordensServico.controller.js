const { Op } = require('sequelize');
const { sequelize } = require('../../database/sequelize');
const { OrdemServico, Veiculo } = require('../../database/models');
const { handleError } = require('../../services/errorHandler');
const { parseDateToISO } = require('../utils/helpers');
const { OS_STATUSES } = require('../utils/constants');

async function list(req, res) {
  try {
    const { veiculo_id, status } = req.query;
    const filters = []; const params = [];
    if (veiculo_id) { filters.push('os.veiculo_id = ?'); params.push(veiculo_id); }
    if (status) { filters.push('os.status = ?'); params.push(status); }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
    const page = Math.max(1, parseInt(req.query._page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
    const offset = (page - 1) * limit;
    const [countResult, rows] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as total FROM ordens_servico os ${where}`, { replacements: params, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT os.*, v.placa, v.fipe_modelo, m.nome as mecanica_nome FROM ordens_servico os LEFT JOIN veiculos v ON os.veiculo_id = v.placa LEFT JOIN mecanicas m ON os.mecanica_id = m.id ${where} ORDER BY os.created_at DESC LIMIT ? OFFSET ?`, { replacements: [...params, limit, offset], type: sequelize.QueryTypes.SELECT }),
    ]);
    const total = countResult[0]?.total || 0;
    res.set('X-Total-Count', String(total));
    res.json(rows);
  } catch (error) { handleError(res, error, 'ordens-servico.list'); }
}

async function get(req, res) {
  try {
    const rows = await sequelize.query('SELECT os.*, v.placa, v.fipe_modelo, m.nome as mecanica_nome FROM ordens_servico os LEFT JOIN veiculos v ON os.veiculo_id = v.placa LEFT JOIN mecanicas m ON os.mecanica_id = m.id WHERE os.id = ?', { replacements: [req.params.id], type: sequelize.QueryTypes.SELECT });
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Ordem não encontrada' });
    res.json(row);
  } catch (error) { handleError(res, error, 'ordens-servico.get'); }
}

async function create(req, res) {
  try {
    const { veiculo_id, numero_os, data_abertura, km_atual, descricao, tipo, prioridade, mecanica_id, valor_mao_obra, valor_pecas, observacoes } = req.body;
    if (!veiculo_id || !data_abertura) return res.status(400).json({ error: 'veiculo_id e data_abertura são obrigatórios' });

    const veiculoExists = await Veiculo.findByPk(veiculo_id);
    if (!veiculoExists) return res.status(400).json({ error: 'Veículo não encontrado' });

    const dataISO = parseDateToISO(data_abertura);
    if (data_abertura && !dataISO) return res.status(400).json({ error: 'Formato de data inválido. Use DD/MM/AAAA ou AAAA-MM-DD.' });

    if (tipo && !['corretiva', 'preventiva', 'preditiva'].includes(tipo)) {
      return res.status(400).json({ error: `Tipo inválido. Valores permitidos: corretiva, preventiva, preditiva` });
    }
    if (prioridade && !['baixa', 'normal', 'alta', 'urgente'].includes(prioridade)) {
      return res.status(400).json({ error: `Prioridade inválida. Valores permitidos: baixa, normal, alta, urgente` });
    }

    const ordem = await OrdemServico.create({
      veiculo_id, data_abertura: dataISO, numero_os: numero_os || null, km_atual: km_atual || null,
      descricao: descricao || null, tipo: tipo || 'corretiva', prioridade: prioridade || 'normal',
      mecanica_id: mecanica_id || null, valor_mao_obra: valor_mao_obra || null,
      valor_pecas: valor_pecas || null, observacoes: observacoes || null,
      criado_por: req.user?.username || null,
    });
    res.status(201).json({ ok: true, id: ordem.id });
  } catch (error) { handleError(res, error, 'ordens-servico.create'); }
}

async function update(req, res) {
  try {
    const existing = await OrdemServico.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ordem não encontrada' });
    const b = req.body;

    if (b.data_abertura) {
      b.data_abertura = parseDateToISO(b.data_abertura);
      if (!b.data_abertura) return res.status(400).json({ error: 'Formato de data_abertura inválido. Use DD/MM/AAAA ou AAAA-MM-DD.' });
    }
    if (b.data_conclusao) {
      b.data_conclusao = parseDateToISO(b.data_conclusao);
      if (!b.data_conclusao) return res.status(400).json({ error: 'Formato de data_conclusao inválido. Use DD/MM/AAAA ou AAAA-MM-DD.' });
    }

    if (b.status && !OS_STATUSES.includes(b.status)) {
      return res.status(400).json({ error: `Status inválido. Valores permitidos: ${OS_STATUSES.join(', ')}` });
    }
    if (b.tipo && !['corretiva', 'preventiva', 'preditiva'].includes(b.tipo)) {
      return res.status(400).json({ error: `Tipo inválido. Valores permitidos: corretiva, preventiva, preditiva` });
    }
    if (b.prioridade && !['baixa', 'normal', 'alta', 'urgente'].includes(b.prioridade)) {
      return res.status(400).json({ error: `Prioridade inválida. Valores permitidos: baixa, normal, alta, urgente` });
    }

    await existing.update({
      veiculo_id: b.veiculo_id ?? existing.veiculo_id, numero_os: b.numero_os ?? existing.numero_os,
      data_abertura: b.data_abertura ?? existing.data_abertura, data_conclusao: b.data_conclusao ?? existing.data_conclusao,
      km_atual: b.km_atual ?? existing.km_atual, descricao: b.descricao ?? existing.descricao,
      tipo: b.tipo ?? existing.tipo, status: b.status ?? existing.status, prioridade: b.prioridade ?? existing.prioridade,
      mecanica_id: b.mecanica_id !== undefined ? b.mecanica_id : existing.mecanica_id,
      valor_mao_obra: b.valor_mao_obra ?? existing.valor_mao_obra, valor_pecas: b.valor_pecas ?? existing.valor_pecas,
      observacoes: b.observacoes ?? existing.observacoes,
    });
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'ordens-servico.update'); }
}

async function updateStatus(req, res) {
  try {
    const existing = await OrdemServico.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ordem não encontrada' });

    const { status, data_conclusao, km_atual } = req.body;
    if (!OS_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Valores permitidos: ${OS_STATUSES.join(', ')}` });
    }

    const updates = { status };
    if (data_conclusao) {
      const dataISO = parseDateToISO(data_conclusao);
      if (!dataISO) return res.status(400).json({ error: 'Formato de data_conclusao inválido. Use DD/MM/AAAA ou AAAA-MM-DD.' });
      updates.data_conclusao = dataISO;
    }
    if (km_atual) updates.km_atual = km_atual;

    await existing.update(updates);
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'ordens-servico.status'); }
}

async function remove(req, res) {
  try {
    const existing = await OrdemServico.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ordem não encontrada' });
    await existing.destroy();
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'ordens-servico.delete'); }
}

module.exports = { list, get, create, update, updateStatus, remove };
