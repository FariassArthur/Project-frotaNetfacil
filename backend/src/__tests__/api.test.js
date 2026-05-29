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
  const { initDb } = await import('../database/schema');
  app = (await import('../app')).default;
  await initDb();
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.version).toBe('1.1.0');
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
    expect(res.body.token).toBeTruthy();
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

  it('accepts /api/veiculos with valid token', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const token = loginRes.body.token;
    const res = await request(app).get('/api/veiculos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE with requireRole', () => {
  it('returns 404 for non-existent vehicle (admin role passes)', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const token = loginRes.body.token;
    const res = await request(app).delete('/api/veiculos/NONEXISTENT').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('Upload validation', () => {
  it('rejects invalid file types', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/multas')
      .set('Authorization', `Bearer ${token}`)
      .attach('path_anexo_multa_pdf', Buffer.from('fake exe'), 'virus.exe');

    expect(res.status).toBe(500);
  });
});

describe('SQL injection protection', () => {
  it('parameterized queries prevent injection', async () => {
    const loginRes = await request(app).post('/api/login').send({ username: 'admin', password: 'admin' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/veiculos?placa='; DROP TABLE veiculos;--")
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
