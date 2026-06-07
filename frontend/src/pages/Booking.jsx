import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { busAPI, bookingAPI, paymentAPI } from '../services/api';

export default function Booking() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [journeyDate, setJourneyDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusDetails();
  }, [scheduleId]);

  useEffect(() => {
    if (journeyDate) {
      fetchBusDetails(journeyDate);
    }
  }, [journeyDate, scheduleId]);

  const fetchBusDetails = async (date = new Date().toISOString().slice(0, 10)) => {
    if (!scheduleId) {
      setError('Missing schedule identifier for booking.');
      setLoading(false);
      return;
    }

    try {
      const response = await busAPI.getBus(scheduleId, date);
      setBus(response.data.data);
    } catch (err) {
      setError('Failed to load bus details');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seatNumber) => {
    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const seatNumbers = bus?.seats
    ? Object.keys(
        typeof bus.seats === 'string' ? JSON.parse(bus.seats) : bus.seats,
      )
        .map(Number)
        .sort((a, b) => a - b)
    : [...Array(20).keys()].map((_, i) => i + 1);

  const totalPrice = selectedSeats.length * (bus?.farePerTicket || 0);

  const handleBooking = async () => {
    if (!journeyDate || selectedSeats.length === 0) {
      setError('Please select date and seats');
      return;
    }

    if (!scheduleId) {
      setError('Booking identifier is missing.');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        scheduleId,
        journeyDate,
        seats: selectedSeats,
      };

      const bookingRes = await bookingAPI.createBooking(bookingData);
      const bookingId = bookingRes.data.data?.bookingId;

      if (!bookingId) {
        throw new Error('Booking did not return a booking id.');
      }

      const paymentRes = await paymentAPI.processPayment(bookingId, {
        method: paymentMethod,
        amount: totalPrice,
        referenceCode: crypto.randomUUID(),
      });

      alert('Booking confirmed! Check your email for ticket.');
      navigate('/bookings');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!bus) {
    return <div className="flex justify-center items-center min-h-screen">Bus not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Book Your Tickets</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(step => (
            <button
              key={step}
              onClick={() => setBookingStep(step)}
              className={`p-4 rounded-lg font-bold text-center ${
                bookingStep === step
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              Step {step}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Bus Info */}
          {bookingStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Bus Details</h2>
              <div className="space-y-4">
                <p><strong>Registration:</strong> {bus.busRegistrationNumber}</p>
                <p><strong>Type:</strong> {bus.busType}</p>
                <p><strong>Class:</strong> {bus.busClass}</p>
                <p><strong>Fare Per Ticket:</strong> Rs. {bus.farePerTicket}</p>
              </div>
              <button
                onClick={() => setBookingStep(2)}
                className="mt-8 btn-primary"
              >
                Next: Select Seats →
              </button>
            </div>
          )}

          {/* Step 2: Seat Selection */}
          {bookingStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Select Seats & Date</h2>
              <div className="mb-6">
                <label className="block font-bold mb-2">Journey Date</label>
                <input
                  type="date"
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="mb-6">
                <p className="font-bold mb-4">Available Seats</p>
                <div className="grid grid-cols-6 gap-2">
                  {seatNumbers.map((seatNumber) => (
                    <button
                      key={seatNumber}
                      onClick={() => handleSeatSelect(seatNumber)}
                      className={`p-3 rounded font-bold transition ${
                        selectedSeats.includes(seatNumber)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {seatNumber}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-lg font-bold mb-4">
                Selected: {selectedSeats.length} seats | Total: Rs. {totalPrice}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setBookingStep(1)}
                  className="btn-secondary flex-1"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setBookingStep(3)}
                  className="btn-primary flex-1"
                >
                  Next: Payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {bookingStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Payment</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p className="text-lg mb-2">
                  <strong>Seats:</strong> {selectedSeats.join(', ')}
                </p>
                <p className="text-lg mb-2">
                  <strong>Date:</strong> {journeyDate}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  Total: Rs. {totalPrice}
                </p>
              </div>

              <div className="mb-6">
                <p className="font-bold mb-3">Payment Method</p>
                <div className="space-y-3">
                  {['ONLINE', 'CASH'].map(method => (
                    <label key={method} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-bold">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setBookingStep(2)}
                  className="btn-secondary flex-1"
                >
                  ← Back
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Booking ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
