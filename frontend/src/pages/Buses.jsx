import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { busAPI, getApiError } from '../services/api';
import { Spinner } from '../components/Spinner';

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

const formatDeparture = (value) => {
  if (!value) return 'Schedule TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Schedule TBA';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const emptyFilters = { origin: '', destination: '', busType: '', class: '' };

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const navigate = useNavigate();

  const fetchBuses = useCallback(async (activeFilters = emptyFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      // The backend only filters by route when BOTH origin and destination are set.
      if (activeFilters.origin.trim() && activeFilters.destination.trim()) {
        params.origin = activeFilters.origin.trim();
        params.destination = activeFilters.destination.trim();
      }
      if (activeFilters.busType) params.busType = activeFilters.busType;
      if (activeFilters.class) params.class = activeFilters.class;

      const res = await busAPI.getAllBuses(params);
      setBuses(res?.data?.data ?? []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load buses.'));
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the available routes once so the From/To selects only offer real options.
  useEffect(() => {
    (async () => {
      try {
        const res = await busAPI.getRoutes();
        setRoutes(res?.data?.data ?? []);
      } catch {
        // Non-fatal: the page still works with free filtering disabled.
        setRoutes([]);
      }
    })();
    fetchBuses();
  }, [fetchBuses]);

  // Distinct origins, and destinations valid for the chosen origin.
  const origins = useMemo(
    () => [...new Set(routes.map((r) => r.origin))].sort(),
    [routes],
  );
  const destinations = useMemo(() => {
    const pool = filters.origin ? routes.filter((r) => r.origin === filters.origin) : routes;
    return [...new Set(pool.map((r) => r.destination))].sort();
  }, [routes, filters.origin]);

  const handleOriginChange = (e) => {
    const origin = e.target.value;
    setFilters((f) => {
      // Reset destination if it's no longer valid for the new origin.
      const stillValid =
        !f.destination ||
        routes.some((r) => r.origin === origin && r.destination === f.destination);
      return { ...f, origin, destination: stillValid ? f.destination : '' };
    });
  };

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBuses(filters);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    fetchBuses(emptyFilters);
  };

  const applyRoute = (route) => {
    const next = { ...filters, origin: route.origin, destination: route.destination };
    setFilters(next);
    fetchBuses(next);
  };

  const goToBooking = (scheduleId) => {
    if (!scheduleId) return;
    navigate(`/booking/${scheduleId}`);
  };

  return (
    <div className="bg-canvas py-10">
      <div className="container-app">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-fg">Find your bus</h1>
          <p className="mt-1 text-muted">Search routes and pick a seat that suits your journey.</p>
        </div>

        {/* Popular routes */}
        {routes.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Available routes</p>
            <div className="flex flex-wrap gap-2">
              {routes.slice(0, 8).map((r) => (
                <button
                  key={r.routeId}
                  type="button"
                  onClick={() => applyRoute(r)}
                  className="badge-brand hover:opacity-80"
                >
                  {r.origin} → {r.destination}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search & filters */}
        <form onSubmit={handleSearch} className="card-pad mb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label" htmlFor="origin">
                From
              </label>
              <select
                id="origin"
                name="origin"
                value={filters.origin}
                onChange={handleOriginChange}
                className="input-field"
              >
                <option value="">Any origin</option>
                {origins.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="destination">
                To
              </label>
              <select
                id="destination"
                name="destination"
                value={filters.destination}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Any destination</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="busType">
                Bus type
              </label>
              <select id="busType" name="busType" value={filters.busType} onChange={handleChange} className="input-field">
                <option value="">All types</option>
                <option value="AC_BUS">AC</option>
                <option value="NONE_AC_BUS">Non-AC</option>
                <option value="SLEEPER_BUS">Sleeper</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="class">
                Class
              </label>
              <select id="class" name="class" value={filters.class} onChange={handleChange} className="input-field">
                <option value="">All classes</option>
                <option value="ECONOMY">Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRSTCLASS">First Class</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">
              Search buses
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary">
              Reset
            </button>
            <p className="self-center text-xs text-faint">Pick both From and To to filter by route.</p>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-muted">
              <Spinner className="h-8 w-8 text-accent" />
              <p className="text-sm font-medium">Loading buses…</p>
            </div>
          </div>
        ) : error ? (
          <div className="card-pad text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-2xl">
              ⚠️
            </div>
            <p className="text-lg font-semibold text-fg">Couldn’t reach the server</p>
            <p className="mt-1 text-muted">{error}</p>
            <button onClick={() => fetchBuses(filters)} className="btn-primary mt-5">
              Try again
            </button>
          </div>
        ) : buses.length === 0 ? (
          <div className="card-pad text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-2xl">
              🚌
            </div>
            <p className="text-lg font-semibold text-fg">No buses found</p>
            <p className="mt-1 text-muted">Try a different route or clear the filters.</p>
            <button onClick={handleReset} className="btn-secondary mt-5">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              {buses.length} bus{buses.length !== 1 ? 'es' : ''} available
            </p>
            {buses.map((bus, idx) => {
              const soldOut = (bus.ticketsLeft ?? 0) <= 0;
              return (
                <div
                  key={bus.scheduleId || bus.busId || idx}
                  className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-softfg">
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="13" rx="2" />
                        <path d="M3 10h18" strokeLinecap="round" />
                        <circle cx="7.5" cy="20" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="16.5" cy="20" r="1.5" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge-brand">{BUS_TYPE_LABELS[bus.busType] ?? bus.busType ?? 'Bus'}</span>
                        <span className="badge-gray">{CLASS_LABELS[bus.busClass] ?? bus.busClass ?? '—'}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted">Departs · {formatDeparture(bus.estimatedDepurtureTimeDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-faint">Seats left</p>
                      <p className={`text-lg font-bold ${soldOut ? 'text-danger' : 'text-success'}`}>
                        {soldOut ? 'Sold out' : bus.ticketsLeft}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-faint">Fare</p>
                      <p className="text-lg font-bold text-fg">Rs. {bus.farePerTicket ?? '—'}</p>
                    </div>
                    <button
                      onClick={() => goToBooking(bus.scheduleId)}
                      disabled={soldOut || !bus.scheduleId}
                      className="btn-primary"
                    >
                      {soldOut ? 'Unavailable' : 'Book now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
