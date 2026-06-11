import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { bookingAPI, getApiError } from '../services/api';
import { Spinner } from '../components/Spinner';

const formatDate = (value) => {
  if (!value) return 'TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'TBA';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(Boolean(location.state?.justBooked));

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingAPI.getBookings();
      setBookings(res?.data?.data ?? []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load your bookings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Clear the one-time success banner from history state so it won't re-show.
  useEffect(() => {
    if (location.state?.justBooked) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-ink-50 py-10">
      <div className="container-app">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">My bookings</h1>
            <p className="mt-1 text-ink-500">Your upcoming and active trips.</p>
          </div>
          <Link to="/buses" className="btn-primary hidden sm:inline-flex">
            Book a trip
          </Link>
        </div>

        {showSuccess && (
          <div className="alert-success mb-6">
            <span>🎉</span>
            <div>
              <p className="font-semibold">Booking confirmed!</p>
              <p>Your e-ticket has been emailed to you.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-auto text-emerald-700/70 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {error && <div className="alert-error mb-6">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-ink-500">
              <Spinner className="h-8 w-8 text-brand-600" />
              <p className="text-sm font-medium">Loading bookings…</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="card-pad text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl">
              🎫
            </div>
            <p className="text-lg font-semibold text-ink-800">No bookings yet</p>
            <p className="mt-1 text-ink-500">When you book a trip, it will show up here.</p>
            <Link to="/buses" className="btn-primary mt-5 inline-flex">
              Find a bus
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {bookings.map((b) => (
              <div key={b.bookingId} className="card p-5 animate-fade-in-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge-brand">Trip</span>
                    <span className="badge-gray">#{b.bookingId.slice(0, 8)}</span>
                  </div>
                  <span className="text-sm font-semibold text-ink-700">
                    {b.totalSeats} seat{b.totalSeats !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-base font-bold text-ink-900">{b.origin || '—'}</p>
                    <p className="text-xs text-ink-400">From</p>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-ink-200" />
                  <span className="text-brand-500">→</span>
                  <div className="flex-1 border-t-2 border-dashed border-ink-200" />
                  <div className="text-center">
                    <p className="text-base font-bold text-ink-900">{b.destination || '—'}</p>
                    <p className="text-xs text-ink-400">To</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-500">
                  Departs · <span className="font-medium text-ink-700">{formatDate(b.estimatedDepertureTimeDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
