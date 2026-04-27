const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function formatApiErrorDetail(detail, fallbackStatus) {
  if (!detail) {
    return `No se pudo completar la solicitud. (${fallbackStatus})`;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg && item?.loc) {
          const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
          return field ? `${field}: ${item.msg}` : item.msg;
        }
        if (item?.msg) return item.msg;
        return '';
      })
      .filter(Boolean);

    return messages.join(' · ') || `No se pudo completar la solicitud. (${fallbackStatus})`;
  }

  if (typeof detail === 'object') {
    if (detail.message && typeof detail.message === 'string') {
      return detail.message;
    }

    const entries = Object.entries(detail)
      .map(([key, value]) => {
        if (typeof value === 'string') return `${key}: ${value}`;
        if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
        return '';
      })
      .filter(Boolean);

    return entries.join(' · ') || `No se pudo completar la solicitud. (${fallbackStatus})`;
  }

  return `No se pudo completar la solicitud. (${fallbackStatus})`;
}

async function apiRequest(path, options = {}) {
  let response;

  const { headers: optionHeaders = {}, ...restOptions } = options;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...optionHeaders,
      },
    });
  } catch (error) {
    throw new Error('No pude conectar con el backend. Si estás en local, enciende el backend en el puerto 8000 o configura VITE_API_BASE_URL.');
  }

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { detail: rawText || '' };
  }
  if (!response.ok) {
    throw new Error(formatApiErrorDetail(data?.detail, response.status));
  }

  return data;
}

export async function requestEmailCode(email) {
  return apiRequest('/auth/request-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailCode(email, code) {
  return apiRequest('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function getEmailSession(token) {
  return apiRequest('/auth/session', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listAllowedEmails(token) {
  return apiRequest('/auth/admin/allowed-emails', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export async function addAllowedEmail(token, payload) {
  return apiRequest('/auth/admin/allowed-emails', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateAllowedEmail(token, email, payload) {
  return apiRequest(`/auth/admin/allowed-emails/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteAllowedEmail(token, email) {
  return apiRequest(`/auth/admin/allowed-emails/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function loginWithPassword(email, password) {
  return apiRequest('/auth/login-password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loadUserCloudData(token) {
  return apiRequest('/cloud/data', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export async function saveUserCloudData(token, payload) {
  return apiRequest('/cloud/data', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ payload }),
  });
}
