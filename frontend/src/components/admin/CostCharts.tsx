import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getApiBaseUrl } from '@/lib/api-url.ts';
import { formatModelName } from '@/lib/formatModel';

import { BarChart3, LineChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function subDaysFrom(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${Number(day)}.${Number(month)}.`;
}

function toVarKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, '_');
}

// ─── Provider & model config ──────────────────────────────────────────────────

export type ProviderId = 'all' | 'openai' | 'anthropic' | 'gemini';

export const PROVIDERS: Record<
  Exclude<ProviderId, 'all'>,
  { label: string; color: string; models: string[] }
> = {
  openai: {
    label: 'ChatGPT',
    color: '#2EFFDC',
    models: ['gpt-5.4-nano', 'gpt-5.4-mini', 'gpt-5.4', 'gpt-5.5'],
  },
  anthropic: {
    label: 'Claude',
    color: '#FF512E',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-opus-4-7'],
  },
  gemini: {
    label: 'Gemini',
    color: '#2EC4FF',
    models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  },
};

const MODEL_COLORS: Record<string, string> = {
  'gpt-5_4-nano': '#8AFFEB',
  'gpt-5_4-mini': '#2EFFDC',
  'gpt-5_4': '#00D1AE',
  'gpt-5_5': '#007562',
  'claude-haiku-4-5-20251001': '#FF9D8A',
  'claude-sonnet-4-5': '#FF512E',
  'claude-opus-4-7': '#D12300',
  'gemini-2_5-flash-lite': '#8ADEFF',
  'gemini-2_5-flash': '#2EC4FF',
  'gemini-2_5-pro': '#0096D1',
};

// ─── Period helpers ───────────────────────────────────────────────────────────

export type PeriodKey = 'today' | 'yesterday' | '7days' | '30days' | '90days';

export function getPeriodDates(period: PeriodKey): { from: string; to: string } {
  const today = startOfToday();
  switch (period) {
    case 'today':
      return { from: toYMD(today), to: toYMD(today) };
    case 'yesterday':
      return { from: toYMD(subDaysFrom(today, 1)), to: toYMD(subDaysFrom(today, 1)) };
    case '7days':
      return { from: toYMD(subDaysFrom(today, 6)), to: toYMD(today) };
    case '30days':
      return { from: toYMD(subDaysFrom(today, 29)), to: toYMD(today) };
    case '90days':
      return { from: toYMD(subDaysFrom(today, 89)), to: toYMD(today) };
  }
}

// ─── API data types ───────────────────────────────────────────────────────────

interface UsageRecord {
  date: string;
  modelName: string;
  modelProvider: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (current <= end) {
    dates.push(toYMD(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function useChartData(
  period: PeriodKey,
  provider: string,
  model: string,
  userId: string,
) {
  const [data, setData] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  useEffect(() => {
    const { from, to } = getPeriodDates(period);
    setRange({ from, to });
    const params = new URLSearchParams({ from, to });
    if (provider !== 'all') params.set('provider', provider);
    if (model !== 'all') params.set('model', model);
    if (userId !== 'all') params.set('userId', userId);

    const baseUrl = getApiBaseUrl();
    setLoading(true);
    fetch(`${baseUrl}/admin/chart-data?${params}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: UsageRecord[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [period, provider, model, userId]);

  return { data, loading, range };
}

// ─── Segment type used by GlobalCostChart ────────────────────────────────────

interface Segment {
  varKey: string;
  label: string;
  color: string;
}

// ─── Chart A – Stacked bar ────────────────────────────────────────────────────

interface BarDatum {
  date: string;
  [key: string]: number | string;
}

function GlobalCostChart({
  data,
  segments,
  range,
  t,
}: {
  data: UsageRecord[];
  segments: Segment[];
  range: { from: string; to: string };
  t: (k: string) => string;
}) {
  const chartData = useMemo<BarDatum[]>(() => {
    const byDate: Record<string, Record<string, number>> = {};

    for (const r of data) {
      if (!byDate[r.date]) byDate[r.date] = {};
      const seg = segments.find(
        (s) => s.varKey === toVarKey(r.modelName) || s.varKey === r.modelProvider,
      );
      if (!seg) continue;
      byDate[r.date][seg.varKey] = (byDate[r.date][seg.varKey] ?? 0) + r.cost;
    }

    const allDates =
      range.from && range.to ? generateDateRange(range.from, range.to) : [];
    return allDates.map((d) => {
      const row: BarDatum = { date: formatDateLabel(d) };
      for (const s of segments) {
        row[s.varKey] = parseFloat((byDate[d]?.[s.varKey] ?? 0).toFixed(4));
      }
      return row;
    });
  }, [data, segments, range]);

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    for (const s of segments) {
      cfg[s.varKey] = { label: s.label, color: s.color };
    }
    return cfg;
  }, [segments]);

  if (!chartData.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {t('admin.statistics.noData')}
      </div>
    );
  }

  const xInterval = chartData.length <= 7 ? 0 : chartData.length <= 30 ? 3 : 8;

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={xInterval} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
          }
          width={52}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, _name) => {
                const seg = segments.find((s) => s.varKey === _name);
                return (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground font-medium">
                      {seg?.label ?? String(_name)}
                    </span>
                    <span className="font-mono">${Number(value).toFixed(4)}</span>
                  </div>
                );
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {segments.map((s) => (
          <Bar
            key={s.varKey}
            dataKey={s.varKey}
            stackId="a"
            fill={`var(--color-${s.varKey})`}
            radius={0}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

// ─── Chart B – Area chart (token detail) ─────────────────────────────────────

interface TokenDatum {
  date: string;
  tokensIn: number;
  tokensOut: number;
}

function TokenDetailChart({
  data,
  range,
  t,
}: {
  data: UsageRecord[];
  range: { from: string; to: string };
  t: (k: string) => string;
}) {
  const config = useMemo<ChartConfig>(
    () => ({
      tokensIn: { label: t('admin.statistics.tokenIn'), color: '#2EC4FF' },
      tokensOut: { label: t('admin.statistics.tokenOut'), color: '#FF512E' },
    }),
    [t],
  );

  const chartData = useMemo<TokenDatum[]>(() => {
    const byDate: Record<string, { tokensIn: number; tokensOut: number }> = {};
    for (const r of data) {
      if (!byDate[r.date]) byDate[r.date] = { tokensIn: 0, tokensOut: 0 };
      byDate[r.date].tokensIn += r.tokensIn;
      byDate[r.date].tokensOut += r.tokensOut;
    }
    const allDates =
      range.from && range.to ? generateDateRange(range.from, range.to) : [];
    return allDates.map((d) => ({
      date: formatDateLabel(d),
      tokensIn: byDate[d]?.tokensIn ?? 0,
      tokensOut: byDate[d]?.tokensOut ?? 0,
    }));
  }, [data, range]);

  if (!chartData.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {t('admin.statistics.noData')}
      </div>
    );
  }

  const xInterval = chartData.length <= 7 ? 0 : chartData.length <= 30 ? 3 : 8;

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {(['tokensIn', 'tokensOut'] as const).map((k) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.3} />
              <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={xInterval} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          width={52}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {(['tokensIn', 'tokensOut'] as const).map((k) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={`var(--color-${k})`}
            fill={`url(#grad-${k})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface CostChartsProps {
  period: PeriodKey;
  selectedProvider: ProviderId;
  selectedModel: string;
  selectedUser: string;
}

export default function CostCharts({
  period,
  selectedProvider,
  selectedModel,
  selectedUser,
}: CostChartsProps) {
  const { t } = useTranslation();

  const { data, loading, range } = useChartData(
    period,
    selectedProvider,
    selectedModel,
    selectedUser,
  );

  const segments = useMemo<Segment[]>(() => {
    if (selectedProvider === 'all') {
      return (
        Object.entries(PROVIDERS) as [
          Exclude<ProviderId, 'all'>,
          (typeof PROVIDERS)[Exclude<ProviderId, 'all'>],
        ][]
      ).map(([id, p]) => ({ varKey: id, label: p.label, color: p.color }));
    }
    if (selectedModel !== 'all') {
      const key = toVarKey(selectedModel);
      return [
        {
          varKey: key,
          label: formatModelName(selectedModel),
          color: MODEL_COLORS[key] ?? '#888',
        },
      ];
    }
    return PROVIDERS[selectedProvider].models.map((m) => ({
      varKey: toVarKey(m),
      label: formatModelName(m),
      color: MODEL_COLORS[toVarKey(m)] ?? '#888',
    }));
  }, [selectedProvider, selectedModel]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardContent className="flex h-80 items-center justify-center">
              <span className="text-muted-foreground text-sm">…</span>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={18} />
            {t('admin.statistics.titleCosts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GlobalCostChart data={data} segments={segments} range={range} t={t} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart size={18} />
            {t('admin.statistics.titleTokens')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TokenDetailChart data={data} range={range} t={t} />
        </CardContent>
      </Card>
    </div>
  );
}
