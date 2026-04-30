import { createSlice } from "@reduxjs/toolkit"

const savedToken = localStorage.getItem("token")

const initialState = {
  user: null,
  token: savedToken || null,
  isAuthenticated: Boolean(savedToken),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload || {}
      state.user = user || null
      state.token = token || null
      state.isAuthenticated = Boolean(token)
      state.error = null
      if (token) localStorage.setItem("token", token)
      else localStorage.removeItem("token")
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      localStorage.removeItem("token")
    },
    setLoading: (state, action) => {
      state.loading = Boolean(action.payload)
    },
    setError: (state, action) => {
      state.error = action.payload || null
      state.loading = false
    },
  },
})

export const { setCredentials, logout, setLoading, setError } = authSlice.actions
export default authSlice.reducer
