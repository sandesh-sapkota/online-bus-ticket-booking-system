import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../services/api';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('isLoggedIn'),
  );
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('isLoggedIn'));
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await userAPI.logout();
    } catch (error) {
      console.warn('Logout request failed', error);
    }
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-green-600">🚌</div>
          <Link to="/" className="text-2xl font-bold text-gray-800">
            BusTicket
          </Link>
        </div>

        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-green-600 transition">
            Home
          </Link>
          <Link to="/buses" className="text-gray-700 hover:text-green-600 transition">
            Buses
          </Link>
          <Link to="/bookings" className="text-gray-700 hover:text-green-600 transition">
            My Bookings
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="px-4 py-2 text-gray-700 border border-green-600 rounded-lg hover:bg-green-50"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:border-green-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
