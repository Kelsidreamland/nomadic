import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';

import { Download, Plane } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { init, registerMap, use as registerEchartsModules, type ComposeOption, type ECharts } from 'echarts/core';
import {
  GeoComponent,
  TooltipComponent,
  type GeoComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import {
  EffectScatterChart,
  LinesChart,
  type EffectScatterSeriesOption,
  type LinesSeriesOption,
} from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GeometryObject, Topology } from 'topojson-specification';
import countries110m from 'world-atlas/countries-110m.json';
import type { FlightMemorySegment } from '../services/flightMemory';
import { buildFlightPassportData, type FlightPassportData } from '../services/flightPassportData';

interface FlightRouteMapProps {
  segments: FlightMemorySegment[];
}

type FlightMapOption = ComposeOption<
  GeoComponentOption | TooltipComponentOption | LinesSeriesOption | EffectScatterSeriesOption
>;

const MAP_NAME = 'nomadic-flight-passport-world';
const PASSPORT_FONT = '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
const worldTopology = countries110m as unknown as Topology<{ countries: GeometryObject }>;
const worldCountries = feature(worldTopology, worldTopology.objects.countries) as FeatureCollection<Geometry>;

let isEchartsReady = false;
let isMapRegistered = false;

const ensureEchartsReady = () => {
  if (!isEchartsReady) {
    registerEchartsModules([GeoComponent, TooltipComponent, LinesChart, EffectScatterChart, CanvasRenderer]);
    isEchartsReady = true;
  }

  if (!isMapRegistered) {
    registerMap(MAP_NAME, worldCountries as Parameters<typeof registerMap>[1]);
    isMapRegistered = true;
  }
};

const buildMapOption = (passport: FlightPassportData): FlightMapOption => ({
  backgroundColor: 'transparent',
  animationDuration: 900,
  tooltip: {
    trigger: 'item',
    borderWidth: 0,
    padding: [8, 10],
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    textStyle: {
      color: '#F8FAFC',
      fontFamily: PASSPORT_FONT,
      fontSize: 11,
    },
    formatter: params => {
      const target = Array.isArray(params) ? params[0] : params;
      const name = target && typeof target.name === 'string' ? target.name : '';
      return name || '';
    },
  },
  geo: {
    map: MAP_NAME,
    roam: false,
    silent: true,
    layoutCenter: ['50%', '50%'],
    layoutSize: '108%',
    itemStyle: {
      areaColor: '#192235',
      borderColor: 'rgba(148, 163, 184, 0.16)',
      borderWidth: 0.45,
    },
    emphasis: {
      disabled: true,
    },
    label: {
      show: false,
    },
  },
  series: [
    {
      name: 'Routes',
      type: 'lines',
      coordinateSystem: 'geo',
      data: passport.routes.map(route => ({
        name: `${route.fromCode} → ${route.toCode}`,
        coords: route.coords,
      })),
      zlevel: 2,
      polyline: false,
      effect: {
        show: true,
        period: 4.8,
        trailLength: 0.24,
        symbol: 'circle',
        symbolSize: 3,
        color: '#FFE7DA',
      },
      lineStyle: {
        width: 1.7,
        opacity: 0.82,
        curveness: 0.26,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#7F1D1D' },
            { offset: 0.45, color: '#F97365' },
            { offset: 1, color: '#FFD0BE' },
          ],
        },
      },
      blendMode: 'lighter',
    },
    {
      name: 'Airports',
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: passport.labelAirports.map(airport => ({
        name: airport.code,
        value: [airport.lon, airport.lat, airport.visits],
      })),
      zlevel: 3,
      symbolSize: value => {
        const visits = Array.isArray(value) && typeof value[2] === 'number' ? value[2] : 1;
        return Math.min(13, 7 + visits);
      },
      rippleEffect: {
        brushType: 'stroke',
        scale: 2.2,
        period: 4,
      },
      itemStyle: {
        color: '#FFE7DA',
        shadowColor: 'rgba(249, 115, 101, 0.55)',
        shadowBlur: 12,
      },
      label: {
        show: true,
        formatter: '{b}',
        position: 'right',
        distance: 7,
        color: '#FDE7DD',
        fontFamily: PASSPORT_FONT,
        fontSize: 11,
        fontWeight: 700,
        textBorderColor: '#0F172A',
        textBorderWidth: 3,
      },
      labelLayout: {
        hideOverlap: true,
      },
    },
  ],
});

