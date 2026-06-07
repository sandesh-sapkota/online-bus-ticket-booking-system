import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center text-white space-y-6">
          <h1 className="text-6xl font-bold leading-tight">
            Your Journey Starts Here
          </h1>
          <p className="text-2xl text-gray-300">
            Book comfortable buses at unbeatable prices
          </p>
          <Link
            to="/buses"
            className="inline-block mt-8 px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 transition transform hover:scale-105"
          >
            Search Buses Now →
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            { icon: '🚌', title: '500+ Buses', desc: 'Multiple operators' },
            { icon: '🌍', title: '1000+ Routes', desc: 'Across the country' },
            { icon: '✈️', title: '50K+ Happy', desc: 'Travelers per month' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white text-center hover:bg-opacity-20 transition">
              <div className="text-5xl mb-4">{stat.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{stat.title}</h3>
              <p className="text-gray-300">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-24 bg-white rounded-lg p-12">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { emoji: '💰', title: 'Best Prices', desc: 'Guaranteed lowest fares' },
              { emoji: '🔒', title: 'Secure Payment', desc: 'Safe & encrypted' },
              { emoji: '🎫', title: 'E-Tickets', desc: 'Digital tickets via email' },
              { emoji: '⭐', title: 'Top Rated', desc: '4.8/5 customer rating' },
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-green-600 rounded-lg p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Travel?</h2>
          <p className="text-xl mb-8 text-green-100">
            Join thousands of happy travelers
          </p>
          <Link
            to="/buses"
            className="inline-block px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition"
          >
            Book Your Ticket Now
          </Link>
        </div>
      </section>
    </div>
  );
}
