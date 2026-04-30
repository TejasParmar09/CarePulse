import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  appointments: [],
  selectedAppointment: null,
  loading: false,
}

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setAppointments: (state, action) => {
      state.appointments = Array.isArray(action.payload) ? action.payload : []
    },
    addAppointment: (state, action) => {
      if (action.payload) state.appointments.unshift(action.payload)
    },
    updateAppointment: (state, action) => {
      const incoming = action.payload
      if (!incoming || !incoming._id) return
      state.appointments = state.appointments.map((appt) =>
        appt._id === incoming._id ? { ...appt, ...incoming } : appt,
      )
      if (state.selectedAppointment?._id === incoming._id) {
        state.selectedAppointment = { ...state.selectedAppointment, ...incoming }
      }
    },
    setSelected: (state, action) => {
      state.selectedAppointment = action.payload || null
    },
  },
})

export const { setAppointments, addAppointment, updateAppointment, setSelected } =
  appointmentSlice.actions
export default appointmentSlice.reducer
