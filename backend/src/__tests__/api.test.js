import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  process.env.DB_FALLBACK_TO_SQLITE = 'true';
  process.env.DATABASE_URL = '';
  process.env.ADMIN_PASSWORD = 'admin';
  process.env.JWT_SECRET = 'test-secret';
  const bcrypt = require('bcryptjs');
  const { sequelize, authenticate } = require('../database/sequelize');
  const { Usuario } = require('../database/models');
  app = require('../app');
  await authenticate();
  await sequelize.sync({ force: true });
  const hash = bcrypt.hashSync('admin', 10);
  await Usuario.create({ id: 1, username: 'admin', password: hash, role: 'root', ativo: 1 });
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.version).toBe('1.1.2');
  });
});

describe('POST /api/login', () => {
  it('rejects empty body', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('obrigatórios');
  });

  it('rejects wrong credentials', async () => {
    const res = await request(app).post('/api/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('inválidos');
  });

  it('accepts valid credentials and sets cookie', async () => {
    const res = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('token=');
  });
});

describe('Auth guard', () => {
  it('rejects /api/veiculos without token', async () => {
    const res = await request(app).get('/api/veiculos');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Autorização requerida');
  });

  it('rejects /api/files without token', async () => {
    const res = await request(app).get('/api/files/test.pdf');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Autorização requerida');
  });

  it('accepts /api/veiculos with a valid session cookie', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    const res = await request(app).get('/api/veiculos').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE with requireRole', () => {
  it('returns 404 for non-existent vehicle (admin role passes)', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    const res = await request(app).delete('/api/veiculos/NONEXISTENT').set('Cookie', cookie);
    expect(res.status).toBe(404);
  });
});

describe('Upload validation', () => {
  it('rejects invalid file types', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const res = await request(app)
      .post('/api/multas')
      .set('Cookie', cookie)
      .attach('path_anexo_multa_pdf', Buffer.from('fake exe'), 'virus.exe');

    expect(res.status).toBe(500);
  });
});

describe('SQL injection protection', () => {
  it('parameterized queries prevent injection', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const res = await request(app)
      .get("/api/veiculos?placa='; DROP TABLE veiculos;--")
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
