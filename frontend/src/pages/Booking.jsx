import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { busAPI, bookingAPI, paymentAPI, getApiError } from '../services/api';
import { Spinner, PageLoader } from '../components/Spinner';

const BUS_TYPE_LABELS = {
  AC_BUS: 'AC',
  NONE_AC_BUS: 'Non-AC',
  SLEEPER_BUS: 'Sleeper',
};
const CLASS_LABELS = {
  ECONOMY: 'Economy',
  BUSINESS: 'Business',
  FIRSTCLASS: 'First Class',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// The backend stores each booking's seats as an array of [seatNumber, label] pairs,
// and returns bookedSeats as an array of those arrays. Walk it defensively and
// collect every numeric seat number that is already taken.
function extractTakenSeats(bookedSeats) {
  const taken = new Set();
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    const isPair =
      node.length === 2 &&
      !Array.isArray(node[0]) &&
      (typeof node[0] === 'string' || typeof node[0] === 'number') &&
      !Number.isNaN(Number(node[0]));
    if (isPair) {
      taken.add(Number(node[0]));
    } else {
      node.forEach(walk);
    }
  };
  walk(bookedSeats);
  return taken;
}

function parseSeatNumbers(seats) {
  if (!seats) return [];
  const obj = typeof seats === 'string' ? JSON.parse(seats) : seats;
  return Object.keys(obj)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

const STEPS = ['Trip', 'Seats', 'Payment'];

export default function Booking() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const [bus, setBus] = useState(null);
  const [journeyDate, setJourneyDate] = useState(todayStr());
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchBus = useCallback(
    async (date) => {
      if (!scheduleId) {
        setError('Missing schedule identifier.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await busAPI.getBus(scheduleId, date);
        setBus(res?.data?.data ?? null);
        setSelectedSeats([]);
      } catch (err) {
        setError(getApiError(err, 'Failed to load bus details.'));
        setBus(null);
      } finally {
        setLoading(false);
      }
    },
    [scheduleId],
  );

  useEffect(() => {
    fetchBus(journeyDate);
  }, [fetchBus, journeyDate]);

  const seatNumbers = useMemo(() => parseSeatNumbers(bus?.seats), [bus]);
  const takenSeats = useMemo(() => extractTakenSeats(bus?.bookedSeats), [bus]);
  const farePerTicket = bus?.farePerTicket ?? 0;
  const totalPrice = selectedSeats.length * farePerTicket;

  const toggleSeat = (seat) => {
    if (takenSeats.has(seat)) return;
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat].sort((a, b) => a - b),
    );
  };

  const handleConfirmAndPay = async () => {
    setError('');
    if (!journeyDate) return setError('Please choose a journey date.');
    if (selectedSeats.length === 0) return setError('Please select at least one seat.');

    setSubmitting(true);
    try {
      const bookingRes = await bookingAPI.createBooking({
        scheduleId,
        journeyDate,
        seats: selectedSeats,
      });
      const bookingId = bookingRes?.data?.data?.bookingId;
      if (!bookingId) throw new Error('Booking did not return an id.');

      await paymentAPI.processPayment(bookingId, {
        method: paymentMethod,
        amount: totalPrice,
        referenceCode: crypto.randomUUID(),
      });

      navigate('/bookings', { replace: true, state: { justBooked: true } });
    } catch (err) {
      setError(getApiError(err, 'Booking could not be completed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !bus) {
    return <PageLoader label="Loading bus details…" />;
  }

  if (!bus) {
    return (
      <div className="container-app py-16">
        <div className="card-pad mx-auto max-w-lg text-center">
          <p className="text-lg font-semibold text-fg">Bus unavailable</p>
          <p className="mt-1 text-muted">{error || 'We could not load this bus.'}</p>
          <button onClick={() => navigate('/buses')} className="btn-primary mt-5">
            Back to buses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas py-10">
      <div className="container-app max-w-4xl">
        <button onClick={() => navigate('/buses')} className="btn-ghost mb-4 -ml-2">
          ← All buses
        </button>

        <h1 className="text-3xl font-extrabold tracking-tight text-fg">Book your trip</h1>
        <p className="mt-1 text-muted">
          {bus.route?.origin && bus.route?.destination
            ? `${bus.route.origin} → ${bus.route.destination}`
            : 'Select your date and seats to continue.'}
        </p>

        {/* Stepper */}
        <div className="my-6 flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                    i <= step ? 'bg-accent text-accent-fg' : 'bg-surface2 text-faint'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`text-sm font-medium ${i <= step ? 'text-fg' : 'text-faint'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-0.5 flex-1 ${i < step ? 'bg-accent' : 'bg-line'}`} />
              )}
            </div>
          ))}
        </div>

        {error && <div className="alert-error mb-6">{error}</div>}

        <div className="card-pad">
          {/* Step 1: Trip + date */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-fg">Trip details</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Detail label="Type" value={BUS_TYPE_LABELS[bus.busType] ?? bus.busType} />
                <Detail label="Class" value={CLASS_LABELS[bus.busClass] ?? bus.busClass} />
                <Detail label="Reg. No." value={bus.busRegistrationNumber} />
                <Detail label="Fare / seat" value={`Rs. ${farePerTicket}`} />
              </div>

              {(bus.driver?.firstName || bus.route?.distanceinKm) && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Detail
                    label="Driver"
                    value={[bus.driver?.firstName, bus.driver?.lastName].filter(Boolean).join(' ') || '—'}
                  />
                  <Detail label="Distance" value={bus.route?.distanceinKm ? `${bus.route.distanceinKm} km` : '—'} />
                  <Detail
                    label="Est. time"
                    value={bus.route?.estimatedTimeInMIn ? `${bus.route.estimatedTimeInMIn} min` : '—'}
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="journeyDate">
                  Journey date
                </label>
                <input
                  id="journeyDate"
                  type="date"
                  min={todayStr()}
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="input-field max-w-xs"
                />
                <p className="mt-2 text-xs text-faint">Seat availability is shown for the selected date.</p>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(1)} disabled={!journeyDate} className="btn-primary btn-lg">
                  Choose seats →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Seats */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-fg">Select seats</h2>
                {loading && <Spinner className="h-5 w-5 text-accent" />}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm text-muted">
                <Legend className="bg-surface border border-line2" label="Available" />
                <Legend className="bg-accent" label="Selected" />
                <Legend className="bg-surface2" label="Booked" />
              </div>

              {seatNumbers.length === 0 ? (
                <p className="text-muted">No seat map available for this bus.</p>
              ) : (
                <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-8">
                  {seatNumbers.map((seat) => {
                    const isTaken = takenSeats.has(seat);
                    const isSelected = selectedSeats.includes(seat);
                    return (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        disabled={isTaken}
                        className={`aspect-square rounded-lg text-sm font-semibold transition ${
                          isTaken
                            ? 'cursor-not-allowed bg-surface2 text-faint'
                            : isSelected
                              ? 'bg-accent text-accent-fg shadow-sm'
                              : 'border border-line2 bg-surface text-fg hover:border-accent hover:bg-accent-soft'
                        }`}
                      >
                        {seat}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2 rounded-xl bg-surface2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  {selectedSeats.length > 0 ? (
                    <>
                      Seats <span className="font-semibold text-fg">{selectedSeats.join(', ')}</span>
                    </>
                  ) : (
                    'No seats selected yet.'
                  )}
                </p>
                <p className="text-lg font-bold text-fg">Total: Rs. {totalPrice}</p>
              </div>

              <div className="flex justify-between gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">
                  ← Back
                </button>
                <button onClick={() => setStep(2)} disabled={selectedSeats.length === 0} className="btn-primary">
                  Continue to payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-fg">Review & pay</h2>

              <div className="space-y-3 rounded-xl border border-line bg-surface2 p-5">
                <Row
                  label="Route"
                  value={
                    bus.route?.origin && bus.route?.destination
                      ? `${bus.route.origin} → ${bus.route.destination}`
                      : '—'
                  }
                />
                <Row label="Date" value={journeyDate} />
                <Row label="Seats" value={selectedSeats.join(', ')} />
                <Row label="Passengers" value={`${selectedSeats.length}`} />
                <div className="border-t border-line2 pt-3">
                  <Row label="Total amount" value={`Rs. ${totalPrice}`} valueClass="text-xl font-extrabold text-accent" />
                </div>
              </div>

              <div>
                <p className="label">Payment method</p>
                <div className="grid grid-cols-2 gap-3">
                  {['ONLINE', 'CASH'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-xl border p-4 text-left transition ${
                        paymentMethod === m
                          ? 'border-accent bg-accent-soft ring-2 ring-accent/20'
                          : 'border-line hover:border-line2'
                      }`}
                    >
                      <p className="font-semibold text-fg">{m === 'ONLINE' ? 'Online' : 'Cash'}</p>
                      <p className="text-xs text-muted">{m === 'ONLINE' ? 'Pay securely now' : 'Pay at the counter'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <button onClick={() => setStep(1)} disabled={submitting} className="btn-secondary">
                  ← Back
                </button>
                <button onClick={handleConfirmAndPay} disabled={submitting} className="btn-primary btn-lg">
                  {submitting ? <Spinner className="h-5 w-5 text-accent-fg" /> : `Pay Rs. ${totalPrice}`}
                </button>
              </div>
              <p className="text-center text-xs text-faint">
                Your e-ticket will be emailed to you after a successful payment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-0.5 font-semibold text-fg">{value ?? '—'}</p>
    </div>
  );
}

function Row({ label, value, valueClass = 'font-semibold text-fg' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className={valueClass}>{value || '—'}</span>
    </div>
  );
}

function Legend({ className, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-4 w-4 rounded ${className}`} />
      {label}
    </span>
  );
}
