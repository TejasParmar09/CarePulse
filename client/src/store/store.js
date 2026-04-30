import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./authSlice"
import appointmentReducer from "./appointmentSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointment: appointmentReducer,
  },
})
