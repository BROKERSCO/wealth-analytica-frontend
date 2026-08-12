// src/lib/api.ts
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://analytica.wmwealthmanagement.com.br'
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
})

// Injeta token em toda requisição
api.interceptors.request.use(config => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh automático do token se 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = Cookies.get('refresh_token')
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
          Cookies.set('access_token', data.accessToken, { expires: 1 })
          if (data.refreshToken) Cookies.set('refresh_token', data.refreshToken, { expires: 7 })
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        }
      } catch {
        // refresh falhou
      }
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, senha: string) =>
    api.post('/api/auth/login', { email, senha }),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ─── Cases ────────────────────────────────────────────────────────────────────
export const casesApi = {
  listar: () => api.get('/api/cases'),
  buscar: (id: string) => api.get(`/api/cases/${id}`),
  criar: (data: any) => api.post('/api/cases', data),
  atualizarContrato: (id: string, contrato: any) =>
    api.patch(`/cases/${id}/contrato`, contrato),
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  listar: (caseId: string) => api.get(`/api/transactions/${caseId}`),
  importarBulk: (caseId: string, parcelas: any[]) =>
    api.post('/api/transactions/bulk', { caseId, parcelas }),
}

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsApi = {
  preview: (caseId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = Cookies.get('access_token')
    return api.post(`/api/documents/preview/${caseId}`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    })
  },
  upload: (caseId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = Cookies.get('access_token')
    return api.post(`/api/documents/upload/${caseId}`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

// ─── Laudos ───────────────────────────────────────────────────────────────────
export const laudosApi = {
  gerar: (data: { caseId: string; peritoNome: string; peritoOab?: string; peritoTitulacao?: string }) =>
    api.post('/api/laudos', data),
  buscar: (id: string) => api.get(`/api/laudos/${id}`),
  listarDoCase: (caseId: string) => api.get(`/api/laudos/case/${caseId}`),
  auditTrail: (id: string) => api.get(`/api/laudos/${id}/audit-trail`),
}
