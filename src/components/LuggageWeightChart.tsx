import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { Luggage } from '../db';

type WeightPoint = {
  isoDate: string;
  dateLabel: string;
  weight: number;
  timestamp: number;
};

const formatShortDate = (value: string, language: string) => new Intl.DateTimeFormat(language, {
  month: 'numeric',
  day: 'numeric',
}).format(new Date(value));

const formatShortTime = (value: string, language: string) => new Intl.DateTimeFormat(language, {
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const formatLongDate = (value: string, language: string) => new Intl.DateTimeFormat(language, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const normalizeHistory = (history: Luggage['weightHistory'], language: string): WeightPoint[] => {
  const normalized = history
    .filter((entry) => Number.isFinite(entry.weight) && entry.date)
    .map((entry) => ({
      isoDate: entry.date,
      dateLabel: '',
      weight: Number(entry.weight),
      timestamp: new Date(entry.date).getTime(),
    }))
    .filter((entry) => Number.isFinite(entry.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-7);

  const uniqueDays = new Set(normalized.map((entry) => new Date(entry.isoDate).toDateString()));
  const useTimeLabel = uniqueDays.size <= 1;

  return normalized.map((entry) => ({
    ...entry,
    dateLabel: useTimeLabel ? formatShortTime(entry.isoDate, language) : formatShortDate(entry.isoDate, language),
  }));
};

export const LuggageWeightChart = ({ luggage }: { luggage: Luggage }) => {
  const { t, i18n } = useTranslation();
  const data = normalizeHistory(luggage.weightHistory || [], i18n.language);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)]/80 p-4 shadow-inner shadow-[var(--color-brand-stone)]/20">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{t('luggages.trendTitle')}</p>
          <span className="rounded-full bg-[var(--color-brand-cream)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-brand-espresso)]/60">0</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-brand-espresso)]/70">{t('luggages.noTrendYet')}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-brand-espresso)]/50">{t('luggages.recordMoreHint')}</p>
      </div>
    );
  }

  const latestPoint = data[data.length - 1];
  const firstPoint = data[0];
  const highestWeight = Math.max(...data.map((entry) => entry.weight));
  const delta = latestPoint.weight - firstPoint.weight;
  const gradientId = `weight-history-${luggage.id}`;

  const trendTone = delta > 0.05
    ? 'text-[var(--color-brand-terracotta)]'
    : delta < -0.05
      ? 'text-[var(--color-brand-olive)]'
      : 'text-[var(--color-brand-espresso)]/60';

  const trendIcon = delta > 0.05
    ? <ArrowUpRight size={14} />
    : delta < -0.05
      ? <ArrowDownRight size={14} />
      : <Minus size={14} />;

  const trendLabel = delta > 0.05
    ? t('luggages.gain', { value: delta.toFixed(1) })
    : delta < -0.05
      ? t('luggages.drop', { value: Math.abs(delta).toFixed(1) })
      : t('luggages.stable');

  return (
    <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)]/80 p-4 shadow-inner shadow-[var(--color-brand-stone)]/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{t('luggages.trendTitle')}</p>
          <p className="text-[11px] text-[var(--color-brand-espresso)]/50">{t('luggages.trendSubtitle', { count: data.length })}</p>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full border border-[var(--color-brand-stone)] bg-white/80 px-2.5 py-1 text-[11px] font-bold ${trendTone}`}>
          {trendIcon}
          <span>{trendLabel}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[var(--color-brand-stone)]/70 bg-white/80 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-brand-espresso)]/40">{t('luggages.latestRecord')}</p>
          <p className="mt-1 text-sm font-black text-[var(--color-brand-espresso)]">{latestPoint.weight.toFixed(1)} kg</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)]/70 bg-white/80 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-brand-espresso)]/40">{t('luggages.changeFromFirst')}</p>
          <p className="mt-1 text-sm font-black text-[var(--color-brand-espresso)]">{delta >= 0 ? '+' : ''}{delta.toFixed(1)} kg</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-brand-stone)]/70 bg-white/80 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-brand-espresso)]/40">{t('luggages.peakWeight')}</p>
          <p className="mt-1 text-sm font-black text-[var(--color-brand-espresso)]">{highestWeight.toFixed(1)} kg</p>
        </div>
      </div>

      <div className="mt-3 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-terracotta)" stopOpacity={0.38} />
                <stop offset="95%" stopColor="var(--color-brand-terracotta)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-brand-stone)" strokeDasharray="3 4" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: 'var(--color-brand-espresso)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              hide
              domain={[
                (dataMin: number) => Math.max(0, Math.floor(dataMin - 1)),
                (dataMax: number) => Math.ceil(dataMax + 1),
              ]}
            />
            <Tooltip
              formatter={(value: number | string) => [`${Number(value).toFixed(1)} kg`, t('luggages.currentWeight')]}
              labelFormatter={(_, payload) => {
                const entry = payload?.[0]?.payload as WeightPoint | undefined;
                return entry ? formatLongDate(entry.isoDate, i18n.language) : '';
              }}
              contentStyle={{
                borderRadius: '18px',
                border: '1px solid var(--color-brand-stone)',
                backgroundColor: 'var(--color-brand-cream)',
                color: 'var(--color-brand-espresso)',
              }}
              cursor={{ stroke: 'var(--color-brand-stone)', strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="var(--color-brand-espresso)"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-brand-cream)', stroke: 'var(--color-brand-terracotta)' }}
              activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-brand-terracotta)', stroke: 'var(--color-brand-cream)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-brand-espresso)]/45">
        <span>{formatShortDate(firstPoint.isoDate, i18n.language)}</span>
        <span>{t('luggages.lastRecord')} {formatLongDate(latestPoint.isoDate, i18n.language)}</span>
      </div>
    </div>
  );
};
