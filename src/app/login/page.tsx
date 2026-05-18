'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password');
      return;
    }

    // Fetch session to get role
    const res = await fetch('/api/auth/session');
    const session = await res.json();
    const role = session?.user?.role;

    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'manager') router.push('/manager/dashboard');
    else router.push('/employee/dashboard');
  };

  const quickLogin = (preset: string) => {
    setEmail(`${preset}@atomberg.com`);
    setPassword('password123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-mark">G</div>
          <h1>GoalTracker</h1>
          <p>AtomQuest Performance Management Portal</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="login-creds">
          <h4>Quick Demo Access</h4>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => quickLogin('employee')} type="button">
              👤 Employee
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => quickLogin('manager')} type="button">
              👥 Manager
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => quickLogin('admin')} type="button">
              🛡️ Admin
            </button>
          </div>
          <p style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-muted)' }}>
            Password for all: <code>password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
