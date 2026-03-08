import { api } from './client'

export const projectsApi = {
  list: () => api.get('/projects/').then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (data) => api.post('/projects/', data).then((r) => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data).then((r) => r.data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  commits: (id) => api.get(`/projects/${id}/github`).then((r) => r.data),
  activity: (id) => api.get(`/projects/${id}/activity`).then((r) => r.data),
}
