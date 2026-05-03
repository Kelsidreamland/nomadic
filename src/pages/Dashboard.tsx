import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Flight } from '../db';
import { getGeoIpLocation } from '../services/google';
import { Plane, Plus, Save, X, FileText, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Onboarding } from '../components/Onboarding';

export const Dashboard = () => {
  const { t } = useTranslation();
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const flights = useLiveQuery(() => db.flights.toArray()) || [];

  const [isFirstTimeUser, setIsFirstTimeUser] = useState(() => {
    return localStorage.getItem('nomadic_onboarded') !== 'true';
  });

  const [location, setLocation] = useState('Global');
  const [now] = useState(() => Date.now());

  const [showFlightForm, setShowFlightForm] = useState(false);
  const [flightData, setFlightData] = useState<Partial<Flight>>({
    airline: '',
    destination: '',
    departureDate: '',
    checkedAllowance: 20,
    carryOnAllowance: 7,
    personalAllowance: 0
  });

  const upcomingFlight = flights.sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];

  const handleManualAdd = () => {
    if (upcomingFlight) {
      setFlightData(upcomingFlight);
    } else {
      setFlightData({
        airline: '',
        destination: '',
        departureDate: new Date().toISOString().split('T')[0],
        checkedAllowance: 20,
        carryOnAllowance: 7,
        personalAllowance: 0
      });
    }
    setShowFlightForm(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSaveFlight = async () => {
    if (!flightData.destination || !flightData.departureDate) return;
    if (upcomingFlight) {
      await db.flights.update(upcomingFlight.id, flightData);
    } else {
      await db.flights.add({
        ...flightData,
        id: crypto.randomUUID()
      } as Flight);
    }
    setShowFlightForm(false);
  };

  const handleItineraryFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    alert(t('dashboard.uploadComingSoon', { fileName: file.name }));
  };

  const checkedWeight = luggages.filter(l => l.type === '托运').reduce((sum, l) => {
    return sum + (l.weightHistory?.length > 0 ? l.weightHistory[l.weightHistory.length - 1].weight : 0);
  }, 0);

  const carryOnWeight = luggages.filter(l => l.type === '手提').reduce((sum, l) => {
    return sum + (l.weightHistory?.length > 0 ? l.weightHistory[l.weightHistory.length - 1].weight : 0);
  }, 0);

  useEffect(() => {
    getGeoIpLocation().then(loc => setLocation(loc));
  }, []);

  const daysToFlight = upcomingFlight
    ? Math.ceil((new Date(upcomingFlight.departureDate).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  if (isFirstTimeUser) {
    return (
      <Onboarding
        onComplete={() => {
          localStorage.setItem('nomadic_onboarded', 'true');
          setIsFirstTimeUser(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)] tracking-wider">{t('app.dashboard')}</h2>
          <p className="text-[var(--color-brand-espresso)]/60 font-sans font-medium mt-1">{t('dashboard.greeting')} {location}</p>
        </div>
      </div>

      {showFlightForm && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-[var(--color-brand-espresso)]">{t('dashboard.flightInfo')}</h3>
            <button onClick={() => setShowFlightForm(false)} className="text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">{t('dashboard.dest')}</label>
              <input type="text" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.destination} onChange={e => setFlightData({...flightData, destination: e.target.value})} placeholder={t('dashboard.destPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">{t('dashboard.airline')}</label>
              <input type="text" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.airline} onChange={e => setFlightData({...flightData, airline: e.target.value})} placeholder={t('dashboard.airlinePlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">{t('dashboard.date')}</label>
              <input type="date" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.departureDate} onChange={e => setFlightData({...flightData, departureDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">{t('dashboard.checkedAllowance')}</label>
              <input type="number" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.checkedAllowance} onChange={e => setFlightData({...flightData, checkedAllowance: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">{t('dashboard.carryOnAllowance')}</label>
              <input type="number" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.carryOnAllowance} onChange={e => setFlightData({...flightData, carryOnAllowance: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">{t('dashboard.personalAllowance')}</label>
              <input type="number" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.personalAllowance} onChange={e => setFlightData({...flightData, personalAllowance: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveFlight} className="flex items-center space-x-2 bg-[var(--color-brand-espresso)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-black transition-colors">
              <Save size={16} />
              <span>{t('dashboard.saveFlight')}</span>
            </button>
          </div>
        </div>
      )}

      {upcomingFlight ? (
        <div className="bg-[var(--color-brand-cream)] p-6 md:p-8 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 text-[var(--color-brand-espresso)]/5 group-hover:text-[var(--color-brand-olive)]/10 transition-colors duration-500">
            <Plane size={160} />
          </div>
          <div className="flex items-center space-x-6 z-10 w-full md:w-auto">
            <div className="w-20 h-20 bg-[var(--color-brand-sand)] text-[var(--color-brand-espresso)] rounded-3xl flex flex-col items-center justify-center font-bold border border-[var(--color-brand-stone)] shadow-sm">
              <span className="text-sm text-[var(--color-brand-espresso)]/60 mb-1">{t('dashboard.days')}</span>
              <span className="text-3xl font-serif text-[var(--color-brand-terracotta)]">{daysToFlight}</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-[var(--color-brand-espresso)] tracking-tight mb-2">{upcomingFlight.destination}</h3>
              <div className="flex items-center space-x-4 text-sm font-medium text-[var(--color-brand-espresso)]/60">
                <span className="flex items-center bg-[var(--color-brand-sand)] px-3 py-1 rounded-lg border border-[var(--color-brand-stone)]"><Plane size={14} className="mr-2 text-[var(--color-brand-olive)]" /> {upcomingFlight.airline}</span>
                <span className="flex items-center bg-[var(--color-brand-sand)] px-3 py-1 rounded-lg border border-[var(--color-brand-stone)]">{upcomingFlight.departureDate}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 z-10">
            <button
              onClick={handleManualAdd}
              className="w-full md:w-auto bg-[var(--color-brand-espresso)] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md hover:bg-black transition-all hover:-translate-y-0.5"
            >
              {t('dashboard.editFlight')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-5">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-[var(--color-brand-sand)] rounded-2xl">
              <FileText size={24} className="text-[var(--color-brand-terracotta)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-brand-espresso)]">{t('dashboard.createTripTitle')}</h3>
              <p className="text-sm text-[var(--color-brand-espresso)]/60">{t('dashboard.createTripDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleManualAdd}
              className="flex items-center justify-center space-x-2 bg-[var(--color-brand-terracotta)] hover:bg-[var(--color-brand-terracotta-hover)] text-white px-4 py-4 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg text-sm"
            >
              <Plus size={16} />
              <span>{t('dashboard.manualInput')}</span>
            </button>
            <label className="flex items-center justify-center space-x-2 bg-[var(--color-brand-sand)] hover:bg-gray-100 text-[var(--color-brand-espresso)]/80 px-4 py-4 rounded-2xl font-bold transition-all shadow-sm text-sm border border-[var(--color-brand-stone)] cursor-pointer">
              <Upload size={16} />
              <span>{t('dashboard.uploadPdfImage')}</span>
              <input type="file" accept=".pdf,image/*" onChange={handleItineraryFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {upcomingFlight && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-6">
          <h3 className="font-bold text-sm text-[var(--color-brand-espresso)]/60 uppercase tracking-wider">{t('overview.weightVsLimit')}</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-espresso)]/40 tracking-widest uppercase mb-1">{t('dashboard.checked')}</p>
                <h4 className="text-xl font-black text-[var(--color-brand-espresso)]">{checkedWeight.toFixed(1)} <span className="text-sm text-[var(--color-brand-espresso)]/40">kg</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-brand-espresso)]/40 uppercase">{t('dashboard.limit')}</p>
                <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{upcomingFlight?.checkedAllowance || 0} kg</p>
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx("h-full transition-all duration-1000", checkedWeight > (upcomingFlight?.checkedAllowance || 0) ? 'bg-red-500' : 'bg-[var(--color-brand-espresso)]')}
                style={{ width: `${Math.min(100, (checkedWeight / (upcomingFlight?.checkedAllowance || 1)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-espresso)]/40 tracking-widest uppercase mb-1">{t('dashboard.carryOn')}</p>
                <h4 className="text-xl font-black text-[var(--color-brand-espresso)]">{carryOnWeight.toFixed(1)} <span className="text-sm text-[var(--color-brand-espresso)]/40">kg</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-brand-espresso)]/40 uppercase">{t('dashboard.limit')}</p>
                <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{upcomingFlight?.carryOnAllowance || 0} kg</p>
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx("h-full transition-all duration-1000", carryOnWeight > (upcomingFlight?.carryOnAllowance || 0) ? 'bg-red-500' : 'bg-[var(--color-brand-olive)]')}
                style={{ width: `${Math.min(100, (carryOnWeight / (upcomingFlight?.carryOnAllowance || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <Link
        to="/overview"
        className="w-full py-5 bg-[var(--color-brand-espresso)] hover:bg-black text-white rounded-3xl font-bold tracking-widest shadow-lg shadow-[var(--color-brand-espresso)]/20 transition-all hover:scale-[1.02] flex justify-center items-center gap-2"
      >
        <Plane size={20} />
        <span>{t('app.overview')}</span>
      </Link>
    </div>
  );
};
