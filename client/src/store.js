import { configureStore, createSlice } from '@reduxjs/toolkit';
import authReducer from './store/authSlice.js';

const appSlice = createSlice({
  name: 'app',
  initialState: {
    connected: false,
  },
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
  },
});

export const { setConnected } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    auth: authReducer,
  },
});
