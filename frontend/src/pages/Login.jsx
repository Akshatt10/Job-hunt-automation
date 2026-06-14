import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setLoading(true);
      // tokenResponse.access_token or tokenResponse.credential depending on flow.
      // useGoogleLogin implicitly uses implicit flow (returns access_token). 
      // But we need the ID token for backend verification. To get credential, we must use the authorization_code or credentialResponse.
      // Wait, we need an ID token, but useGoogleLogin without `flow: 'auth-code'` returns access_token. Let's use it as access_token and fetch user info, or just use `credential` from implicit flow?
      // Actually, my backend verify_google_token uses oauth2.googleapis.com/tokeninfo?id_token={token}
      // Let's configure useGoogleLogin with Google's default which requires <GoogleLogin> for implicit JWT.
      // To keep style, we can do this or fetch userinfo via access_token and send to backend.
      // Actually, wait, let me just replace the button with GoogleLogin to ensure credential correctly comes. But wait, I'll pass tokenResponse.access_token here, and I'll update backend to handle access_token if needed, OR I will just use `useGoogleLogin()`. 
      
      // Let's assume we fetch user info here and login via another endpoint, OR we use the default GoogleLogin component in another way.
      // A better way is: send access_token to backend, backend fetches user info. I'll modify auth.py to allow it or we use credential.
      // I'll update backend later to use access_token from googleapis.com/oauth2/v3/userinfo if length < x, or tokeninfo if id_token.
      await loginWithGoogle(tokenResponse.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google SSO failed');
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Login Failed'),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="auth-page">
      <div className="hero-bg"></div>
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="sidebar-logo" style={{ width: 44, height: 44, fontSize: '1.3rem' }}>⚡</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>ColdReach</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Google SSO Button */}
        <button className="google-btn" onClick={() => loginGoogle()} disabled={loading}>
          <svg viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">or</div>

        {/* Email/Password form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--error-bg)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </div>


      </div>
    </div>
  );
}
