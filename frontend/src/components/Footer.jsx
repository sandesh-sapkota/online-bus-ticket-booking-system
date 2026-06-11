import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="container-app flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-ink-700">
          <span className="text-lg font-extrabold">
            Bus<span className="text-brand-600">Go</span>
          </span>
          <span className="text-sm text-ink-400">· Travel made simple</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-ink-500">
          <Link to="/buses" className="hover:text-brand-600">
            Find Buses
          </Link>
          <Link to="/bookings" className="hover:text-brand-600">
            My Bookings
          </Link>
          <span className="text-ink-300">© {new Date().getFullYear()} BusGo</span>
        </div>
      </div>
    </footer>
  );
}
