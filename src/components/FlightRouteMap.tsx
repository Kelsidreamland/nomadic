import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';

import { Download, Plane } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import {
  buildFlightPassportData,
  type FlightPassportData,
} from '../services/flightPassportData';

interface FlightRouteMapProps {
  segments: FlightMemorySegment[];
  scopeControl?: ReactNode;
}

type FlightMapOption = ComposeOption<
  GeoComponentOption | TooltipComponentOption | LinesSeriesOption | EffectScatterSeriesOption
>;

const MAP_NAME = 'nomadic-flight-passport-world';
const PASSPORT_FONT = '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
const BRAND = {
  cream: '#FCFBF9',
  sand: '#F4EFE6',
  espresso: '#3D332D',
  deepEspresso: '#2F2826',
  stone: '#E8E2D6',
  terracotta: '#C86A4C',
  terracottaSoft: '#E7A08C',
  olive: '#8C9A74',
};
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

const safelyDisposeChart = (chart: ECharts | null) => {
  if (!chart || chart.isDisposed()) return;

  try {
    chart.dispose();
  } catch {
    // ECharts can throw while disposing a canvas that has just collapsed to 0px.
  }
};

const buildMapOption = (passport: FlightPassportData): FlightMapOption => ({
  backgroundColor: 'transparent',
  animationDuration: 900,
  tooltip: {
    trigger: 'item',
    borderWidth: 0,
    padding: [8, 10],
    backgroundColor: 'rgba(61, 51, 45, 0.94)',
    textStyle: {
      color: BRAND.cream,
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
      areaColor: '#5A4B42',
      borderColor: 'rgba(232, 226, 214, 0.22)',
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
        trailLength: 0.18,
        symbol: 'circle',
        symbolSize: 1.7,
        color: BRAND.cream,
      },
      lineStyle: {
        width: 0.9,
        opacity: 0.72,
        curveness: 0.26,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#8A3F2E' },
            { offset: 0.48, color: BRAND.terracotta },
            { offset: 1, color: '#F0B29E' },
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
        label: {
          position: airport.labelPosition,
          offset: airport.labelOffset,
        },
      })),
      zlevel: 3,
      symbolSize: value => {
        const visits = Array.isArray(value) && typeof value[2] === 'number' ? value[2] : 1;
        return Math.min(7, 3.2 + Math.log2(visits + 1) * 1.15);
      },
      rippleEffect: {
        brushType: 'stroke',
        scale: 1.55,
        period: 4.8,
      },
      itemStyle: {
        color: BRAND.cream,
        shadowColor: 'rgba(200, 106, 76, 0.38)',
        shadowBlur: 5,
      },
      label: {
        show: false,
      },
      labelLayout: {
        hideOverlap: false,
      },
    },
  ],
});

export const FlightRouteMap = ({ segments, scopeControl }: FlightRouteMapProps) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const passport = useMemo(() => buildFlightPassportData(segments), [segments]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test' || !mapRef.current || passport.routes.length === 0) {
      safelyDisposeChart(chartRef.current);
      chartRef.current = null;
      return;
    }

    ensureEchartsReady();
    const chart = init(mapRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    chart.setOption(buildMapOption(passport));

    const handleResize = () => {
      if (chart.isDisposed() || !mapRef.current) return;
      const { width, height } = mapRef.current.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      try {
        chart.resize();
      } catch {
        // Ignore resize races while the passport is being cleared or unmounted.
      }
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : undefined;
    observer?.observe(mapRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      safelyDisposeChart(chart);
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
            className="overflow-hidden rounded-2xl border border-[rgba(232,226,214,0.32)] bg-[#3D332D] text-[#FCFBF9] shadow-[0_20px_70px_rgba(61,51,45,0.24)]"
            style={{ fontFamily: PASSPORT_FONT }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(232,226,214,0.18)] px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase text-[rgba(231,160,140,0.84)]">
                  {t('flightMemory.passportKicker')}
                </p>
                <h4 className="mt-1 text-xl font-bold tracking-normal text-[#FCFBF9] sm:text-2xl">
                  {t('flightMemory.passportTitle')}
                </h4>
              </div>
              <div className="rounded-full border border-[rgba(200,106,76,0.42)] px-3 py-1 text-[10px] font-bold uppercase text-[rgba(244,239,230,0.86)]">
                {passport.stats.yearRange || t('flightMemory.passportNoYears')}
              </div>
            </div>
            {scopeControl && (
              <div className="border-b border-[rgba(232,226,214,0.18)] px-4 py-4 sm:px-5">
                {scopeControl}
              </div>
            )}

            <div className="relative">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(200,106,76,0.20),transparent_34%),linear-gradient(180deg,rgba(61,51,45,0)_0%,rgba(47,40,38,0.76)_100%)]" />
              <div
                ref={mapRef}
                data-testid="flight-passport-map"
                className="relative h-[340px] w-full sm:h-[410px]"
                role="img"
                aria-label={t('flightMemory.routeMapTitle')}
              />
            </div>

            <div className="grid grid-cols-2 border-y border-[rgba(232,226,214,0.18)]">
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-[rgba(232,226,214,0.72)]">FLIGHTS</p>
                <p className="mt-1 text-2xl font-bold text-[#FCFBF9]">{passport.stats.flights}</p>
              </div>
              <div className="border-l border-[rgba(232,226,214,0.18)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-[rgba(232,226,214,0.72)]">TOP</p>
                <p className="mt-1 truncate text-sm font-bold text-[#FCFBF9]">{passport.stats.topCountry || t('flightMemory.noTopCountry')}</p>
              </div>
            </div>

            <div className="space-y-2 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap gap-1.5 text-lg">
                {passport.stats.countryFlags.map((flag, index) => (
                  <span key={`${flag}-${index}`} aria-hidden="true">{flag}</span>
                ))}
              </div>
              <p className="break-all text-[10px] font-bold leading-relaxed text-[rgba(232,226,214,0.74)]">
                {passport.mrzLine}
              </p>
              <p className="text-[9px] font-bold uppercase text-[rgba(232,226,214,0.52)]">
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
