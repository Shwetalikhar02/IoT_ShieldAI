/**
 * api.js — Centralized client API communication service for CodeShield AI
 */

const BASE_URL = '/api'

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json'
  }

  const token = localStorage.getItem('codeshield_token')
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = { text: await response.text() }
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`
    const error = new Error(errorMsg)
    // @ts-ignore
    error.status = response.status
    // @ts-ignore
    error.data = data
    throw error
  }

  return data
}

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
export const authApi = {
  async register(name, email, password, confirmPassword) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: { name, email, password, confirmPassword }
    })
    if (data.token) {
      localStorage.setItem('codeshield_token', data.token)
    }
    return data
  },

  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    if (data.token) {
      localStorage.setItem('codeshield_token', data.token)
    }
    return data
  },

  async getMe() {
    return request('/auth/me', { method: 'GET' })
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem('codeshield_token')
    }
  },

  async resetPassword(email, newPassword) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: { email, newPassword }
    })
  },

  async updateProfile(name) {
    return request('/auth/profile', {
      method: 'PUT',
      body: { name }
    })
  },

  async changePassword(currentPassword, newPassword) {
    return request('/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword }
    })
  },

  async deleteAccount(confirmationText) {
    const res = await request('/auth/account', {
      method: 'DELETE',
      body: { confirmationText }
    })
    localStorage.removeItem('codeshield_token')
    return res
  }
}

// -------------------------------------------------------------
// Projects & Firmware Files
// -------------------------------------------------------------
export const projectsApi = {
  async list() {
    return request('/projects', { method: 'GET' })
  },

  async create(name, description, targetArch) {
    return request('/projects', {
      method: 'POST',
      body: { name, description, targetArch }
    })
  },

  async get(projectId) {
    return request(`/projects/${projectId}`, { method: 'GET' })
  },

  async update(projectId, data) {
    return request(`/projects/${projectId}`, {
      method: 'PUT',
      body: data
    })
  },

  async delete(projectId) {
    return request(`/projects/${projectId}`, { method: 'DELETE' })
  },

  async addFile(projectId, name, code, category) {
    return request(`/projects/${projectId}/files`, {
      method: 'POST',
      body: { name, code, category }
    })
  },

  async updateFile(projectId, fileId, data) {
    return request(`/projects/${projectId}/files/${fileId}`, {
      method: 'PUT',
      body: data
    })
  },

  async deleteFile(projectId, fileId) {
    return request(`/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE'
    })
  },

  async scan(projectId) {
    return request(`/projects/${projectId}/scan`, {
      method: 'POST'
    })
  },

  async repair(projectId, vulnerabilityId, constraint) {
    return request(`/projects/${projectId}/repair`, {
      method: 'POST',
      body: { vulnerabilityId, constraint }
    })
  },

  async submitReview(projectId, patchId, vulnerabilityId, decision, reviewNotes) {
    return request(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: { patchId, vulnerabilityId, decision, reviewNotes }
    })
  },

  async verify(projectId, patchId, fileId) {
    return request(`/projects/${projectId}/verify`, {
      method: 'POST',
      body: { patchId, fileId }
    })
  },

  async getReport(projectId) {
    return request(`/projects/${projectId}/report`, { method: 'GET' })
  }
}

// -------------------------------------------------------------
// AI Security Assistant (Context-Aware)
// -------------------------------------------------------------
export const aiApi = {
  async askAssistant(query, projectId, context, consentProvided = true) {
    return request('/ai/assistant', {
      method: 'POST',
      body: { query, projectId, context, consentProvided }
    })
  },

  async getChats(projectId) {
    return request(`/projects/${projectId}/chats`, { method: 'GET' })
  },

  async clearChats(projectId) {
    return request(`/projects/${projectId}/chats`, { method: 'DELETE' })
  }
}

// -------------------------------------------------------------
// Reviews & Feedback
// -------------------------------------------------------------
export const reviewsApi = {
  async getCommunityReviews() {
    return request('/reviews', { method: 'GET' })
  },

  async createReview(rating, title, feedback, category) {
    return request('/reviews', {
      method: 'POST',
      body: { rating, title, feedback, category }
    })
  },

  async updateReview(id, data) {
    return request(`/reviews/${id}`, {
      method: 'PUT',
      body: data
    })
  },

  async deleteReview(id) {
    return request(`/reviews/${id}`, { method: 'DELETE' })
  }
}
