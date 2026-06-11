import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI, getApiError } from '../services/api';
import { Spinner } from '../components/Spinner';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Mirror the backend zod rules so users get instant, friendly feedback.
  const validate = () => {
    if (form.firstName.trim().length < 3) return 'First name must be at least 3 characters.';
    if (form.lastName.trim().length < 3) return 'Last name must be at least 3 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (form.phoneNumber.trim().length < 10 || form.phoneNumber.trim().length > 16)
      return 'Phone number must be between 10 and 16 characters.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await userAPI.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });
      navigate('/login', {
        replace: true,
        state: { registered: true },
      });
    } catch (err) {
      setError(getApiError(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Create your account</h1>
          <p className="mt-1 text-ink-500">Join BusGo and book your next trip in minutes.</p>
        </div>

        <div className="card-pad">
          {error && <div className="alert-error mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

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
                placeholder="At least 6 characters"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-block btn-lg">
              {loading ? <Spinner className="h-5 w-5 text-white" /> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
