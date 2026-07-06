import { configureStore, createSlice } from '@reduxjs/toolkit';

const appSlice = createSlice({
  name: 'app',
  initialState: {
    user: null,
    connected: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
  },
});

export const { setUser, setConnected } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});
