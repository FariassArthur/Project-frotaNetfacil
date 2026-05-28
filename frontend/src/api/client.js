export const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001' : '';

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
  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    const text = await response.text().catch(() => '');
    try { return JSON.parse(text); }
    catch { return { error: 'Sessão expirada. Faça login novamente.' }; }
  }
  const text = await response.text().catch(() => '');
  try { return JSON.parse(text); }
  catch { return { error: 'Erro inesperado do servidor' }; }
}

export async function login(username, password) {
  const response = await fetch(`${apiBase}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
}

export async function fetchList(endpoint, token) {
  const response = await fetch(`${apiBase}${endpoint}`, fetchOptions(token));
  return handleResponse(response);
}

export async function fetchOne(endpoint, id, token) {
  const response = await fetch(`${apiBase}${endpoint}/${encodeURIComponent(id)}`, fetchOptions(token));
  return handleResponse(response);
}

export async function createItem(endpoint, data, token) {
  const { body, headers } = buildRequest(data, token);
  const response = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    body,
    headers,
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function updateItem(endpoint, id, data, token) {
  const { body, headers } = buildRequest(data, token);
  const response = await fetch(`${apiBase}${endpoint}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
    headers,
    credentials: 'include',
  });
  return handleResponse(response);
}

export async function deleteItem(endpoint, id, token) {
  const response = await fetch(`${apiBase}${endpoint}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...fetchOptions(token),
  });
  return handleResponse(response);
}

export async function fetchUsers(token) {
  const response = await fetch(`${apiBase}/api/usuarios`, fetchOptions(token));
  return handleResponse(response);
}

export async function createUser(data, token) {
  const response = await fetch(`${apiBase}/api/usuarios`, {
    method: 'POST',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateUser(id, data, token) {
  const response = await fetch(`${apiBase}/api/usuarios/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteUser(id, token) {
  const response = await fetch(`${apiBase}/api/usuarios/${id}`, {
    method: 'DELETE',
    ...fetchOptions(token),
  });
  return handleResponse(response);
}

export async function logout(token) {
  const response = await fetch(`${apiBase}/api/logout`, {
    method: 'POST',
    ...fetchOptions(token),
  });
  return handleResponse(response);
}

export async function changePassword(currentPassword, newPassword, token) {
  const response = await fetch(`${apiBase}/api/usuarios/alterar-senha`, {
    method: 'PUT',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(response);
}

export async function fetchHealth(token) {
  const response = await fetch(`${apiBase}/api/health`, fetchOptions(token));
  return handleResponse(response);
}

export async function fetchMe() {
  const response = await fetch(`${apiBase}/api/me`, { credentials: 'include' });
  return handleResponse(response);
}

export function getItemValue(item, fieldName) {
  if (item == null) return undefined;
  if (item[fieldName] !== undefined && item[fieldName] !== null) return item[fieldName];
  const snake = fieldName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return item[snake];
}

export function getFileUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const cleaned = filePath.replace(/^public[\\/]/, '');
  return `${apiBase}/api/files/${cleaned}`;
}
