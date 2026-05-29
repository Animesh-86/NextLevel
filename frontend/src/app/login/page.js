'use client';
import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiFetch, getApiBaseUrl, getBackendUrl } from '@/lib/api';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const res = await apiFetch('/api/auth/register', {
          auth: false,
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Registration failed');
          setLoading(false);
          return;
        }

        // Auto-login after registration
        const loginRes = await apiFetch('/api/auth/login', {
          auth: false,
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });
        
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
           document.cookie = `token=${loginData.token}; path=/; max-age=2592000; SameSite=Lax`;
           router.push('/dashboard');
        } else {
           setError('Registered successfully. Please log in.');
           setMode('login');
        }
        setLoading(false);
      } else {
        const res = await apiFetch('/api/auth/login', {
          auth: false,
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.token) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

        document.cookie = `token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-grid" />
      </div>

      <div className="auth-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
          </div>
          <h1 className="auth-title">NextLevel</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to continue your practice' : 'Create your account to start'}
          </p>
          <Link href="/" className="auth-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', textDecoration: 'none', transition: 'color 0.2s' }}>
            <ArrowLeft size={14} />
            Back to Landing Page
          </Link>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            <LogIn size={16} />
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            <UserPlus size={16} />
            Register
          </button>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input auth-input"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input auth-input"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="input auth-input"
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-toggle-password"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input auth-input"
                  required={!isLogin}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={20} className="auth-spinner" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
          <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
        </div>

        <a
          href={`${getBackendUrl()}/oauth2/authorization/google`}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <p>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }}
              className="auth-switch"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
