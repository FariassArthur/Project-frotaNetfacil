// API client with authentication support
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
    return { body: form, headers: { 'Authorization': `Bearer ${token}` } };
  }

  return { body: JSON.stringify(formData), headers: getHeaders(token) };
};

async function handleResponse(response) {
  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    return { error: 'Sessão expirada. Faça login novamente.' };
  }
  return response.json();
}

// Auth endpoints
export async function login(username, password) {
  const response = await fetch(`${apiBase}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

// Generic CRUD operations
export async function fetchList(endpoint, token) {
  const response = await fetch(`${apiBase}${endpoint}`, { headers: getHeaders(token) });
  return handleResponse(response);
}

export async function fetchOne(endpoint, id, token) {
  const response = await fetch(`${apiBase}${endpoint}/${id}`, { headers: getHeaders(token) });
  return handleResponse(response);
}

export async function createItem(endpoint, data, token) {
  const { body, headers } = buildRequest(data, token);
  const response = await fetch(`${apiBase}${endpoint}`, { method: 'POST', body, headers });
  return handleResponse(response);
}

export async function updateItem(endpoint, id, data, token) {
  const { body, headers } = buildRequest(data, token);
  const response = await fetch(`${apiBase}${endpoint}/${id}`, { method: 'PUT', body, headers });
  return handleResponse(response);
}

export async function deleteItem(endpoint, id, token) {
  const response = await fetch(`${apiBase}${endpoint}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  return handleResponse(response);
}

// User management
export async function fetchUsers(token) {
  const response = await fetch(`${apiBase}/api/usuarios`, { headers: getHeaders(token) });
  return handleResponse(response);
}

export async function createUser(data, token) {
  const response = await fetch(`${apiBase}/api/usuarios`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export async function updateUser(id, data, token) {
  const response = await fetch(`${apiBase}/api/usuarios/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export async function deleteUser(id, token) {
  const response = await fetch(`${apiBase}/api/usuarios/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  return handleResponse(response);
}

export async function logout(token) {
  const response = await fetch(`${apiBase}/api/logout`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  return handleResponse(response);
}

export async function changePassword(currentPassword, newPassword, token) {
  const response = await fetch(`${apiBase}/api/usuarios/alterar-senha`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return handleResponse(response);
}

export async function fetchHealth(token) {
  const response = await fetch(`${apiBase}/api/health`, { headers: getHeaders(token) });
  return handleResponse(response);
}

// Try camelCase first, then snake_case (API returns snake_case for some modules)
export function getItemValue(item, fieldName) {
  if (item == null) return undefined;
  if (item[fieldName] !== undefined && item[fieldName] !== null) return item[fieldName];
  const snake = fieldName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return item[snake];
}

export function getFileUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  // stored paths are like "public/uploads/module/filename.pdf"
  // strip the "public/" prefix to get the URL path
  const cleaned = filePath.replace(/^public[\\/]/, '');
  return `${apiBase}/files/${cleaned}`;
}
