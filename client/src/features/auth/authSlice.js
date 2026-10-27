import { createSlice } from '@reduxjs/toolkit';

const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const savedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

const initialState = {
  user: savedUser || null,
  token: savedToken || null,
  isAuthenticated: !!savedToken,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.accessToken || action.payload.token;
      if (typeof window !== 'undefined') {
        if (state.token) localStorage.setItem('token', state.token);
        if (action.payload.refreshToken) localStorage.setItem('refreshToken', action.payload.refreshToken);
        if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken || action.payload.token;
      state.isAuthenticated = !!state.token;
      if (typeof window !== 'undefined') {
        if (state.token) localStorage.setItem('token', state.token);
        if (action.payload.refreshToken) localStorage.setItem('refreshToken', action.payload.refreshToken);
        if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
