import type { ChangeEvent, FormEvent } from 'react';
import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, FileText, Plane, Plus, Save, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, type Flight } from '../db';
import { analyzeTicketWithAI } from '../services/ai';
import {
  getFlightMemoryEntries,
  getFlightMemorySegments,
  getFlightMemoryStats,
} from '../services/flightMemory';
import {
  buildFlightMemoryImportFromAnalysis,
  getSupportedFlightUploadMimeType,
  parseFlightMemoryCsv,
  readFlightUploadAsDataUrl,
} from '../services/flightMemoryImport';

const FlightRouteMap = lazy(() => import('../components/FlightRouteMap').then(module => ({ default: module.FlightRouteMap })));

const FlightRouteMapFallback = () => (
  <div className="min-h-[560px] rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
    <div className="h-full min-h-[520px] animate-pulse rounded-[24px] bg-[var(--color-brand-sand)]" />
  </div>
);

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
const formatSegmentRoute = (from?: string, to?: string) => [from, to].filter(Boolean).join(' → ');

export const FlightMemory = () => {
  const { t } = useTranslation();
  const liveFlights = useLiveQuery(() => db.flights.toArray());
  const flights = useMemo(() => liveFlights || [], [liveFlights]);
  const [now] = useState(() => Date.now());
  const [formState, setFormState] = useState(createDefaultFormState);
  const [importStatus, setImportStatus] = useState('');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isFlightListOpen, setIsFlightListOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const memoryEntries = useMemo(() => getFlightMemoryEntries(flights, now), [flights, now]);
  const segments = useMemo(() => getFlightMemorySegments(memoryEntries), [memoryEntries]);
  const currentYear = useMemo(() => new Date(now).getFullYear(), [now]);
  const stats = useMemo(() => getFlightMemoryStats(segments, currentYear), [segments, currentYear]);

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
      passengerCount: 1,
    } as Flight);

    setFormState(createDefaultFormState());
  };

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseFlightMemoryCsv(text);
      if (result.flights.length > 0) {
        await db.flights.bulkPut(result.flights);
      }
      setImportStatus(t('flightMemory.csvImported', {
        count: result.flights.length,
        errors: result.errors.length,
      }));
    } catch {
      setImportStatus(t('flightMemory.csvImportFailed'));
    } finally {
      event.target.value = '';
    }
  };

  const handlePdfImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setIsParsingPdf(true);
    setImportStatus(t('flightMemory.pdfImportParsing', { count: files.length }));
    try {
      const flightsToImport: Flight[] = [];
      let skipped = 0;

      for (const file of files) {
        const mimeType = getSupportedFlightUploadMimeType(file);
        if (!mimeType) {
          skipped += 1;
          continue;
        }

        try {
          const dataUrl = await readFlightUploadAsDataUrl(file);
          const parsed = await analyzeTicketWithAI(dataUrl, mimeType);
          const flight = buildFlightMemoryImportFromAnalysis(parsed, crypto.randomUUID());
          if (flight) {
            flightsToImport.push(flight);
          } else {
            skipped += 1;
          }
        } catch {
          skipped += 1;
        }
      }

      if (flightsToImport.length > 0) {
        await db.flights.bulkPut(flightsToImport);
      }

      setImportStatus(t('flightMemory.pdfImported', {
        files: files.length,
        count: flightsToImport.length,
        errors: skipped,
      }));
    } catch {
      setImportStatus(t('flightMemory.pdfImportFailed'));
    } finally {
      setIsParsingPdf(false);
    }
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsThisYear')}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-[var(--color-brand-terracotta)]">{stats.currentYearSegments}</p>
          <p className="mt-1 text-xs font-medium text-[var(--color-brand-espresso)]/35">{currentYear}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsCountries')}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="font-serif text-3xl font-bold text-[var(--color-brand-espresso)]">{stats.countryCount}</p>
            <p className="truncate text-xl leading-none">{stats.countries.slice(0, 7).map(country => country.flag).join(' ') || '—'}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.statsTopCountry')}</p>
          <p className="mt-2 truncate font-serif text-2xl font-bold text-[var(--color-brand-olive)]">
            {stats.topCountry ? `${stats.topCountry.flag} ${stats.topCountry.name}` : t('flightMemory.noTopCountry')}
          </p>
          {stats.topCountry && (
            <p className="mt-1 text-xs font-medium text-[var(--color-brand-espresso)]/35">
              {t('flightMemory.countryVisits', { count: stats.topCountry.visits })}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.importTitle')}</h3>
            <p className="mt-1 text-sm text-[var(--color-brand-espresso)]/50">{t('flightMemory.importSubtitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-espresso)] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-black"
            >
              <Upload size={16} />
              <span>{t('flightMemory.importCsv')}</span>
            </button>
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={isParsingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-4 py-3 text-sm font-bold text-[var(--color-brand-espresso)]/70 transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
            >
              <FileText size={16} />
              <span>{isParsingPdf ? t('flightMemory.importPdfParsing') : t('flightMemory.importPdf')}</span>
            </button>
          </div>
        </div>
        <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvImport} className="hidden" />
        <input ref={pdfInputRef} type="file" accept=".pdf,image/*" multiple onChange={handlePdfImport} className="hidden" />
        {importStatus && (
          <p className="mt-3 rounded-2xl bg-[var(--color-brand-sand)] px-4 py-3 text-sm font-medium text-[var(--color-brand-espresso)]/60">
            {importStatus}
          </p>
        )}
      </div>

      <Suspense fallback={<FlightRouteMapFallback />}>
        <FlightRouteMap segments={segments} />
      </Suspense>

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

      {segments.length > 0 && (
        <section className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm md:p-5">
          <button
            type="button"
            data-testid="flight-memory-list-toggle"
            onClick={() => setIsFlightListOpen(prev => !prev)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <span className="min-w-0">
              <span className="block text-lg font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.importedFlightsTitle')}</span>
              <span className="mt-1 block text-sm font-medium text-[var(--color-brand-espresso)]/45">
                {t('flightMemory.importedFlightsSubtitle', { count: segments.length })}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-sand)] text-[var(--color-brand-espresso)]/60">
              {isFlightListOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>

          {isFlightListOpen && (
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {segments.map(segment => (
                <article
                  key={segment.id}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--color-brand-stone)]/80 bg-[var(--color-brand-sand)] px-3 py-3"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-cream)] text-[var(--color-brand-terracotta)]">
                    <Plane size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--color-brand-espresso)]">
                      {formatSegmentRoute(segment.from, segment.to) || segment.destination}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-[var(--color-brand-espresso)]/45">
                      {[segment.departureDate, segment.airline || t('flightMemory.unknownAirline'), segment.flightNumber || t('flightMemory.noFlightNumber')]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
