const { sequelize, getActiveDbName } = require('../../database/sequelize');
const { handleError } = require('../../services/errorHandler');
const models = require('../../database/models');
const { parseBool } = require('../utils/helpers');

const { Combustivel, TipoManutencao, Configuracao, Versao } = models;

async function health(req, res) {
  res.json({
    ok: true,
    db: getActiveDbName(),
    version: process.env.npm_package_version || '1.1.1'
  });
}

async function listCombustiveis(req, res) {
  try {
    const rows = await Combustivel.findAll({ order: [['id', 'ASC']] });
    res.json(rows);
  } catch (error) { handleError(res, error, 'lookup'); }
}

async function listTiposManutencao(req, res) {
  try {
    const rows = await TipoManutencao.findAll({ order: [['id', 'ASC']] });
    res.json(rows);
  } catch (error) { handleError(res, error, 'lookup'); }
}

async function getConfiguracoes(req, res) {
  try {
    const config = await Configuracao.findOne({ where: { id: 1 } });
    if (!config) return res.status(404).json({ error: 'Configuração não encontrada' });
    res.json(config);
  } catch (error) { handleError(res, error, 'lookup'); }
}

async function upsertConfiguracoes(req, res) {
  const { codPais, idioma, cultureInfo } = req.body || {};
  try {
    if (!codPais || !idioma || !cultureInfo) return res.status(400).json({ error: 'codPais, idioma e cultureInfo são obrigatórios' });
    await Configuracao.upsert({ id: 1, cod_pais: codPais, idioma, culture_info: cultureInfo });
    res.json({ ok: true });
  } catch (error) { handleError(res, error, 'lookup'); }
}

async function getVersao(req, res) {
  try {
    const row = await Versao.findOne({ where: { id: 1 } });
    res.json(row || { version: process.env.npm_package_version || '1.1.1' });
  } catch (error) { handleError(res, error, 'lookup'); }
}

module.exports = { health, listCombustiveis, listTiposManutencao, getConfiguracoes, upsertConfiguracoes, getVersao };
