import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { socket, connectSocket, disconnectSocket } from './lib/socket.js';
import { ThemeProvider } from './context/ThemeContext.jsx';

import { store, setConnected } from './store';
import { useAuth } from './hooks/useAuth.js';
import { getMeUser, setTokenExpired } from './store/authSlice.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Onboarding from './pages/Onboarding.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GigMarketplace from './pages/GigMarketplace.jsx';
import GigDetail from './pages/GigDetail.jsx';
import PostGig from './pages/PostGig.jsx';
import RecommendedGigs from './pages/freelancer/RecommendedGigs.jsx';
import Messages from './pages/Messages.jsx';
import UserProfile from './pages/UserProfile.jsx';
import PaymentHistory from './pages/PaymentHistory.jsx';
import Disputes from './pages/Disputes.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AnalyticsDashboard from './pages/freelancer/AnalyticsDashboard.jsx';
import Dashboard from './pages/Dashboard.jsx';

const queryClient = new QueryClient();

function AuthSync({ children }) {
  const dispatch = useDispatch();
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    if (token) dispatch(getMeUser());
    const handleAuthExpired = () => dispatch(setTokenExpired());
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [dispatch, token]);

  return children;
}

function SocketSync({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (isAuthenticated && token) {
      connectSocket(token);
      const onConnect = () => dispatch(setConnected(true));
      const onDisconnect = () => dispatch(setConnected(false));
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      if (socket.connected) dispatch(setConnected(true));
      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        disconnectSocket();
      };
    }
  }, [dispatch, isAuthenticated]);

  return children;
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthSync>
            <Router>
              <SocketSync>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/gigs" element={<GigMarketplace />} />
                  <Route path="/gigs/:id" element={<GigDetail />} />
                  <Route path="/profile/:id" element={<UserProfile />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/gigs/post" element={<PostGig />} />
                    <Route path="/recommended-gigs" element={<RecommendedGigs />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/payments/history" element={<PaymentHistory />} />
                    <Route path="/disputes" element={<Disputes />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/freelancer/analytics" element={<AnalyticsDashboard />} />
                  </Route>
                </Routes>
              </SocketSync>
            </Router>
          </AuthSync>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
