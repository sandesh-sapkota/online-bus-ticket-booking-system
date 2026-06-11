import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const stats = [
  { value: '500+', label: 'Buses' },
  { value: '1,000+', label: 'Routes' },
  { value: '50K+', label: 'Monthly travelers' },
];

const features = [
  { title: 'Best prices', desc: 'Transparent fares with no hidden fees.', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { title: 'Secure payments', desc: 'Your transactions are safe and encrypted.', icon: 'M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z' },
  { title: 'Instant e-tickets', desc: 'Tickets delivered straight to your inbox.', icon: 'M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z' },
  { title: 'Pick your seat', desc: 'Choose exactly where you want to sit.', icon: 'M7 4v9h10M7 13a2 2 0 0 0 2 2h8v5M5 20h2' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        <div className="container-app relative py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center text-white animate-fade-in-up">
            <span className="badge bg-white/15 text-white">Online bus ticket booking</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Your journey starts here
            </h1>
            <p className="mt-5 text-lg text-brand-100 sm:text-xl">
              Compare buses, pick your seat, and book in minutes — comfortable rides at unbeatable prices.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/buses" className="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg">
                Find buses
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn border border-white/40 text-white hover:bg-white/10 btn-lg">
                  Create account
                </Link>
              )}
            </div>

            <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-2xl font-extrabold sm:text-3xl">{s.value}</p>
                  <p className="text-sm text-brand-100">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-app py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink-900">Why travel with BusGo?</h2>
          <p className="mt-3 text-ink-500">Everything you need for a smooth booking experience.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-app pb-20">
        <div className="rounded-3xl bg-ink-900 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to travel?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-300">
            Join thousands of happy travelers booking their trips the easy way.
          </p>
          <Link to="/buses" className="btn-primary btn-lg mt-7 inline-flex">
            Book your ticket now
          </Link>
        </div>
      </section>
    </div>
  );
}
