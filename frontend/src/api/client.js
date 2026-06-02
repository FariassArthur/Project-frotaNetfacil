export const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001' : '';
const REQUEST_TIMEOUT = 30000;

let onUnauthorized = null;
export function setOnUnauthorized(cb) {
  onUnauthorized = cb;
}

export const getHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const fetchOptions = (token, extra = {}) => {
  const options = { credentials: 'include', ...extra };
  if (token) {
    options.headers = { ...options.headers, ...getHeaders(token) };
  }
  return options;
};

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export const buildRequest = (formData, token) => {
  const form = new FormData();
  let hasFile = false;

  Object.entries(formData).forEach(([key, value]) => {
    if (value instanceof File) {
      hasFile = true;
      form.append(key, value);
    } else if (typeof value === 'boolean') {
      form.append(key, String(value));
    } else if (value !== undefined && value !== null) {
      form.append(key, value);
    }
  });

  if (hasFile) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { body: form, headers };
  }

  return { body: JSON.stringify(formData), headers: getHeaders(token) };
};

async function handleResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: 'Erro inesperado do servidor' };
  }
  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    return data;
  }
  if (!response.ok) {
    throw new Error(data?.error || `Erro HTTP ${response.status}`);
  }
  return data;
}

export async function login(username, password) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function fetchList(endpoint, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}${endpoint}`, fetchOptions(token));
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function fetchListPaginated(endpoint, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}${endpoint}`, fetchOptions(token));
    const data = await handleResponse(response);
    if (data && !data.error) {
      return { data, total: parseInt(response.headers.get('X-Total-Count') || '0', 10) };
    }
    return { data, total: 0 };
  } catch (err) {
    return { data: [], total: 0, error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function fetchOne(endpoint, id, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}${endpoint}/${encodeURIComponent(id)}`, fetchOptions(token));
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function createItem(endpoint, data, token) {
  const { body, headers } = buildRequest(data, token);
  const response = await fetchWithTimeout(`${apiBase}${endpoint}`, {
    method: 'POST',
    body,
    headers,
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function updateItem(endpoint, id, data, token) {
  const { body, headers } = buildRequest(data, token);
  const response = await fetchWithTimeout(`${apiBase}${endpoint}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
    headers,
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function deleteItem(endpoint, id, token) {
  const response = await fetchWithTimeout(`${apiBase}${endpoint}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...fetchOptions(token),
  });
  return handleResponse(response);
}

export async function fetchUsers(token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/usuarios`, fetchOptions(token));
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function createUser(data, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/usuarios`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function updateUser(id, data, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/usuarios/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function deleteUser(id, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/usuarios/${id}`, {
      method: 'DELETE',
      ...fetchOptions(token),
    });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function logout(token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/logout`, {
      method: 'POST',
      ...fetchOptions(token),
    });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function changePassword(currentPassword, newPassword, token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/usuarios/alterar-senha`, {
      method: 'PUT',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function fetchHealth(token) {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/health`, fetchOptions(token));
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export async function fetchMe() {
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/me`, { credentials: 'include' });
    return handleResponse(response);
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro de conexão' };
  }
}

export function getItemValue(item, fieldName) {
  if (item == null) return undefined;
  if (fieldName.includes('.')) {
    const keys = fieldName.split('.');
    let val = item;
    for (const k of keys) {
      if (val == null || typeof val !== 'object') return undefined;
      val = val[k];
    }
    return val;
  }
  if (item[fieldName] !== undefined && item[fieldName] !== null) return item[fieldName];
  const snake = fieldName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return item[snake];
}

export function getFileUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  let cleaned = filePath.replace(/^public[\\/]/, '');
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\-./\\]/g, '');
  const segments = cleaned.split(/[\\/]/).filter(Boolean);
  if (segments.some((s) => s === '..')) return null;
  return `${apiBase}/api/files/${cleaned}`;
}
