import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

let app;
let cookie;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  process.env.DB_FALLBACK_TO_SQLITE = 'true';
  process.env.DATABASE_URL = '';
  process.env.ADMIN_PASSWORD = 'admin';
  process.env.JWT_SECRET = 'test-secret';
  const bcrypt = require('bcryptjs');
  const { sequelize, authenticate } = require('../database/sequelize');
  const { Usuario, Veiculo, Cnh } = require('../database/models');
  app = require('../app');
  await authenticate();
  await sequelize.sync({ force: true });
  const hash = bcrypt.hashSync('admin', 10);
  await Usuario.create({ id: 1, username: 'admin', password: hash, role: 'root', ativo: 1 });
  await Veiculo.create({ placa: 'ABC1D23', tipo: 'Caminhão', fipe_name_marca: 'Volkswagen', fipe_modelo: 'Constellation', km: 120000, cor: 'Branco', uf: 'SP', cidade: 'São Paulo', ativo: 1 });
  await Cnh.create({ numero_registro: '123456789', nome: 'Motorista Teste', nascimento: '1990-01-01', categoria: 'B', cpf: '12345678900', validade: '2030-01-01', emissao: '2020-01-01', local: 'DETRAN-SP' });
  const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
  cookie = loginRes.headers['set-cookie'][0].split(';')[0];
});

describe('CSV import endpoints', () => {
  it('returns a model template for multas', async () => {
    const res = await request(app).get('/api/importar/csv/modelo/multas');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('data_ocorrencia');
    expect(res.text).toContain('data_vencimento');
  });

  it('previews a CSV with synonym headers correctly', async () => {
    const csv = 'placa_veiculo,valor,dt_ocorrencia,local_infracao,motorista_id,data_vencimento\nABC1D23,120.50,2025-01-10,Rua A,123456789,2025-02-15';
    const res = await request(app)
      .post('/api/importar/csv/preview')
      .set('Cookie', cookie)
      .field('tabela', 'multas')
      .attach('file', Buffer.from(csv), 'multas.csv');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.campos_mapeados).toContain('valor');
    expect(res.body.campos_mapeados).toContain('data_ocorrencia');
    expect(res.body.campos_mapeados).toContain('local_ocorrencia');
    expect(res.body.campos_mapeados).toContain('veiculo_id');
    expect(res.body.campos_ignorados).not.toContain('placa_veiculo');
  });

  it('imports a valid multas CSV payload', async () => {
    const csv = 'placa_veiculo,valor,dt_ocorrencia,local_infracao,motorista_id,data_vencimento\nABC1D23,120.50,2025-01-10,Rua A,123456789,2025-02-15';
    const res = await request(app)
      .post('/api/importar/csv')
      .set('Cookie', cookie)
      .field('tabela', 'multas')
      .attach('file', Buffer.from(csv), 'multas.csv');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.importados).toBe(1);
    expect(res.body.erros).toBe(0);
    expect(res.body.campos_mapeados).toContain('valor');
  });
});
