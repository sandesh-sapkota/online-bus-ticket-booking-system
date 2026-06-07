import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { busAPI } from '../services/api';

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'ALL',
    class: 'ALL',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await busAPI.getAllBuses();
      setBuses(response.data.data ?? []);
    } catch (err) {
      setError('Failed to load buses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredBuses = buses.filter((bus) => {
    return (
      (filters.type === 'ALL' || bus.busType === filters.type) &&
      (filters.class === 'ALL' || bus.busClass === filters.class) &&
      (filters.search === '' || 
        bus.busRegistrationNumber?.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-3xl">⏳ Loading buses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Available Buses</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search by registration..."
              value={filters.search}
              onChange={handleFilterChange}
              className="input-field"
            />
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="ALL">All Types</option>
              <option value="AC_BUS">AC Bus</option>
              <option value="NONE_AC_BUS">Non-AC Bus</option>
              <option value="SLEEPER_BUS">Sleeper Bus</option>
            </select>
            <select
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="ALL">All Classes</option>
              <option value="ECONOMY">Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRSTCLASS">First Class</option>
            </select>
            <button
              onClick={fetchBuses}
              className="btn-primary"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Bus List */}
        <div className="grid gap-6">
          {filteredBuses.length > 0 ? (
            filteredBuses.map((bus) => (
              <div key={bus.busId} className="card bg-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{bus.busRegistrationNumber}</h3>
                    <p className="text-gray-600">
                      🚌 {bus.busType?.replace('_', ' ')} • {bus.busClass}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">Fare Per Ticket</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rs. {bus.farePerTicket}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">Available Seats</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {bus.ticketsLeft ?? 'N/A'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!localStorage.getItem('isLoggedIn')) {
                        navigate('/login');
                      } else {
                        navigate(`/booking/${bus.scheduleId}`);
                      }
                    }}
                    className="btn-primary w-full"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-600">No buses found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
