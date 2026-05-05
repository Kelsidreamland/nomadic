import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, MapPin, Plane, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, type Flight } from '../db';
import {
  getFlightMemoryEntries,
  getFlightMemorySegments,
  getFlightMemoryStats,
  type FlightMemorySegment,
} from '../services/flightMemory';

type MemoryFlightFormState = {
  departureDate: string;
  departureTime: string;
  departureAirport: string;
  arrivalAirport: string;
  destination: string;
  airline: string;
  flightNumber: string;
};

const getDefaultMemoryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createDefaultFormState = (): MemoryFlightFormState => ({
  departureDate: getDefaultMemoryDate(),
  departureTime: '',
  departureAirport: '',
  arrivalAirport: '',
  destination: '',
  airline: '',
  flightNumber: '',
});

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeAirport = (value: string) => normalizeText(value).toUpperCase();

const getSegmentRoute = (segment: FlightMemorySegment) => {
  if (segment.from && segment.to) return `${segment.from} → ${segment.to}`;
  return segment.from || segment.to || '';
};

const getSegmentYear = (segment: FlightMemorySegment) => segment.departureDate.slice(0, 4) || '----';

export const FlightMemory = () => {
  const { t } = useTranslation();
  const flights = useLiveQuery(() => db.flights.toArray()) || [];
  const [now] = useState(() => Date.now());
  const [formState, setFormState] = useState(createDefaultFormState);

  const memoryEntries = useMemo(() => getFlightMemoryEntries(flights, now), [flights, now]);
  const segments = useMemo(() => getFlightMemorySegments(memoryEntries), [memoryEntries]);
  const stats = useMemo(() => getFlightMemoryStats(segments), [segments]);

  const groupedSegments = useMemo(() => {
    return segments.reduce<Record<string, FlightMemorySegment[]>>((groups, segment) => {
      const year = getSegmentYear(segment);
      groups[year] = [...(groups[year] || []), segment];
      return groups;
    }, {});
  }, [segments]);

  const yearGroups = Object.entries(groupedSegments).sort(([a], [b]) => b.localeCompare(a));
  const routePreviewSegments = segments.filter(segment => segment.from || segment.to).slice(0, 6);

  const updateField = (field: keyof MemoryFlightFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddFlight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const departureAirport = normalizeAirport(formState.departureAirport);
    const arrivalAirport = normalizeAirport(formState.arrivalAirport);
    const destination = normalizeText(formState.destination) || arrivalAirport || t('flightMemory.unknownDestination');

    if (!formState.departureDate || !departureAirport || !arrivalAirport) return;

    await db.flights.add({
      id: crypto.randomUUID(),
      departureDate: formState.departureDate,
      departureTime: formState.departureTime,
      arrivalTime: '',
      destination,
      airline: normalizeText(formState.airline),
      flightNumber: normalizeText(formState.flightNumber).toUpperCase(),
      departureAirport,
      arrivalAirport,
      departureTerminal: '',
      arrivalTerminal: '',
      checkedAllowance: 0,
      carryOnAllowance: 0,
      personalAllowance: 0,
    } as Flight);

    setFormState(createDefaultFormState());
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (!window.confirm(t('flightMemory.deleteConfirm'))) return;
    await db.flights.delete(flightId);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-[var(--color-brand-olive)]">{t('flightMemory.kicker')}</p>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.title')}</h2>
          <p className="mt-1 text-sm font-medium text-[var(--color-brand-espresso)]/55">{t('flightMemory.subtitle')}</p>
        </div>
        <Link
          to="/overview"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] px-4 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/60 shadow-sm transition-colors hover:bg-white hover:text-[var(--color-brand-espresso)]"
        >
          <ArrowRight size={14} />
          <span>{t('flightMemory.backToOverview')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsSegments')}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-[var(--color-brand-terracotta)]">{stats.totalSegments}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsAirports')}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-[var(--color-brand-espresso)]">{stats.uniqueAirports}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsDestinations')}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-[var(--color-brand-espresso)]">{stats.uniqueDestinations}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsYears')}</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--color-brand-olive)]">{stats.yearRange || '-'}</p>
        </div>
      </div>

      <form onSubmit={handleAddFlight} className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.addTitle')}</h3>
            <p className="mt-1 text-sm text-[var(--color-brand-espresso)]/50">{t('flightMemory.addSubtitle')}</p>
          </div>
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-sand)] text-[var(--color-brand-terracotta)] md:flex">
            <Plus size={20} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.departureDate')}</label>
            <input
              type="date"
              required
              value={formState.departureDate}
              onChange={updateField('departureDate')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.departureAirport')}</label>
            <input
              type="text"
              required
              value={formState.departureAirport}
              onChange={updateField('departureAirport')}
              placeholder={t('flightMemory.departureAirportPlaceholder')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.arrivalAirport')}</label>
            <input
              type="text"
              required
              value={formState.arrivalAirport}
              onChange={updateField('arrivalAirport')}
              placeholder={t('flightMemory.arrivalAirportPlaceholder')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.destination')}</label>
            <input
              type="text"
              value={formState.destination}
              onChange={updateField('destination')}
              placeholder={t('flightMemory.destinationPlaceholder')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.airline')}</label>
            <input
              type="text"
              value={formState.airline}
              onChange={updateField('airline')}
              placeholder={t('flightMemory.airlinePlaceholder')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.flightNumber')}</label>
            <input
              type="text"
              value={formState.flightNumber}
              onChange={updateField('flightNumber')}
              placeholder={t('flightMemory.flightNumberPlaceholder')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.departureTime')}</label>
            <input
              type="time"
              value={formState.departureTime}
              onChange={updateField('departureTime')}
              className="w-full rounded-xl border-0 bg-[var(--color-brand-sand)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-espresso)] px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-black"
          >
            <Save size={16} />
            <span>{t('flightMemory.save')}</span>
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.routePreviewTitle')}</h3>
            <p className="mt-1 text-sm text-[var(--color-brand-espresso)]/50">{t('flightMemory.routePreviewSubtitle')}</p>
          </div>
          <Plane size={22} className="shrink-0 text-[var(--color-brand-espresso)]/25" />
        </div>

        {routePreviewSegments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {routePreviewSegments.map(segment => (
              <div key={segment.id} className="flex min-w-0 items-center gap-3 rounded-2xl bg-[var(--color-brand-sand)] px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-cream)] text-[var(--color-brand-terracotta)]">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-brand-espresso)]">{getSegmentRoute(segment)}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-brand-espresso)]/45">{segment.departureDate} · {segment.airline || t('flightMemory.unknownAirline')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/45 p-6 text-center">
            <p className="text-sm font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.noRoutes')}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--color-brand-espresso)]/60">{t('flightMemory.timelineTitle')}</h3>
        {segments.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-8 text-center shadow-sm">
            <Plane size={34} className="mx-auto mb-3 text-[var(--color-brand-espresso)]/20" />
            <p className="font-bold text-[var(--color-brand-espresso)]/55">{t('flightMemory.emptyTitle')}</p>
            <p className="mt-2 text-sm text-[var(--color-brand-espresso)]/45">{t('flightMemory.emptySubtitle')}</p>
          </div>
        ) : (
          yearGroups.map(([year, yearSegments]) => (
            <div key={year} className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] px-3 py-1 text-xs font-bold text-[var(--color-brand-espresso)]/55">
                <CalendarDays size={13} />
                <span>{year}</span>
              </div>
              {yearSegments.map(segment => (
                <div key={segment.id} className="rounded-[24px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--color-brand-olive)]">
                        {segment.kind === 'return' ? t('flightMemory.returnSegment') : t('flightMemory.outboundSegment')}
                      </p>
                      <h4 className="mt-1 truncate text-lg font-bold text-[var(--color-brand-espresso)]">
                        {getSegmentRoute(segment) || segment.destination}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlight(segment.flightId)}
                      aria-label={t('flightMemory.deleteFlight')}
                      className="rounded-xl p-2 text-[var(--color-brand-espresso)]/30 transition-colors hover:bg-[var(--color-brand-sand)] hover:text-red-500"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[var(--color-brand-espresso)]/55">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-sand)] px-3 py-1.5">
                      <Clock size={13} className="text-[var(--color-brand-terracotta)]" />
                      <span>{segment.departureDate}{segment.departureTime ? ` · ${segment.departureTime}` : ''}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-sand)] px-3 py-1.5">
                      <Plane size={13} className="text-[var(--color-brand-espresso)]/35" />
                      <span>{segment.flightNumber || segment.airline || t('flightMemory.unknownAirline')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
