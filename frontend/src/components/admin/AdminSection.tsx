import { useEffect, useState } from 'react';

import CreateUserDialog from '@/components/admin/CreateUserDialog.tsx';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog.tsx';
import EditUserDialog from '@/components/admin/EditUserDialog.tsx';
import ManageTokensDialog from '@/components/admin/ManageTokensDialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';

import { BarChart3, Bot, Settings, UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Period = 1 | 7 | 14 | 30;

interface DailyStat {
  date: string;
  messages: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  mostUsedModel: string | null;
  dailyActivity: DailyStat[];
}

function useAdminStats(tick: number, days: Period) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    setLoading(true);
    fetch(`${baseUrl}/admin/stats?days=${days}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AdminStats) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [tick, days]);

  const refetch = () => setTick((n) => n + 1);

  return { stats, loading, refetch, tick };
  return { stats, loading };
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${Number(day)}.${Number(month)}.`;
}

const PERIODS: { value: Period; labelKey: string }[] = [
  { value: 1, labelKey: 'admin.period.day' },
  { value: 7, labelKey: 'admin.period.week' },
  { value: 14, labelKey: 'admin.period.2weeks' },
  { value: 30, labelKey: 'admin.period.month' },
];

export default function AdminSection() {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [days, setDays] = useState<Period>(30);
  const refetch = () => setTick((n) => n + 1);

  const { stats, loading } = useAdminStats(tick, days);

  const kpis = [
    {
      icon: Users,
      label: t('admin.stats.users'),
      value: loading ? '…' : String(stats?.totalUsers ?? '—'),
    },
    {
      icon: UserCheck,
      label: t('admin.stats.activeUsers'),
      value: loading ? '…' : String(stats?.activeUsers ?? '—'),
    },
    {
      icon: Bot,
      label: t('admin.stats.mostUsedModel'),
      value: loading ? '…' : (stats?.mostUsedModel ?? t('admin.stats.noModel')),
    },
  ];

  const chartData = (stats?.dailyActivity ?? []).map((d) => ({
    date: formatDate(d.date),
    messages: d.messages,
  }));
  const hasActivityData = chartData.some((d) => d.messages > 0);

  const xAxisInterval = days <= 7 ? 0 : days === 14 ? 1 : 4;

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto p-8 pt-20">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={24} />
            <h1 className="text-2xl font-semibold">{t('admin.title')}</h1>
          </div>
          <div className="flex gap-1">
            {PERIODS.map(({ value, labelKey }) => (
              <Button
                key={value}
                size="sm"
                variant={days === value ? 'default' : 'outline'}
                onClick={() => setDays(value)}>
                {t(labelKey)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Icon size={16} />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="truncate text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              {t('admin.statistics.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
                …
              </div>
            ) : !hasActivityData ? (
              <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
                {t('admin.statistics.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval={xAxisInterval}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
                    formatter={(val) => [val, t('admin.statistics.messages')]}
                  />
                  <Bar
                    dataKey="messages"
                    fill="hsl(var(--sidebar-accent))"
                    radius={[3, 3, 0, 0]}
                    activeBar={{ fill: 'hsl(0, 0%, 100%)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              {t('admin.users.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <CreateUserDialog onCreated={refetch} />
              <EditUserDialog onUpdated={refetch} />
              <DeleteUserDialog onDeleted={refetch} />
              <ManageTokensDialog onUpdated={refetch} />
            </div>
            <UserTable tick={tick} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
