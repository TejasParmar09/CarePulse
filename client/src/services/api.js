import axios from "axios"
import { store } from "../store/store"
import { logout } from "../store/authSlice"

export function getApiErrorMessage(error) {
  if (!error) return "Something went wrong"
  if (error.response?.data?.message) return error.response.data.message
  if (error.message === "Network Error" || !error.response) {
    return "Network error. Please check your internet connection."
  }
  return error.message || "Something went wrong"
}

const api = axios.create({
  baseURL: "http://localhost:5000/api",
})

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token || localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    // attach normalized message for convenience in pages
    error.normalizedMessage = getApiErrorMessage(error)
    return Promise.reject(error)
  },
)

export default api
