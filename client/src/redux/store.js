import { configureStore } from "@reduxjs/toolkit"

/** Replace with real slices (e.g. auth, appointments). */
const rootPlaceholder = (state = {}) => state

export const store = configureStore({
  reducer: {
    root: rootPlaceholder,
  },
})