export const FlightRouteMap = ({ segments }: FlightRouteMapProps) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const passport = useMemo(() => buildFlightPassportData(segments), [segments]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test' || !mapRef.current || passport.routes.length === 0) return;

    ensureEchartsReady();
    const chart = init(mapRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    chart.setOption(buildMapOption(passport));

    const handleResize = () => chart.resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : undefined;
    observer?.observe(mapRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [passport]);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `nomadic-flight-passport-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.routeMapTitle')}</h3>
          <p className="mt-1 text-sm text-[var(--color-brand-espresso)]/50">{t('flightMemory.routeMapSubtitle')}</p>
        </div>
        <Plane size={22} className="shrink-0 text-[var(--color-brand-espresso)]/25" />
      </div>

      {passport.routes.length > 0 ? (
        <div className="space-y-4">
          <div
            ref={cardRef}
            data-testid="flight-passport-card"
            className="overflow-hidden rounded-2xl border border-[rgba(51,65,85,0.7)] bg-[#0F172A] text-[#F8FAFC] shadow-[0_20px_70px_rgba(15,23,42,0.28)]"
            style={{ fontFamily: PASSPORT_FONT }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.1)] px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase text-[rgba(254,202,202,0.7)]">
                  {t('flightMemory.passportKicker')}
                </p>
                <h4 className="mt-1 text-xl font-bold tracking-normal text-[#FFFFFF] sm:text-2xl">
                  {t('flightMemory.passportTitle')}
                </h4>
              </div>
              <div className="rounded-full border border-[rgba(254,202,202,0.25)] px-3 py-1 text-[10px] font-bold uppercase text-[rgba(254,226,226,0.8)]">
                {passport.stats.yearRange || t('flightMemory.passportNoYears')}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(248,113,113,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,23,42,0.86)_100%)]" />
              <div
                ref={mapRef}
                data-testid="flight-passport-map"
                className="relative h-[310px] w-full sm:h-[390px]"
                role="img"
                aria-label={t('flightMemory.routeMapTitle')}
              />
              <div className="pointer-events-none absolute inset-x-4 bottom-3 flex flex-wrap gap-2">
                {passport.routes.slice(0, 6).map(route => (
                  <span key={route.id} className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(2,6,23,0.5)] px-2.5 py-1 text-[10px] font-bold text-[rgba(254,226,226,0.75)] backdrop-blur">
                    {route.fromCode} &gt; {route.toCode}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 border-y border-[rgba(255,255,255,0.1)]">
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-[rgba(148,163,184,1)]">FLIGHTS</p>
                <p className="mt-1 text-2xl font-bold text-[#FFFFFF]">{passport.stats.flights}</p>
              </div>
              <div className="border-x border-[rgba(255,255,255,0.1)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-[rgba(148,163,184,1)]">COUNTRIES</p>
                <p className="mt-1 text-2xl font-bold text-[#FFFFFF]">{passport.stats.countries}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-[rgba(148,163,184,1)]">TOP</p>
                <p className="mt-1 truncate text-sm font-bold text-[#FFFFFF]">{passport.stats.topCountry || t('flightMemory.noTopCountry')}</p>
              </div>
            </div>

            <div className="space-y-2 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap gap-1.5 text-lg">
                {passport.stats.countryFlags.map((flag, index) => (
                  <span key={`${flag}-${index}`} aria-hidden="true">{flag}</span>
                ))}
              </div>
              <p className="break-all text-[10px] font-bold leading-relaxed text-[rgba(148,163,184,1)]">
                {passport.mrzLine}
              </p>
              <p className="text-[9px] font-bold uppercase text-[rgba(100,116,139,1)]">
                ECharts Apache-2.0 · html2canvas MIT · IBM Plex Mono OFL-1.1
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[var(--color-brand-espresso)]/45">
              {t('flightMemory.passportExportHint')}
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-4 py-2 text-sm font-bold text-[var(--color-brand-espresso)] transition hover:bg-[var(--color-brand-stone)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              <span>{isExporting ? t('flightMemory.exportingPassport') : t('flightMemory.exportPassport')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/45 p-6 text-center">
          <p className="text-sm font-bold text-[var(--color-brand-espresso)]/45">{t('flightMemory.noRoutes')}</p>
        </div>
      )}
    </div>
  );
};
