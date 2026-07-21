import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  loginUser,
  registerUser,
  getMeUser,
  logoutUser,
  clearError as clearErrorAction,
} from '../store/authSlice.js';

/**
 * Custom hook to consume and control authentication status and details in React components.
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error, errorCode } = useSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (email, password) => {
      const result = await dispatch(loginUser({ email, password }));
      return result;
    },
    [dispatch]
  );

  const register = useCallback(
    async (userData) => {
      const result = await dispatch(registerUser(userData));
      return result;
    },
    [dispatch]
  );

  const getMe = useCallback(async () => {
    const result = await dispatch(getMeUser());
    return result;
  }, [dispatch]);

  const logout = useCallback(async () => {
    const result = await dispatch(logoutUser());
    return result;
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearErrorAction());
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    errorCode,
    login,
    register,
    getMe,
    logout,
    clearError,
  };
};
