import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../api/auth.api.js';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      sessionStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const code = error.response?.data?.code || 'LOGIN_ERROR';
      return rejectWithValue({ message, code });
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authApi.register(userData);
      sessionStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      const code = error.response?.data?.code || 'REGISTER_ERROR';
      return rejectWithValue({ message, code });
    }
  }
);

export const getMeUser = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.getMe();
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to retrieve profile';
      const code = error.response?.data?.code || 'GET_ME_ERROR';
      return rejectWithValue({ message, code });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout server call failed', error);
    }
    sessionStorage.removeItem('token');
    return null;
  }
);

const token = sessionStorage.getItem('token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: token || null,
    isAuthenticated: !!token,
    loading: false,
    error: null,
    errorCode: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.errorCode = null;
    },
    setTokenExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = 'Session has expired, please log in again.';
      state.errorCode = 'TOKEN_EXPIRED';
    },
    updateProfileSuccess: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.errorCode = action.payload.code;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.errorCode = action.payload.code;
        state.isAuthenticated = false;
      })
      // Get Me
      .addCase(getMeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(getMeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMeUser.rejected, (state, action) => {
        state.loading = false;
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.errorCode = null;
      });
  },
});

export const { clearError, setTokenExpired, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
