import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentAPI, getApiError } from '../services/api';
import { Spinner } from '../components/Spinner';

// Khalti redirects here (return_url) with query params including pidx, status,
// and purchase_order_id (our bookingId). We verify server-side before showing
// success — never trust the redirect status alone.
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Confirming your payment with Khalti…');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-run in StrictMode
    ran.current = true;

    const pidx = params.get('pidx');
    const khaltiStatus = params.get('status');
    const bookingId = params.get('purchase_order_id') || sessionStorage.getItem('pendingBookingId');

    const finish = () => sessionStorage.removeItem('pendingBookingId');

    if (khaltiStatus === 'User canceled') {
      setState('failed');
      setMessage('Payment was canceled. Your seats were not confirmed.');
      finish();
      return;
    }

    if (!pidx || !bookingId) {
      setState('failed');
      setMessage('Missing payment reference. Please try booking again.');
      finish();
      return;
    }

    (async () => {
      try {
        await paymentAPI.verifyKhalti({ bookingId, pidx });
        setState('success');
        setMessage('Payment confirmed! Your e-ticket is on its way to your email.');
        finish();
        setTimeout(() => navigate('/bookings', { replace: true, state: { justBooked: true } }), 1500);
      } catch (err) {
        setState('failed');
        setMessage(getApiError(err, 'We could not verify your payment.'));
        finish();
      }
    })();
  }, [params, navigate]);

  return (
    <div className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="card-pad w-full max-w-md text-center animate-fade-in-up">
        {state === 'verifying' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
              <Spinner className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-fg">Verifying payment</h1>
            <p className="mt-2 text-muted">{message}</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl">
              ✓
            </div>
            <h1 className="text-xl font-bold text-fg">Payment successful</h1>
            <p className="mt-2 text-muted">{message}</p>
            <Link to="/bookings" className="btn-primary mt-6 inline-flex">
              View my bookings
            </Link>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-2xl">
              ✕
            </div>
            <h1 className="text-xl font-bold text-fg">Payment not completed</h1>
            <p className="mt-2 text-muted">{message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/buses" className="btn-secondary">
                Back to buses
              </Link>
              <Link to="/bookings" className="btn-primary">
                My bookings
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
