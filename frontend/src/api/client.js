// API client utility - centralized base URL management
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  })
}

export default API_BASE_URL
