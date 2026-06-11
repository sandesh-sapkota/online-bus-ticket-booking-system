import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { userAPI, getApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Spinner';

export default function Login() {
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email-verification step (only used if the backend asks for a code).
  const [verification, setVerification] = useState(null); // { id }
  const [code, setCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/buses';
  const justRegistered = location.state?.registered;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload =
        mode === 'email'
          ? { email: form.email.trim(), password: form.password }
          : { phoneNumber: form.phoneNumber.trim(), password: form.password };

      const res = await userAPI.login(payload);
      const token = res?.data?.token;
      if (!token) throw new Error('Login succeeded but no token was returned.');

      await login(token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const verificationId = err?.response?.data?.verificationId;
      if (verificationId) {
        setVerification({ id: verificationId });
        setVerifyMsg(getApiError(err, 'Please verify your email to continue.'));
      } else {
        setError(getApiError(err, 'Login failed. Please check your credentials.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await userAPI.verifyEmail(verification.id, { sixDigitVerificationCode: code });
      setVerification(null);
      setCode('');
      setVerifyMsg('');
      setError('');
      await handleSubmit(e);
    } catch (err) {
      setError(getApiError(err, 'Verification failed. Check the 6-digit code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-fg">Welcome back</h1>
          <p className="mt-1 text-muted">Sign in to manage your trips and bookings.</p>
        </div>

        <div className="card-pad">
          {verification ? (
            <form onSubmit={handleVerify} className="space-y-5">
              {verifyMsg && <div className="alert-info">{verifyMsg}</div>}
              {error && <div className="alert-error">{error}</div>}
              <div>
                <label className="label" htmlFor="code">
                  6-digit verification code
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field tracking-[0.5em] text-center text-lg"
                  placeholder="••••••"
                  required
                />
                <p className="mt-2 text-xs text-faint">
                  We sent a code to your email. Enter it to verify your account.
                </p>
              </div>
              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary btn-block btn-lg">
                {loading ? <Spinner className="h-5 w-5 text-accent-fg" /> : 'Verify & sign in'}
              </button>
              <button
                type="button"
                className="btn-ghost btn-block"
                onClick={() => {
                  setVerification(null);
                  setVerifyMsg('');
                  setError('');
                }}
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {justRegistered && (
                <div className="alert-success">Account created successfully — please sign in.</div>
              )}
              {error && <div className="alert-error">{error}</div>}

              <div className="flex rounded-xl bg-surface2 p-1 text-sm font-medium">
                {['email', 'phone'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg py-2 capitalize transition ${
                      mode === m ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-fg'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {mode === 'email' ? (
                <div>
                  <label className="label" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="label" htmlFor="phoneNumber">
                    Phone number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="98XXXXXXXX"
                    required
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary btn-block btn-lg">
                {loading ? <Spinner className="h-5 w-5 text-accent-fg" /> : 'Sign in'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-hover">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
