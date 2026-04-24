import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Shirt, Sparkles, Globe, Coffee, PlaneTakeoff } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';

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
    { name: t('app.luggages'), path: '/luggages', icon: Briefcase },
    { name: t('app.items'), path: '/items', icon: Shirt },
    { name: t('app.outfits'), path: '/outfits', icon: Sparkles },
    { name: t('app.dashboard'), path: '/', icon: PlaneTakeoff },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#FDFBF7] text-[#4A4A4A] font-sans">
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm z-20 flex justify-between items-center sticky top-0">
        <h1 className="text-2xl font-black tracking-widest text-[#2C3E50] uppercase flex items-center gap-2">
          NOMADIC
          <button 
            onClick={toggleLanguage}
            className="ml-4 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
          >
            <Globe size={14} />
            <span>{language === 'zh-TW' ? 'EN' : '繁中'}</span>
          </button>
        </h1>
        
        {/* Desktop Nav */}
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center space-x-2 text-sm font-semibold tracking-wider transition-colors',
                  location.pathname === item.path ? 'text-[#2C3E50] border-b-2 border-[#2C3E50]' : 'text-gray-400 hover:text-gray-600'
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
            className="hidden md:flex items-center space-x-2 bg-[#FFDD00] text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
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
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe z-50">
        <div className="flex justify-around items-center h-[72px]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ease-in-out',
                location.pathname === item.path ? 'text-[#2C3E50] -translate-y-1' : 'text-gray-400'
              )}
            >
              <div className={clsx("p-2 rounded-xl", location.pathname === item.path ? 'bg-gray-100/80 shadow-inner' : '')}>
                <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
