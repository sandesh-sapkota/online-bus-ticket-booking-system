import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Buses from './pages/Buses';
import Booking from './pages/Booking';
import Bookings from './pages/Bookings';
import './App.css';

function App() {

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/buses" element={<Buses />} />
        <Route path="/booking/:scheduleId" element={<Booking />} />
        <Route path="/bookings" element={<Bookings />} />
      </Routes>
    </Router>
  )
}

export default App
