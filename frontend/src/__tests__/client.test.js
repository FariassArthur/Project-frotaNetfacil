import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('client.js API module', () => {
  it('fetchList adds credentials include and Bearer token', async () => {
    mockFetch.mockResolvedValue({
      status: 200, ok: true,
      text: () => Promise.resolve(JSON.stringify([{ id: 1 }])),
    });

    const { fetchList } = await import('../api/client');
    await fetchList('/api/veiculos', 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/veiculos',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('fetchList returns error on timeout', async () => {
    mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

    const { fetchList } = await import('../api/client');
    const result = await fetchList('/api/veiculos', 'token');

    expect(result.error).toBe('Tempo limite excedido');
  });

  it('fetchList returns connection error on network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const { fetchList } = await import('../api/client');
    const result = await fetchList('/api/veiculos', 'token');

    expect(result.error).toBe('Erro de conexão');
  });

  it('handleResponse calls onUnauthorized on 401', async () => {
    const { setOnUnauthorized } = await import('../api/client');
    const onUnauth = vi.fn();
    setOnUnauthorized(onUnauth);

    mockFetch.mockResolvedValue({
      status: 401, ok: false,
      text: () => Promise.resolve(JSON.stringify({ error: 'Token expirado' })),
    });

    const { fetchList } = await import('../api/client');
    await fetchList('/api/veiculos', 'token');

    expect(onUnauth).toHaveBeenCalled();
  });

  it('login sends username and password', async () => {
    mockFetch.mockResolvedValue({
      status: 200, ok: true,
      text: () => Promise.resolve(JSON.stringify({ token: 'abc', user: { id: 1 } })),
    });

    const { login } = await import('../api/client');
    const result = await login('admin', 'senha123');

    expect(result.token).toBe('abc');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ username: 'admin', password: 'senha123' }),
      })
    );
  });

  it('getFileUrl returns /api/files/ path', async () => {
    const { getFileUrl } = await import('../api/client');
    const url = getFileUrl('public/uploads/doc.pdf');
    expect(url).toContain('/api/files/uploads/doc.pdf');
  });

  it('getFileUrl returns null for invalid input', async () => {
    const { getFileUrl } = await import('../api/client');
    expect(getFileUrl(null)).toBeNull();
    expect(getFileUrl(undefined)).toBeNull();
    expect(getFileUrl(123)).toBeNull();
  });

  it('buildRequest creates FormData for file uploads', async () => {
    const { buildRequest } = await import('../api/client');
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = buildRequest({ name: 'test', file }, 'token');

    expect(result.body instanceof FormData).toBe(true);
    expect(result.headers.Authorization).toBe('Bearer token');
  });

  it('verify buildRequest handles File objects', async () => {
    const { buildRequest } = await import('../api/client');
    const file = new File(['pdf-content'], 'doc.pdf', { type: 'application/pdf' });
    const result = buildRequest({ file, name: 'test' }, 'tok');

    expect(result.body instanceof FormData).toBe(true);
    expect(result.body.get('name')).toBe('test');
    expect(result.body.get('file') instanceof File).toBe(true);
  });
});
