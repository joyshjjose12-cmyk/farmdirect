import { Link } from 'react-router-dom';
import {
  Sprout,
  ShoppingBasket,
  ArrowRight,
  Search,
  Handshake,
  Truck,
  ShieldCheck,
  Leaf,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
              <Leaf size={13} /> Direct from farm to table
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Buy fresh produce{' '}
              <span className="text-green-600">straight from the farm.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">
              FarmDirect connects you with local growers, cutting out the
              middlemen. Fairer prices for farmers, fresher food for you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth?role=farmer&mode=login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
              >
                <Sprout size={20} />
                I'm a Farmer
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                to="/auth?role=buyer&mode=login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-800 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <ShoppingBasket size={20} />
                I'm a Buyer
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {[
                { label: 'Active farmers', value: '2,400+' },
                { label: 'Listings live', value: '8,100' },
                { label: 'Avg. distance', value: '8.2 km' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gray-200/50">
              <img
                src="https://images.pexels.com/photos/32140362/pexels-photo-32140362.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Farmers working in a lush green field"
                className="h-[420px] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-100 sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Verified farms</p>
                  <p className="text-xs text-gray-400">Quality you can trust</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Three simple steps from field to doorstep. No warehouses, no
              wholesalers, no markup.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Search,
                step: '01',
                title: 'Discover listings',
                desc: 'Browse crops by type, distance, price, and quality rating. See exactly which farm your food comes from.',
                color: 'green',
              },
              {
                icon: Handshake,
                step: '02',
                title: 'Place a bid',
                desc: 'Make an offer or accept the listed price. Farmers review bids in real time and accept the ones that work.',
                color: 'amber',
              },
              {
                icon: Truck,
                step: '03',
                title: 'Get it delivered',
                desc: 'Once accepted, the farmer harvests and ships directly. Track every stage until it reaches your door.',
                color: 'green',
              },
            ].map((item) => {
              const Icon = item.icon;
              const accent =
                item.color === 'green'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-amber-50 text-amber-600';
              return (
                <div
                  key={item.step}
                  className="group relative rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="absolute right-6 top-6 text-4xl font-bold text-gray-100 transition-colors group-hover:text-green-100">
                    {item.step}
                  </span>
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}
                  >
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-br from-green-700 to-green-800 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to join the fair food movement?
            </h2>
            <p className="mt-2 text-green-100">
              Browse the marketplace and connect with a farmer today.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-green-700 shadow-lg transition-all hover:bg-gray-50"
          >
            Explore Marketplace
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}