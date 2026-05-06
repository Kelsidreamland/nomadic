import { Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FlightMemorySegment } from '../services/flightMemory';
import { getRouteMapPoint } from '../services/flightMemoryGeo';

interface FlightRouteMapProps {
  segments: FlightMemorySegment[];
}

const getRoutePath = (fromX: number, fromY: number, toX: number, toY: number) => {
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - Math.max(5, Math.abs(toX - fromX) * 0.08);
  return `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
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
            <svg viewBox="0 0 100 56" className="h-full w-full" role="img" aria-label={t('flightMemory.routeMapTitle')}>
              <path d="M10 21 C21 15 30 18 40 16 C52 13 61 18 74 15 C84 13 91 18 96 24" fill="none" stroke="var(--color-brand-stone)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
              <path d="M4 35 C20 32 30 38 45 34 C61 30 74 34 96 31" fill="none" stroke="var(--color-brand-stone)" strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
              <path d="M23 45 C35 43 44 46 55 44 C65 42 78 44 89 41" fill="none" stroke="var(--color-brand-stone)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
              {routes.map(route => (
                <path
                  key={route.segment.id}
                  d={getRoutePath(route.from.x, route.from.y, route.to.x, route.to.y)}
                  fill="none"
                  stroke="var(--color-brand-terracotta)"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  opacity="0.72"
                />
              ))}
              {routes.flatMap(route => [route.from, route.to]).map((point, index) => (
                <g key={`${point.code}-${index}`}>
                  <circle cx={point.x} cy={point.y} r="1.35" fill="var(--color-brand-cream)" stroke="var(--color-brand-espresso)" strokeWidth="0.45" />
                  <text x={point.x + 1.4} y={point.y - 1.1} fontSize="2.2" fill="var(--color-brand-espresso)" opacity="0.55">
                    {point.code}
                  </text>
                </g>
              ))}
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
