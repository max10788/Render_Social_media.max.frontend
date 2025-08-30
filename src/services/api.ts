import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getData = async <T>(endpoint: string) => {
  try {
    const response = await api.get<T>(endpoint)
    return response.data
  } catch (error) {
    throw error
  }
}

export const postData = async <T>(endpoint: string, data: any) => {
  try {
    const response = await api.post<T>(endpoint, data)
    return response.data
  } catch (error) {
    throw error
  }
}

export default api
