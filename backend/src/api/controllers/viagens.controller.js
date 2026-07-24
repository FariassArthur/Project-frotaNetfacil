const { Op } = require('sequelize');
const models = require('../../database/models');
const { sequelize } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');
const { parseInteger, parseDateToISO, buildSearchFilter } = require('../utils/helpers');

const { Viagem, Veiculo } = models;

async function syncKmVeiculo(veiculoId, kmFinal) {
  if (!veiculoId || !kmFinal) return;
  await Veiculo.update({ km: kmFinal }, { where: { placa: veiculoId } });
}

function buildWhereClause(filters) {
  if (!filters.length) return '';
  return 'WHERE ' + filters.join(' AND ');
}

async function ativas(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query._page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query._limit, 10) || 200));
    const offset = (page - 1) * limit;
    const filters = ['v.km_final IS NULL'];
    const replacements = [];
    const countArr = await sequelize.query(
      `SELECT COUNT(*) as total FROM viagens v ${buildWhereClause(filters)}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = countArr[0]?.total || 0;
    const rows = await sequelize.query(`
      SELECT v.*, c.nome as motorista_nome, vei.fipe_modelo as veiculo_modelo
      FROM viagens v LEFT JOIN cnhs c ON v.motorista_id = c.numero_registro
      LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa
      ${buildWhereClause(filters)} ORDER BY v.data_saida DESC LIMIT ? OFFSET ?
    `, { replacements: [...replacements, limit, offset], type: sequelize.QueryTypes.SELECT });
    res.set('X-Total-Count', String(total));
    res.json(rows);
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function estatisticas(req, res) {
  try {
    const { veiculo_id, data_inicio, data_fim } = req.query;
    const filters = []; const replacements = [];
    if (veiculo_id) { filters.push('v.veiculo_id = ?'); replacements.push(veiculo_id); }
    if (data_inicio) { filters.push('v.data_saida >= ?'); replacements.push(parseDateToISO(data_inicio) || data_inicio); }
    if (data_fim) { filters.push('v.data_saida <= ?'); replacements.push(parseDateToISO(data_fim) || data_fim); }
    const where = buildWhereClause(filters);
    const [totalViagensArr, totalKmArr, porVeiculo, mesAtualArr] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as total FROM viagens v ${where}`, { replacements, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COALESCE(SUM(v.km_final - v.km_inicial), 0) as total FROM viagens v ${where}${where ? ' AND' : ' WHERE'} v.km_final IS NOT NULL AND v.km_inicial IS NOT NULL`, { replacements, type: sequelize.QueryTypes.SELECT }),
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
    const { veiculo_id, motorista_id, _page, _limit, _q } = req.query;
    const filters = []; const replacements = [];
    if (veiculo_id) { filters.push('v.veiculo_id = ?'); replacements.push(veiculo_id); }
    if (motorista_id) { filters.push('v.motorista_id = ?'); replacements.push(motorista_id); }
    if (_q && _q.trim()) {
      filters.push('(v.destino ILIKE ? OR v.descricao ILIKE ? OR vei.fipe_modelo ILIKE ?)');
      const term = `%${_q.trim()}%`;
      replacements.push(term, term, term);
    }
    const where = buildWhereClause(filters);
    const page = Math.max(1, parseInt(_page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(_limit, 10) || 200));
    const offset = (page - 1) * limit;
    const [countArr, rows] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as total FROM viagens v LEFT JOIN veiculos vei ON v.veiculo_id = vei.placa ${where}`, { replacements, type: sequelize.QueryTypes.SELECT }),
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
      data_saida: parseDateToISO(data_saida) || now,
      data_saida_s: parseDateToISO(data_saida) || now,
      data_retorno: parseDateToISO(data_retorno) || null,
      data_retorno_s: parseDateToISO(data_retorno) || null,
      km_inicial: parseInteger(km_inicial),
      km_final: parseInteger(km_final),
      destino: destino || null, descricao: descricao || null,
    });
    await syncKmVeiculo(veiculo_id, parseInteger(km_final));
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
      data_saida: body.data_saida !== undefined ? (parseDateToISO(body.data_saida) || body.data_saida) : existing.data_saida,
      data_retorno: body.data_retorno !== undefined ? (parseDateToISO(body.data_retorno) || body.data_retorno) : existing.data_retorno,
      km_inicial: body.km_inicial !== undefined ? parseInteger(body.km_inicial) : existing.km_inicial,
      km_final: body.km_final !== undefined ? parseInteger(body.km_final) : existing.km_final,
      destino: body.destino !== undefined ? body.destino : existing.destino,
      descricao: body.descricao !== undefined ? body.descricao : existing.descricao,
    }, { where: { id: req.params.id } });
    const updated = await Viagem.findByPk(req.params.id);
    if (updated?.km_final && updated?.veiculo_id) {
      await syncKmVeiculo(updated.veiculo_id, updated.km_final);
    }
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'viagens'); }
}

async function remove(req, res) {
  try {
    const viagem = await Viagem.findByPk(req.params.id);
    if (!viagem) return res.status(404).json({ error: 'Viagem não encontrada' });
    await Viagem.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'viagens'); }
}

module.exports = { ativas, estatisticas, ultima, list, get, create, update, remove };
