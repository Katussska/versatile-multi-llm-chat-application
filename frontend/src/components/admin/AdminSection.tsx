import { useEffect, useRef, useState } from 'react';

import CostCharts, {
  PROVIDERS,
  type PeriodKey,
  type ProviderId,
  getPeriodDates,
} from '@/components/admin/CostCharts';
import UserTable from '@/components/admin/UserTable.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiBaseUrl } from '@/lib/api-url.ts';
import { formatModelName } from '@/lib/formatModel';

import { Bot, ChevronDown, Search, Settings, UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  mostUsedModel: string | null;
}

interface AdminUser {
  id: string;
  email: string;
}

function useAdminStats(tick: number, period: PeriodKey) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = getPeriodDates(period);
    const baseUrl = getApiBaseUrl();
    setLoading(true);
    fetch(`${baseUrl}/admin/stats?from=${from}&to=${to}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AdminStats) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [tick, period]);

  return { stats, loading };
}

function useAdminUsers(tick: number) {
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/admin/users`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AdminUser[]) => setUsers(data))
      .catch(() => setUsers([]));
  }, [tick]);

  return users;
}

function UserCombobox({
  users,
  value,
  onChange,
}: {
  users: AdminUser[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = search
    ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const selectedEmail = value === 'all' ? null : users.find((u) => u.id === value)?.email;
  const placeholder = t('admin.statistics.allUsers');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setSearch('');
        }}
        className="border-input bg-background ring-offset-background flex h-8 w-48 items-center justify-between rounded-md border px-3 py-1 text-xs shadow-sm focus:outline-none">
        <span className={selectedEmail ? '' : 'text-muted-foreground truncate'}>
          {selectedEmail ?? placeholder}
        </span>
        <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="bg-popover text-popover-foreground absolute left-0 top-full z-50 mt-1 w-64 rounded-md border shadow-md">
          <div className="p-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                autoFocus
                className="h-7 pl-7 text-xs"
                placeholder={t('admin.userList.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            <button
              type="button"
              className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-xs ${value === 'all' ? 'bg-accent' : ''}`}
              onClick={() => {
                onChange('all');
                setOpen(false);
                setSearch('');
              }}>
              {placeholder}
            </button>
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`hover:bg-accent w-full truncate rounded px-2 py-1.5 text-left text-xs ${value === u.id ? 'bg-accent' : ''}`}
                onClick={() => {
                  onChange(u.id);
                  setOpen(false);
                  setSearch('');
                }}>
                {u.email}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-muted-foreground px-2 py-1.5 text-xs">
                {t('admin.userList.empty')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSection() {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const refetch = () => setTick((n) => n + 1);

  // ─── Filter state ─────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<PeriodKey>('30days');
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const { stats, loading } = useAdminStats(tick, period);
  const adminUsers = useAdminUsers(tick);

  const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
    { value: 'today', label: t('admin.statistics.period.today') },
    { value: 'yesterday', label: t('admin.statistics.period.yesterday') },
    { value: '7days', label: t('admin.statistics.period.7days') },
    { value: '30days', label: t('admin.statistics.period.30days') },
    { value: '90days', label: t('admin.statistics.period.90days') },
  ];

  const PROVIDER_OPTIONS: { value: ProviderId; label: string }[] = [
    { value: 'all', label: t('admin.statistics.allProviders') },
    { value: 'openai', label: 'ChatGPT' },
    { value: 'anthropic', label: 'Claude' },
    { value: 'gemini', label: 'Gemini' },
  ];

  // ─── KPI cards ────────────────────────────────────────────────────────────
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
      value: loading
        ? '…'
        : stats?.mostUsedModel
          ? formatModelName(stats.mostUsedModel)
          : t('admin.stats.noModel'),
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header with title and filters — sticky at top */}
      <div className="bg-background sticky top-0 z-50 border-b">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-4xl">
            {/* Title */}
            <div className="flex items-center justify-center gap-3 p-4 sm:p-6">
              <Settings size={24} />
              <h1 className="text-2xl font-semibold">{t('admin.title')}</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedProvider}
                onValueChange={(v) => {
                  setSelectedProvider(v as ProviderId);
                  setSelectedModel('all');
                }}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProvider !== 'all' && (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.statistics.allModels')}</SelectItem>
                    {PROVIDERS[selectedProvider].models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {formatModelName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <UserCombobox
                users={adminUsers}
                value={selectedUser}
                onChange={setSelectedUser}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-6">
          {/* KPI cards — first two side by side on mobile, third full-width */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {kpis.map(({ icon: Icon, label, value }, i) => (
              <Card key={label} className={i === 2 ? 'col-span-2 lg:col-span-1' : ''}>
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

          <CostCharts
            period={period}
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            selectedUser={selectedUser}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                {t('admin.users.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable tick={tick} onChanged={refetch} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
