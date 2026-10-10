import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sprout, LayoutDashboard, Globe, ChevronDown, Check, LogOut } from 'lucide-react';
import { useLanguage, languageNames, type Language } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
    }`;

  const langOptions: Language[] = ['en', 'hi', 'ta'];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
            <Sprout size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Farm<span className="text-green-600">Direct</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className={linkClass}>
            {t('nav.home')}
          </NavLink>
          {profile?.role !== 'delivery' && (
            <NavLink to="/marketplace" className={linkClass}>
              {t('nav.marketplace')}
            </NavLink>
          )}
          <NavLink to="/dashboard" className={linkClass}>
            {profile?.role === 'delivery' ? 'Deliveries' : t('nav.dashboard')}
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user && profile && <NotificationBell />}
          {/* Language switcher */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{languageNames[lang]}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                {langOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setLang(opt);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {languageNames[opt]}
                    {lang === opt && <Check size={15} className="text-green-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/dashboard"
            className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:flex"
          >
            <LayoutDashboard size={16} />
            {profile?.role === 'delivery' ? 'Deliveries' : t('nav.dashboard')}
          </Link>
          {user && profile ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                {profile.name}
              </span>
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
            >
              {t('nav.getStarted')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
