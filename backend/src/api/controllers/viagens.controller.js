const { Op } = require('sequelize');
const models = require('../../database/models');
const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');

const { Viagem, Veiculo } = models;

async function ativas(req, res) {
  try {
    const rows = await sequelize.query(`
      SELECT v.*, c.nome as motorista_nome, vei.fipe_modelo as veiculo_modelo
      FROM viagens v LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro
      LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
      WHERE v.km_final IS NULL ORDER BY v.data_saida DESC
    `, { type: sequelize.QueryTypes.SELECT });
    res.json(rows);
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function estatisticas(req, res) {
  try {
    const { veiculo_id, data_inicio, data_fim } = req.query;
    const filters = []; const replacements = [];
    if (veiculo_id) { filters.push('v.veiculo_id = ?'); replacements.push(veiculo_id); }
    if (data_inicio) { filters.push('v.data_saida >= ?'); replacements.push(data_inicio); }
    if (data_fim) { filters.push('v.data_saida <= ?'); replacements.push(data_fim); }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
    const [totalViagensArr, totalKmArr, porVeiculo, mesAtualArr] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as total FROM viagens v ${where}`, { replacements, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COALESCE(SUM(v.km_final - v.km_inicial), 0) as total FROM viagens v ${where} AND v.km_final IS NOT NULL AND v.km_inicial IS NOT NULL`, { replacements, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT v.veiculo_id, vei.fipe_modelo, COUNT(*) as total_viagens, COALESCE(SUM(CASE WHEN v.km_final IS NOT NULL AND v.km_inicial IS NOT NULL THEN v.km_final - v.km_inicial ELSE 0 END), 0) as total_km FROM viagens v LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa ${where} GROUP BY v.veiculo_id ORDER BY total_viagens DESC`, { replacements, type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as total FROM viagens v WHERE v.data_saida >= ? AND v.data_saida <= ?', { replacements: [new Date().toISOString().slice(0, 7) + '-01', new Date().toISOString().slice(0, 10)], type: sequelize.QueryTypes.SELECT }),
    ]);
    const totalViagens = totalViagensArr[0]?.total || 0;
    const totalKm = totalKmArr[0]?.total || 0;
    const mesAtual = mesAtualArr[0]?.total || 0;
    res.json({ total_viagens: totalViagens, total_km: totalKm, mes_atual: mesAtual, por_veiculo: porVeiculo });
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function ultima(req, res) {
  try {
    const row = await Viagem.findOne({
      where: { veiculo_id: req.params.placa, km_final: { [Op.not]: null } },
      order: [['data_retorno', 'DESC']],
    });
    res.json(row || null);
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function list(req, res) {
  try {
    const { veiculo_id, motorista_id, _page, _limit } = req.query;
    const filters = []; const replacements = [];
    if (veiculo_id) { filters.push('v.veiculo_id = ?'); replacements.push(veiculo_id); }
    if (motorista_id) { filters.push('v.motorista_id = ?'); replacements.push(motorista_id); }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
    const page = Math.max(1, parseInt(_page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(_limit, 10) || 200));
    const offset = (page - 1) * limit;
    const [countArr, rows] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as total FROM viagens v ${where}`, { replacements, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT v.*, c.nome as motorista_nome, vei.fipe_modelo as veiculo_modelo FROM viagens v LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa ${where} ORDER BY v.data_saida DESC LIMIT ? OFFSET ?`, { replacements: [...replacements, limit, offset], type: sequelize.QueryTypes.SELECT }),
    ]);
    const total = countArr[0]?.total || 0;
    res.set('X-Total-Count', String(total));
    res.json(rows);
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function get(req, res) {
  try {
    const rows = await sequelize.query('SELECT v.*, c.nome as motorista_nome FROM viagens v LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro WHERE v.id = ?', { replacements: [req.params.id], type: sequelize.QueryTypes.SELECT });
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Viagem não encontrada' });
    res.json(row);
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function create(req, res) {
  try {
    const { veiculo_id, motorista_id, data_saida, data_retorno, km_inicial, km_final, destino, descricao } = req.body;
    const now = new Date().toISOString().slice(0, 10);
    const created = await Viagem.create({
      veiculo_id, motorista_id: motorista_id || null,
      data_saida: data_saida || now, data_saida_s: data_saida || now,
      data_retorno: data_retorno || null, data_retorno_s: data_retorno || null,
      km_inicial: km_inicial !== undefined && km_inicial !== null && km_inicial !== '' ? parseInt(km_inicial, 10) : null,
      km_final: km_final !== undefined && km_final !== null && km_final !== '' ? parseInt(km_final, 10) : null,
      destino: destino || null, descricao: descricao || null,
    });
    if (km_final !== undefined && km_final !== null && km_final !== '') {
      await Veiculo.update({ km: parseInt(km_final, 10) }, { where: { placa: veiculo_id } });
    }
    res.status(201).json({ ok: true, id: created.id });
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function update(req, res) {
  try {
    const existing = await Viagem.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Viagem não encontrada' });
    const body = req.body;
    await Viagem.update({
      veiculo_id: body.veiculo_id ?? existing.veiculo_id,
      motorista_id: body.motorista_id !== undefined ? body.motorista_id : existing.motorista_id,
      data_saida: body.data_saida ?? existing.data_saida,
      data_retorno: body.data_retorno !== undefined ? body.data_retorno : existing.data_retorno,
      km_inicial: body.km_inicial !== undefined ? parseInt(body.km_inicial, 10) : existing.km_inicial,
      km_final: body.km_final !== undefined ? parseInt(body.km_final, 10) : existing.km_final,
      destino: body.destino !== undefined ? body.destino : existing.destino,
      descricao: body.descricao !== undefined ? body.descricao : existing.descricao,
    }, { where: { id: req.params.id } });
    const updated = await Viagem.findByPk(req.params.id);
    if (updated?.km_final && updated?.veiculo_id) {
      await Veiculo.update({ km: updated.km_final }, { where: { placa: updated.veiculo_id } });
    }
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function remove(req, res) {
  try {
    await Viagem.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'viagens'); }
}

module.exports = { ativas, estatisticas, ultima, list, get, create, update, remove };
