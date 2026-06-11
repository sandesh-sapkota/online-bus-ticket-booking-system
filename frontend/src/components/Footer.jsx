import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-app flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-fg">
          <span className="text-lg font-extrabold">
            Bus<span className="text-accent">Go</span>
          </span>
          <span className="text-sm text-faint">· Travel made simple</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted">
          <Link to="/buses" className="hover:text-accent">
            Find Buses
          </Link>
          <Link to="/bookings" className="hover:text-accent">
            My Bookings
          </Link>
          <span className="text-faint">© {new Date().getFullYear()} BusGo</span>
        </div>
      </div>
    </footer>
  );
}
