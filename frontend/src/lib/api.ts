const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions extends RequestInit {
  token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      response.status,
      data.error || 'An error occurred',
      data
    );
  }

  return data.data as T;
}

// Auth API
export const authApi = {
  register: (body: { email: string; password: string; phone?: string; gdprConsent: boolean }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    fetchApi<{ accessToken: string; refreshToken: string; user: unknown }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  logout: (token: string) =>
    fetchApi('/auth/logout', { method: 'POST', token }),

  me: (token: string) =>
    fetchApi<unknown>('/auth/me', { token }),

  refresh: (refreshToken: string) =>
    fetchApi<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  sendPhoneCode: (phone: string, token: string) =>
    fetchApi('/auth/phone/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      token,
    }),

  verifyPhone: (phone: string, code: string, token: string) =>
    fetchApi('/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      token,
    }),
};

// Jobs API
export const jobsApi = {
  create: (body: unknown, token: string) =>
    fetchApi('/jobs', { method: 'POST', body: JSON.stringify(body), token }),

  list: (token: string) =>
    fetchApi<unknown[]>('/jobs', { token }),

  get: (id: string, token?: string, secretToken?: string) => {
    const params = secretToken ? `?rf=${secretToken}` : '';
    return fetchApi<unknown>(`/jobs/${id}${params}`, { token });
  },

  getPublic: (slug: string) =>
    fetchApi<unknown>(`/jobs/public/${slug}`),

  update: (id: string, body: unknown, token: string) =>
    fetchApi(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),

  delete: (id: string, token: string) =>
    fetchApi(`/jobs/${id}`, { method: 'DELETE', token }),

  generateSecret: (id: string, token: string, expiresAt?: string) =>
    fetchApi<{ secretToken: string; secretUrl: string }>(
      `/jobs/${id}/secret`,
      { method: 'POST', body: JSON.stringify({ expiresAt }), token }
    ),

  resetSecret: (id: string, token: string) =>
    fetchApi<{ secretToken: string; secretUrl: string }>(
      `/jobs/${id}/secret/reset`,
      { method: 'POST', token }
    ),
};

// Chat API
export const chatApi = {
  createConversation: (token: string) =>
    fetchApi<{ id: string }>('/chat/conversations', { method: 'POST', token }),

  getConversation: (id: string, token: string) =>
    fetchApi<unknown>(`/chat/conversations/${id}`, { token }),

  sendMessage: (conversationId: string, content: string, attachments: string[], token: string) =>
    fetchApi<unknown>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
      token,
    }),

  completeConversation: (conversationId: string, token: string) =>
    fetchApi<{ jobId: string }>(`/chat/conversations/${conversationId}/complete`, {
      method: 'POST',
      token,
    }),

  // Employer <-> Admin threads
  getThreads: (token: string) =>
    fetchApi<unknown[]>('/chat/threads', { token }),

  getThread: (jobId: string, token: string) =>
    fetchApi<unknown>(`/chat/threads/${jobId}`, { token }),

  sendThreadMessage: (jobId: string, content: string, token: string) =>
    fetchApi(`/chat/threads/${jobId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      token,
    }),
};

// Profile API
export const profileApi = {
  get: (token: string) =>
    fetchApi<unknown>('/profile', { token }),

  update: (body: unknown, token: string) =>
    fetchApi('/profile', { method: 'PUT', body: JSON.stringify(body), token }),
};

// Upload API
export const uploadApi = {
  getPresignedUrl: (fileName: string, fileType: string, token: string) =>
    fetchApi<{ uploadUrl: string; fileUrl: string; uploadId: string }>(
      '/uploads/presign',
      { method: 'POST', body: JSON.stringify({ fileName, fileType }), token }
    ),

  confirmUpload: (uploadId: string, jobId: string, uploadType: string, token: string) =>
    fetchApi('/uploads', {
      method: 'POST',
      body: JSON.stringify({ uploadId, jobId, uploadType }),
      token,
    }),

  delete: (id: string, token: string) =>
    fetchApi(`/uploads/${id}`, { method: 'DELETE', token }),
};

// Generic api object that wraps fetchApi
export const api = {
  get: <T>(endpoint: string, token?: string) => fetchApi<T>(endpoint, { token }),
  post: <T>(endpoint: string, body?: unknown, token?: string) =>
    fetchApi<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, token }),
  put: <T>(endpoint: string, body?: unknown, token?: string) =>
    fetchApi<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, token }),
  delete: <T>(endpoint: string, token?: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE', token }),
};

export { ApiError };
