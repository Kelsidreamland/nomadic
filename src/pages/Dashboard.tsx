import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Flight } from '../db';
import { getGeoIpLocation } from '../services/google';
import { Plane, Plus, Save, X, FileText, Upload, Clock, MapPin, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Onboarding } from '../components/Onboarding';

const defaultFlightData = (): Partial<Flight> => ({
  airline: '',
  destination: '',
  flightNumber: '',
  departureDate: new Date().toISOString().split('T')[0],
  departureTime: '',
  arrivalTime: '',
  departureAirport: '',
  arrivalAirport: '',
  departureTerminal: '',
  arrivalTerminal: '',
  returnDepartureDate: '',
  returnDepartureTime: '',
  returnArrivalTime: '',
  returnFlightNumber: '',
  returnDepartureAirport: '',
  returnArrivalAirport: '',
  returnDepartureTerminal: '',
  returnArrivalTerminal: '',
  checkedAllowance: 20,
  carryOnAllowance: 7,
  personalAllowance: 0
});

const joinParts = (...parts: Array<string | undefined | null>) => parts.filter(Boolean).join(' · ');

const formatPlace = (place?: string, terminal?: string) => joinParts(place, terminal);

const formatRoute = (departure?: string, departureTerminal?: string, arrival?: string, arrivalTerminal?: string) => {
  const from = formatPlace(departure, departureTerminal);
  const to = formatPlace(arrival, arrivalTerminal);
  if (from && to) return `${from} → ${to}`;
  return from || to;
};

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
  const [flightData, setFlightData] = useState<Partial<Flight>>(defaultFlightData);

  const upcomingFlight = [...flights].sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];

  const handleManualAdd = () => {
    setFlightData(upcomingFlight ? { ...defaultFlightData(), ...upcomingFlight } : defaultFlightData());
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
        ...defaultFlightData(),
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

  const hasReturnInfo = !!(
    upcomingFlight?.returnDepartureDate ||
    upcomingFlight?.returnFlightNumber ||
    upcomingFlight?.returnDepartureAirport ||
    upcomingFlight?.returnArrivalAirport
  );

  const outboundTime = upcomingFlight ? joinParts(
    upcomingFlight.departureDate,
    upcomingFlight.departureTime && upcomingFlight.arrivalTime
      ? `${upcomingFlight.departureTime} - ${upcomingFlight.arrivalTime}`
      : upcomingFlight.departureTime || upcomingFlight.arrivalTime
  ) : '';

  const outboundRoute = upcomingFlight ? formatRoute(
    upcomingFlight.departureAirport,
    upcomingFlight.departureTerminal,
    upcomingFlight.arrivalAirport,
    upcomingFlight.arrivalTerminal
  ) : '';

  const returnTime = upcomingFlight ? joinParts(
    upcomingFlight.returnDepartureDate,
    upcomingFlight.returnDepartureTime && upcomingFlight.returnArrivalTime
      ? `${upcomingFlight.returnDepartureTime} - ${upcomingFlight.returnArrivalTime}`
      : upcomingFlight.returnDepartureTime || upcomingFlight.returnArrivalTime
  ) : '';

  const returnRoute = upcomingFlight ? formatRoute(
    upcomingFlight.returnDepartureAirport,
    upcomingFlight.returnDepartureTerminal,
    upcomingFlight.returnArrivalAirport,
    upcomingFlight.returnArrivalTerminal
  ) : '';

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
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)]">{t('app.dashboard')}</h2>
          <p className="mt-1 text-sm font-medium text-[var(--color-brand-espresso)]/60">{t('dashboard.greeting')} {location}</p>
        </div>
      </div>

      {showFlightForm && (
        <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('dashboard.flightInfo')}</h3>
            <button onClick={() => setShowFlightForm(false)} className="rounded-full p-2 text-[var(--color-brand-espresso)]/40 hover:bg-[var(--color-brand-sand)] hover:text-[var(--color-brand-espresso)]/80">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.dest')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.destination || ''} onChange={e => setFlightData({...flightData, destination: e.target.value})} placeholder={t('dashboard.destPlaceholder')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.airline')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.airline || ''} onChange={e => setFlightData({...flightData, airline: e.target.value})} placeholder={t('dashboard.airlinePlaceholder')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.flightNumber')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.flightNumber || ''} onChange={e => setFlightData({...flightData, flightNumber: e.target.value})} placeholder={t('dashboard.flightNumberPlaceholder')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.date')}</label>
              <input type="date" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.departureDate || ''} onChange={e => setFlightData({...flightData, departureDate: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.departureTime')}</label>
              <input type="time" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.departureTime || ''} onChange={e => setFlightData({...flightData, departureTime: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.arrivalTime')}</label>
              <input type="time" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.arrivalTime || ''} onChange={e => setFlightData({...flightData, arrivalTime: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.departureAirport')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.departureAirport || ''} onChange={e => setFlightData({...flightData, departureAirport: e.target.value})} placeholder={t('dashboard.departureAirportPlaceholder')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.arrivalAirport')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.arrivalAirport || ''} onChange={e => setFlightData({...flightData, arrivalAirport: e.target.value})} placeholder={t('dashboard.arrivalAirportPlaceholder')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.departureTerminal')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.departureTerminal || ''} onChange={e => setFlightData({...flightData, departureTerminal: e.target.value})} placeholder={t('dashboard.departureTerminalPlaceholder')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.arrivalTerminal')}</label>
              <input type="text" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.arrivalTerminal || ''} onChange={e => setFlightData({...flightData, arrivalTerminal: e.target.value})} placeholder={t('dashboard.arrivalTerminalPlaceholder')} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.checkedAllowance')}</label>
              <input type="number" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.checkedAllowance ?? 0} onChange={e => setFlightData({...flightData, checkedAllowance: Number(e.target.value)})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.carryOnAllowance')}</label>
              <input type="number" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.carryOnAllowance ?? 0} onChange={e => setFlightData({...flightData, carryOnAllowance: Number(e.target.value)})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.personalAllowance')}</label>
              <input type="number" className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.personalAllowance ?? 0} onChange={e => setFlightData({...flightData, personalAllowance: Number(e.target.value)})} />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={handleSaveFlight} className="flex items-center space-x-2 rounded-xl bg-[var(--color-brand-espresso)] px-6 py-3 font-bold text-white shadow-md transition-colors hover:bg-black">
              <Save size={16} />
              <span>{t('dashboard.saveFlight')}</span>
            </button>
          </div>
        </div>
      )}

      {upcomingFlight ? (
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 text-[var(--color-brand-espresso)]/5">
            <Plane size={150} />
          </div>
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-3xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] shadow-sm">
                <span className="text-xs font-bold text-[var(--color-brand-espresso)]/55">{t('dashboard.days')}</span>
                <span className="font-serif text-3xl font-bold text-[var(--color-brand-terracotta)]">{daysToFlight}</span>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold text-[var(--color-brand-olive)]">{joinParts(t('dashboard.outbound'), upcomingFlight.flightNumber || upcomingFlight.airline)}</p>
                <h3 className="break-words text-3xl font-black leading-tight text-[var(--color-brand-espresso)]">{upcomingFlight.destination}</h3>
                <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-[var(--color-brand-espresso)]/65">
                  <span className="inline-flex w-fit max-w-full items-center rounded-xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-3 py-1.5">
                    <Plane size={14} className="mr-2 shrink-0 text-[var(--color-brand-olive)]" />
                    <span className="truncate">{upcomingFlight.airline || upcomingFlight.flightNumber || t('dashboard.flightInfo')}</span>
                  </span>
                  <span className="inline-flex w-fit max-w-full items-center rounded-xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-3 py-1.5">
                    <Clock size={14} className="mr-2 shrink-0 text-[var(--color-brand-terracotta)]" />
                    <span className="truncate">{outboundTime}</span>
                  </span>
                  {outboundRoute && (
                    <span className="inline-flex w-fit max-w-full items-center rounded-xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-3 py-1.5">
                      <MapPin size={14} className="mr-2 shrink-0 text-[var(--color-brand-espresso)]/45" />
                      <span className="truncate">{outboundRoute}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleManualAdd}
              className="w-full rounded-2xl bg-[var(--color-brand-espresso)] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-black md:w-auto"
            >
              {t('dashboard.editFlight')}
            </button>
          </div>

          {hasReturnInfo && (
            <div className="relative z-10 mt-5 rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/55 p-4">
              <p className="mb-2 text-xs font-bold text-[var(--color-brand-espresso)]/55">{joinParts(t('dashboard.returnTrip'), upcomingFlight.returnFlightNumber)}</p>
              <div className="grid grid-cols-1 gap-2 text-sm font-medium text-[var(--color-brand-espresso)]/70 md:grid-cols-2">
                {returnTime && <span className="inline-flex items-center"><Clock size={14} className="mr-2 text-[var(--color-brand-terracotta)]" />{returnTime}</span>}
                {returnRoute && <span className="inline-flex min-w-0 items-center"><MapPin size={14} className="mr-2 shrink-0 text-[var(--color-brand-espresso)]/45" /><span className="truncate">{returnRoute}</span></span>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-2xl bg-[var(--color-brand-sand)] p-4">
              <FileText size={24} className="text-[var(--color-brand-terracotta)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-brand-espresso)]">{t('dashboard.createTripTitle')}</h3>
              <p className="text-sm text-[var(--color-brand-espresso)]/60">{t('dashboard.createTripDesc')}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              onClick={handleManualAdd}
              className="flex items-center justify-center space-x-2 rounded-2xl bg-[var(--color-brand-terracotta)] px-4 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-brand-terracotta-hover)] hover:shadow-lg"
            >
              <Plus size={16} />
              <span>{t('dashboard.manualInput')}</span>
            </button>
            <label className="flex cursor-pointer items-center justify-center space-x-2 rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-4 py-4 text-sm font-bold text-[var(--color-brand-espresso)]/80 shadow-sm transition-all hover:bg-white">
              <Upload size={16} />
              <span>{t('dashboard.uploadPdfImage')}</span>
              <input type="file" accept=".pdf,image/*" onChange={handleItineraryFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {upcomingFlight && (
        <div className="space-y-6 rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
          <h3 className="text-sm font-bold text-[var(--color-brand-espresso)]/60">{t('overview.weightVsLimit')}</h3>
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold text-[var(--color-brand-espresso)]/40">{t('dashboard.checked')}</p>
                <h4 className="text-xl font-black text-[var(--color-brand-espresso)]">{checkedWeight.toFixed(1)} <span className="text-sm text-[var(--color-brand-espresso)]/40">kg</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-brand-espresso)]/40">{t('dashboard.limit')}</p>
                <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{upcomingFlight.checkedAllowance || 0} kg</p>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-brand-stone)]/60">
              <div
                className={clsx("h-full transition-all duration-1000", checkedWeight > (upcomingFlight.checkedAllowance || 0) ? 'bg-red-500' : 'bg-[var(--color-brand-espresso)]')}
                style={{ width: `${Math.min(100, (checkedWeight / (upcomingFlight.checkedAllowance || 1)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold text-[var(--color-brand-espresso)]/40">{t('dashboard.carryOn')}</p>
                <h4 className="text-xl font-black text-[var(--color-brand-espresso)]">{carryOnWeight.toFixed(1)} <span className="text-sm text-[var(--color-brand-espresso)]/40">kg</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-brand-espresso)]/40">{t('dashboard.limit')}</p>
                <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{upcomingFlight.carryOnAllowance || 0} kg</p>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-brand-stone)]/60">
              <div
                className={clsx("h-full transition-all duration-1000", carryOnWeight > (upcomingFlight.carryOnAllowance || 0) ? 'bg-red-500' : 'bg-[var(--color-brand-olive)]')}
                style={{ width: `${Math.min(100, (carryOnWeight / (upcomingFlight.carryOnAllowance || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <Link
        to="/overview"
        className="flex w-full items-center justify-center gap-2 rounded-[28px] bg-[var(--color-brand-espresso)] py-5 font-bold text-white shadow-lg shadow-[var(--color-brand-espresso)]/20 transition-all hover:scale-[1.01] hover:bg-black"
      >
        <ClipboardList size={20} />
        <span>{t('app.overview')}</span>
      </Link>
    </div>
  );
};
