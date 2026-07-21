import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth.api.js';

export default function VerifyEmail() {
  const location = useLocation();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing in the request URL.');
      return;
    }

    const performVerification = async () => {
      try {
        const res = await verifyEmail(token);
        if (res.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(res.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'An error occurred during verification.');
      }
    };

    performVerification();
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-2xl relative">
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            SkillSphere
          </span>
        </div>

        {status === 'verifying' && (
          <div>
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold">Verifying Email...</h2>
            <p className="text-slate-400 mt-2">Checking validation token with SkillSphere services.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-3xl text-emerald-400 mx-auto mb-6">
              ✓
            </div>
            <h2 className="text-2xl font-bold">Account Verified!</h2>
            <p className="text-slate-400 mt-2">Your email address has been successfully verified.</p>
            <Link
              to="/login?verified=true"
              className="mt-8 inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/30 w-full"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-3xl text-rose-400 mx-auto mb-6">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold">Verification Failed</h2>
            <p className="text-rose-300 mt-3 text-sm bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
              {message}
            </p>
            <p className="text-slate-400 mt-4 text-xs">
              The link may have expired or was already used. Please register again or request a new verification link.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-all border border-slate-700"
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
