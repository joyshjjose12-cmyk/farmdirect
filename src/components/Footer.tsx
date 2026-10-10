import { Link } from 'react-router-dom';
import { Sprout, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
                <Sprout size={18} />
              </span>
              <span className="text-base font-bold text-gray-900">
                Farm<span className="text-green-600">Direct</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
              A decentralized farmer-to-consumer marketplace that connects growers
              directly with buyers. Fair prices for farmers, fresh produce for everyone.
            </p>
            <div className="mt-5 flex gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-green-200 hover:text-green-700"
                  aria-label="Social link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Platform</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-500">
              <li><Link to="/marketplace" className="hover:text-green-700">Marketplace</Link></li>
              <li><a href="#" className="hover:text-green-700">For Farmers</a></li>
              <li><a href="#" className="hover:text-green-700">For Buyers</a></li>
              <li><a href="#" className="hover:text-green-700">How It Works</a></li>
              <li><Link to="/auth?role=delivery&mode=login" className="hover:text-green-700">Delivery partner login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-green-700">About</a></li>
              <li><a href="#" className="hover:text-green-700">Sustainability</a></li>
              <li><a href="#" className="hover:text-green-700">Contact</a></li>
              <li><a href="#" className="hover:text-green-700">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            © 2026 FarmDirect. Built for a fairer food system.
          </p>
          <p className="text-xs text-gray-400">
            Demo app — all listings are mock data.
          </p>
        </div>
      </div>
    </footer>
  );
}
