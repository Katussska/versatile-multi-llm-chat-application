import { BarChart3, Bot, Settings, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
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

import CreateUserDialog from '@/components/admin/CreateUserDialog.tsx';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog.tsx';
import EditUserDialog from '@/components/admin/EditUserDialog.tsx';
import ManageTokensDialog from '@/components/admin/ManageTokensDialog.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';

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

function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    setLoading(true);
    fetch(`${baseUrl}/users/stats`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AdminStats) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [tick]);

  const refetch = () => setTick((n) => n + 1);

  return { stats, loading, refetch };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export default function AdminSection() {
  const { t } = useTranslation();
  const { stats, loading, refetch } = useAdminStats();

  const kpis = [
    {
      icon: Users,
      label: t('admin.stats.users'),
      value: loading ? '…' : String(stats?.totalUsers ?? '—'),
    },
    {
      icon: Users,
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

  const hasData = chartData.some((d) => d.messages > 0);

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto p-8 pt-20">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Settings size={24} />
          <h1 className="text-2xl font-semibold">{t('admin.title')}</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
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
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                …
              </div>
            ) : !hasData ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {t('admin.statistics.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval={4}
                    className="text-muted-foreground"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    cursor={false}
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
                    formatter={(val) => [val, t('admin.statistics.messages')]}
                  />
                  <Bar dataKey="messages" fill="hsl(var(--sidebar-accent))" radius={[3, 3, 0, 0]} activeBar={{ fill: 'hsl(0, 0%, 100%)' }} />
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
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <CreateUserDialog onCreated={refetch} />
              <EditUserDialog onUpdated={refetch} />
              <DeleteUserDialog onDeleted={refetch} />
              <ManageTokensDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
