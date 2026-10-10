import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bike, Sprout, User as UserIcon } from 'lucide-react';
import { homeFor, useAuth, type UserRole } from '@/context/AuthContext';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const modeParam = searchParams.get('mode');
  const [mode, setMode] = useState<Mode>(modeParam === 'login' ? 'login' : 'signup');
  const [role, setRole] = useState<UserRole>(
    roleParam === 'buyer' ? 'buyer' : roleParam === 'delivery' ? 'delivery' : 'farmer',
  );
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { user, profile, signUp, signIn } = useAuth();
  const navigate = useNavigate();

  // Already logged in -> skip the form and go to the right place
  useEffect(() => {
    if (user && profile) {
      navigate(homeFor(profile.role), { replace: true });
    }
  }, [user, profile, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result =
      mode === 'signup'
        ? await signUp({ email, password, name, role, farmName, phone })
        : await signIn({ email, password });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Login: the profile's real role decides (handled by the effect above).
    // Signup: go by the role picked in the form.
    if (mode === 'signup') navigate(homeFor(role));
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
          <Sprout size={24} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {mode === 'signup'
            ? 'Join FarmDirect as a farmer, a buyer or a delivery partner.'
            : role === 'delivery'
              ? 'Log in to the FarmDirect delivery partner portal.'
              : `Log in to your FarmDirect ${role} account.`}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="flex gap-2 rounded-xl bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
                role === 'farmer' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Sprout size={15} /> Farmer
            </button>
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
                role === 'buyer' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              <UserIcon size={15} /> Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole('delivery')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
                role === 'delivery' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Bike size={15} /> Delivery
            </button>
          </div>

        {mode === 'signup' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Ravi Kumar"
            />
          </div>
        )}

        {mode === 'signup' && role === 'farmer' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Farm name</label>
            <input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Green Valley Farm"
            />
          </div>
        )}

        {mode === 'signup' && role === 'delivery' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="+91 98765 43210"
            />
            <p className="mt-1 text-xs text-gray-400">Farmers and buyers use this to reach you.</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => {
            setMode(mode === 'signup' ? 'login' : 'signup');
            setError(null);
          }}
          className="font-semibold text-green-700 hover:underline"
        >
          {mode === 'signup' ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}