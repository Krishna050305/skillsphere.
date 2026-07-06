import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import axios from 'axios';
import { store, setUser, setConnected } from './store';

const queryClient = new QueryClient();

// Beautiful Dashboard Page Component
function Dashboard() {
  const dispatch = useDispatch();
  const socketConnected = useSelector((state) => state.app.connected);
  const user = useSelector((state) => state.app.user);

  // React Query for Server health check
  const { data: serverStatus, isLoading: serverLoading } = useQuery({
    queryKey: ['serverHealth'],
    queryFn: async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
        return res.data;
      } catch (err) {
        return { status: 'offline', error: err.message };
      }
    },
    refetchInterval: 5000,
  });

  // React Query for ML Service health check
  const { data: mlStatus, isLoading: mlLoading } = useQuery({
    queryKey: ['mlHealth'],
    queryFn: async () => {
      try {
        const res = await axios.get('http://localhost:8001/health', { timeout: 3000 });
        return res.data;
      } catch (err) {
        return { status: 'offline', error: err.message };
      }
    },
    refetchInterval: 5000,
  });

  // Connect socket
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      dispatch(setConnected(true));
    });

    socket.on('disconnect', () => {
      dispatch(setConnected(false));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const handleTestUser = () => {
    dispatch(setUser({ name: 'Freelancer ' + Math.floor(Math.random() * 1000), role: 'developer' }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SkillSphere
            </span>
            <span className="text-[10px] block text-slate-500 font-mono tracking-wider">HYPERLOCAL FREELANCE</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-indigo-400 transition-colors">Dashboard</Link>
          <Link to="/about" className="text-sm font-medium hover:text-indigo-400 transition-colors">About Project</Link>
          {user ? (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-mono font-medium text-slate-300">{user.name}</span>
            </div>
          ) : (
            <button
              onClick={handleTestUser}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-4 rounded-full transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/30"
            >
              Sign In (Demo)
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] rounded-full blur-3xl h-80 w-80 mx-auto"></div>
          <h1 className="text-5xl font-black tracking-tight mb-4">
            Monorepo Scaffolding{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Active
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
            Verify the system integrations below. The client dashboard communicates with Node.js/Express, socket.io, and the Python ML service.
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Node Express Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-slate-200">Express Backend</h2>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                serverStatus?.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}></span>
                {serverStatus?.status === 'ok' ? 'Online' : 'Offline'}
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Core server running Node.js, Express, MongoDB connection, authentication, and jobs.
            </p>
            <div className="border-t border-slate-800 pt-4 font-mono text-[11px] text-slate-500 flex justify-between">
              <span>Port: 5000</span>
              <span>{serverStatus?.timestamp ? new Date(serverStatus.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>

          {/* Python FastAPI Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-slate-200">ML Service</h2>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                mlStatus?.status === 'ok' || mlStatus?.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  mlStatus?.status === 'ok' || mlStatus?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}></span>
                {mlStatus?.status === 'ok' || mlStatus?.status === 'healthy' ? 'Online' : 'Offline'}
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              FastAPI machine learning engine handling job match scoring and semantic matching.
            </p>
            <div className="border-t border-slate-800 pt-4 font-mono text-[11px] text-slate-500 flex justify-between">
              <span>Port: 8001</span>
              <span>Model: sentence-transformers</span>
            </div>
          </div>

          {/* WebSockets Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-slate-200">WebSockets</h2>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                socketConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}></span>
                {socketConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Real-time collaboration, chat notifications, and live status synchronization socket room.
            </p>
            <div className="border-t border-slate-800 pt-4 font-mono text-[11px] text-slate-500 flex justify-between">
              <span>Socket.io</span>
              <span>React Context / Redux</span>
            </div>
          </div>
        </div>

        {/* Integration Test Section */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>⚙️</span> Monorepo Scaffolding Check
          </h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✔</span> Vite, React, Redux Toolkit, Tailwind config loaded.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✔</span> React Query fetching live health checks.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✔</span> Socket.io client listening on port 5000.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✔</span> ESLint + Prettier rules configured.
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

// About Page Component
function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <nav className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SkillSphere
            </span>
          </div>
        </div>
        <div className="flex gap-6">
          <Link to="/" className="text-sm font-medium hover:text-indigo-400 transition-colors">Dashboard</Link>
          <Link to="/about" className="text-sm font-medium hover:text-indigo-400 transition-colors">About Project</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 flex-1">
        <h1 className="text-4xl font-extrabold mb-6">About SkillSphere</h1>
        <p className="text-slate-300 text-lg leading-relaxed mb-6">
          SkillSphere is a hyperlocal freelance marketplace with AI-powered job matching, milestone-based escrow payments, and real-time collaboration tools.
        </p>
        <p className="text-slate-400 mb-8">
          The monorepo contains a modern client application powered by Vite, React, Tailwind CSS, Redux Toolkit, and TanStack React Query. The backend is an Express Node.js application managing authentication, databases, and notifications. A Python FastAPI service implements the NLP embedding models for hyperlocal semantic job and talent matching.
        </p>
        <Link to="/" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
          Back to Dashboard
        </Link>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere. Hyperlocal Freelancing.</p>
      </footer>
    </div>
  );
}

// Router Setup
export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}
