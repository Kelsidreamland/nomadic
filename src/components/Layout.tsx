import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Shirt, Sparkles, Coffee, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { APP_VERSION } from '../services/appVersion';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useStore();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const toggleLanguage = () => {
    setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW');
  };

  const navItems = [
    { name: t('app.overview'), path: '/overview', icon: ClipboardList },
    { name: t('app.items'), path: '/items', icon: Shirt },
    { name: t('app.outfits'), path: '/outfits', icon: Sparkles },
    { name: t('app.luggages'), path: '/luggages', icon: Briefcase },
  ];

  return (
    <div className="flex flex-col h-screen bg-[var(--color-brand-sand)] text-[var(--color-brand-espresso)] font-sans">
      <header className="bg-[var(--color-brand-cream)]/80 backdrop-blur-md px-6 py-4 shadow-sm z-20 flex justify-between items-center sticky top-0 border-b border-[var(--color-brand-stone)]">
        <h1 className="text-2xl font-black text-[var(--color-brand-espresso)] flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/favicon.svg"
              alt="Nomadic"
              className="w-10 h-10 rounded-xl transform transition-transform group-hover:scale-105 shadow-md shadow-[var(--color-brand-terracotta)]/20"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl tracking-tight text-[var(--color-brand-espresso)] leading-none">Nomadic</span>
              <span className="text-[10px] text-[var(--color-brand-olive)] uppercase font-semibold leading-none mt-1">my luggage</span>
            </div>
          </Link>
        </h1>

        {/* Desktop Nav */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <span className="rounded-full border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-2 py-1 text-[10px] font-bold text-[var(--color-brand-espresso)]/55">
            v{APP_VERSION}
          </span>
          <button
            onClick={toggleLanguage}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/80 hover:bg-[var(--color-brand-sand)] transition-colors font-sans"
          >
            {language === 'zh-TW' ? 'EN' : '繁中'}
          </button>
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center space-x-2 text-sm font-semibold transition-colors font-sans',
                  location.pathname === item.path ? 'text-[var(--color-brand-espresso)] border-b-2 border-[var(--color-brand-espresso)]' : 'text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80'
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <a
            href="https://api.payuni.com.tw/api/uop/receive_info/2/3/NPPA226028039/mgYrU0DqoPbb6vatwL86Z"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-2 rounded-full border border-[var(--color-brand-terracotta)]/20 bg-[var(--color-brand-terracotta)]/10 px-4 py-2 text-sm font-bold text-[var(--color-brand-espresso)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--color-brand-terracotta)]/15 font-sans"
          >
            <Coffee size={16} />
            <span>Sponsor / VIP</span>
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full h-full pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[var(--color-brand-cream)]/90 backdrop-blur-lg border-t border-[var(--color-brand-stone)] pb-safe z-50">
        <div className="flex justify-around items-center h-[72px]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ease-in-out font-sans',
                location.pathname === item.path ? 'text-[var(--color-brand-espresso)] -translate-y-1' : 'text-[var(--color-brand-espresso)]/40'
              )}
            >
              <div className={clsx("p-2 rounded-xl", location.pathname === item.path ? 'bg-[var(--color-brand-sand)]/80 shadow-inner border border-[var(--color-brand-stone)]/50' : '')}>
                <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold uppercase">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
