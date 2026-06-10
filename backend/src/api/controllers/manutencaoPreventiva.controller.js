const { Op } = require('sequelize');
const models = require('../../database/models');
const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');

const { ConfigManutencaoPreventiva, TipoManutencao, Veiculo } = models;

async function listConfig(req, res) {
  try {
    const { veiculo_id } = req.query;
    const where = {};
    if (veiculo_id) where.veiculo_id = veiculo_id;
    const rows = await ConfigManutencaoPreventiva.findAll({
      where,
      include: [{ model: TipoManutencao, attributes: ['descricao'], as: 'tipoManutencao' }],
      order: [['km_proxima', 'ASC']],
    });
    const result = rows.map(r => { const json = r.toJSON(); json.tipo_descricao = json.tipoManutencao?.descricao || null; delete json.tipoManutencao; return json; });
    res.json(result);
  } catch (error) { handleError(res, error, 'manutencao-preventiva.config'); }
}

async function createConfig(req, res) {
  try {
    const { veiculo_id, tipo_manutencao_id, descricao, km_intervalo, km_proxima, meses_intervalo, data_proxima, ativo } = req.body;
    const created = await ConfigManutencaoPreventiva.create({
      veiculo_id, tipo_manutencao_id: tipo_manutencao_id || null, descricao: descricao || null,
      km_intervalo: km_intervalo || null, km_proxima: km_proxima || null,
      meses_intervalo: meses_intervalo || null, data_proxima: data_proxima || null,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : 1,
    });
    res.status(201).json({ ok: true, id: created.id });
  } catch (error) { handleError(res, error, 'manutencao-preventiva.config'); }
}

async function updateConfig(req, res) {
  try {
    const { id } = req.params;
    const existing = await ConfigManutencaoPreventiva.findByPk(id);
    if (!existing) return res.status(404).json({ error: 'Configuração não encontrada' });
    const body = req.body;
    await ConfigManutencaoPreventiva.update({
      veiculo_id: body.veiculo_id ?? existing.veiculo_id,
      tipo_manutencao_id: body.tipo_manutencao_id !== undefined ? body.tipo_manutencao_id : existing.tipo_manutencao_id,
      descricao: body.descricao !== undefined ? body.descricao : existing.descricao,
      km_intervalo: body.km_intervalo !== undefined ? body.km_intervalo : existing.km_intervalo,
      km_proxima: body.km_proxima !== undefined ? body.km_proxima : existing.km_proxima,
      meses_intervalo: body.meses_intervalo !== undefined ? body.meses_intervalo : existing.meses_intervalo,
      data_proxima: body.data_proxima !== undefined ? body.data_proxima : existing.data_proxima,
      ativo: body.ativo !== undefined ? (body.ativo ? 1 : 0) : existing.ativo,
    }, { where: { id } });
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'manutencao-preventiva.config'); }
}

async function deleteConfig(req, res) {
  try {
    await ConfigManutencaoPreventiva.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'manutencao-preventiva.config'); }
}

async function alertas(req, res) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const seteDias = new Date(); seteDias.setDate(seteDias.getDate() + 7);
    const dataLimite = seteDias.toISOString().slice(0, 10);
    const [alertasResult, proximosResult] = await Promise.all([
      sequelize.query(`
        SELECT c.*, v.placa, v.fipe_modelo, v.km as km_atual, t.descricao as tipo_descricao
        FROM config_manutencao_preventiva c JOIN veiculos v ON c.veiculo_id = v.placa
        LEFT JOIN tipo_manutencao t ON c.tipo_manutencao_id = t.id
        WHERE c.ativo = 1 AND ((c.km_proxima IS NOT NULL AND v.km >= c.km_proxima) OR (c.data_proxima IS NOT NULL AND c.data_proxima <= ?))
        ORDER BY c.km_proxima ASC
      `, { replacements: [hoje], type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT c.*, v.placa, v.fipe_modelo, v.km as km_atual, t.descricao as tipo_descricao
        FROM config_manutencao_preventiva c JOIN veiculos v ON c.veiculo_id = v.placa
        LEFT JOIN tipo_manutencao t ON c.tipo_manutencao_id = t.id
        WHERE c.ativo = 1 AND ((c.km_proxima IS NOT NULL AND v.km >= (c.km_proxima - c.km_intervalo * 0.1) AND v.km < c.km_proxima) OR (c.data_proxima IS NOT NULL AND c.data_proxima > ? AND c.data_proxima <= ?))
        ORDER BY c.km_proxima ASC
      `, { replacements: [hoje, dataLimite], type: sequelize.QueryTypes.SELECT }),
    ]);
    res.json({ alertas: alertasResult, proximos: proximosResult });
  } catch (error) { handleError(res, error, 'manutencao-preventiva.alertas'); }
}

async function checkin(req, res) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const alertasResult = await sequelize.query(`
      SELECT c.*, v.placa, v.km
      FROM config_manutencao_preventiva c JOIN veiculos v ON c.veiculo_id = v.placa
      WHERE c.ativo = 1 AND ((c.km_proxima IS NOT NULL AND v.km >= c.km_proxima) OR (c.data_proxima IS NOT NULL AND c.data_proxima <= ?))
    `, { replacements: [hoje], type: sequelize.QueryTypes.SELECT });
    let updated = 0;
    for (const cfg of alertasResult) {
      const nextKm = cfg.km_intervalo ? (cfg.km + cfg.km_intervalo) : null;
      let nextDate = null;
      if (cfg.meses_intervalo) { const d = new Date(); d.setMonth(d.getMonth() + cfg.meses_intervalo); nextDate = d.toISOString().slice(0, 10); }
      await ConfigManutencaoPreventiva.update({ km_proxima: nextKm, data_proxima: nextDate }, { where: { id: cfg.id } });
      updated++;
    }
    res.json({ ok: true, updated });
  } catch (error) { handleError(res, error, 'manutencao-preventiva.checkin'); }
}

module.exports = { listConfig, createConfig, updateConfig, deleteConfig, alertas, checkin };
