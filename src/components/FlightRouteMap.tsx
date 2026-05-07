import { Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { geoEqualEarth, geoGraticule10, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GeometryObject, Topology } from 'topojson-specification';
import countries110m from 'world-atlas/countries-110m.json';
import type { FlightMemorySegment } from '../services/flightMemory';
import { getRouteMapPoint, type RouteMapPoint } from '../services/flightMemoryGeo';

interface FlightRouteMapProps {
  segments: FlightMemorySegment[];
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 520;
const MAP_PADDING_X = 36;
const MAP_PADDING_Y = 30;

const worldTopology = countries110m as unknown as Topology<{ countries: GeometryObject }>;
const worldCountries = feature(worldTopology, worldTopology.objects.countries) as FeatureCollection<Geometry>;

const projection = geoEqualEarth().fitExtent(
  [
    [MAP_PADDING_X, MAP_PADDING_Y],
    [MAP_WIDTH - MAP_PADDING_X, MAP_HEIGHT - MAP_PADDING_Y],
  ],
  worldCountries,
);

const mapPath = geoPath(projection);
const graticulePath = mapPath(geoGraticule10());

const projectPoint = (point: RouteMapPoint) => {
  const projected = projection([point.lon, point.lat]);
  if (!projected) return null;
  return { x: projected[0], y: projected[1] };
};

const getRoutePath = (from: RouteMapPoint, to: RouteMapPoint) => {
  const start = projectPoint(from);
  const end = projectPoint(to);
  if (!start || !end) return '';

  const dx = end.x - start.x;
  const lift = Math.min(104, Math.max(34, Math.abs(dx) * 0.12));
  const controlX = start.x + dx / 2;
  const controlY = Math.max(60, Math.min(start.y, end.y) - lift);

  return [
    `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`,
    `Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
  ].join(' ');
};

export const FlightRouteMap = ({ segments }: FlightRouteMapProps) => {
  const { t } = useTranslation();
  const routes = segments
    .map(segment => {
      const from = getRouteMapPoint(segment.from);
      const to = getRouteMapPoint(segment.to);
      if (!from || !to) return null;
      return { segment, from, to };
    })
    .filter((route): route is NonNullable<typeof route> => Boolean(route))
    .slice(0, 12);
  const airportsByCode = new Map<string, RouteMapPoint>();
  routes.forEach(route => {
    airportsByCode.set(route.from.code, route.from);
    airportsByCode.set(route.to.code, route.to);
  });
  const airports = Array.from(airportsByCode.values()).slice(0, 12);

  return (
    <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('flightMemory.routeMapTitle')}</h3>
          <p className="mt-1 text-sm text-[var(--color-brand-espresso)]/50">{t('flightMemory.routeMapSubtitle')}</p>
        </div>
        <Plane size={22} className="shrink-0 text-[var(--color-brand-espresso)]/25" />
      </div>

      {routes.length > 0 ? (
        <div className="space-y-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]">
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className="h-full w-full"
              role="img"
              aria-label={t('flightMemory.routeMapTitle')}
              data-testid="flight-route-world-map"
            >
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--color-brand-sand)" />
              {graticulePath && (
                <path
                  d={graticulePath}
                  fill="none"
                  stroke="var(--color-brand-cream)"
                  strokeWidth="1"
                  opacity="0.7"
                />
              )}
              {worldCountries.features.map((country, index) => {
                const path = mapPath(country);
                if (!path) return null;
                return (
                  <path
                    key={`${country.id || 'country'}-${index}`}
                    d={path}
                    data-testid="flight-route-land"
                    fill="var(--color-brand-cream)"
                    stroke="var(--color-brand-stone)"
                    strokeWidth="0.55"
                    opacity="0.72"
                  />
                );
              })}
              {routes.map(route => {
                const path = getRoutePath(route.from, route.to);
                if (!path) return null;
                return (
                  <path
                    key={route.segment.id}
                    d={path}
                    data-testid="flight-route-arc"
                    fill="none"
                    stroke="var(--color-brand-terracotta)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.52"
                  />
                );
              })}
              {airports.map(point => {
                const projected = projectPoint(point);
                if (!projected) return null;
                return (
                  <g key={point.code} data-testid="flight-route-airport">
                    <circle cx={projected.x} cy={projected.y} r="6.2" fill="var(--color-brand-cream)" stroke="var(--color-brand-espresso)" strokeWidth="1.4" />
                    <circle cx={projected.x} cy={projected.y} r="2.4" fill="var(--color-brand-terracotta)" />
                    <text x={projected.x + 8} y={projected.y - 7} fontSize="14" fontWeight="700" fill="var(--color-brand-espresso)" opacity="0.58">
                      {point.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap gap-2">
            {routes.slice(0, 8).map(route => (
              <span key={route.segment.id} className="rounded-full bg-[var(--color-brand-sand)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-espresso)]/60">
                {route.from.code} → {route.to.code}
              </span>
            ))}
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
