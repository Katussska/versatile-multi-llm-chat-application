import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';

interface TokenLimit {
  modelName: string;
  provider: string;
  tokenCount: number;
  usedTokens: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  currentSpending: number;
  monthlyLimit: number | null;
  tokenLimits?: TokenLimit[];
  admin: boolean;
}

interface UserTableProps {
  tick?: number;
}

function fmtTokens(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : String(n);
}

function GlobalLimitBar({ spending, limit, label, bordered }: { spending: number; limit: number; label: string; bordered?: boolean }) {
  const pct = Math.min(100, Math.round((spending / limit) * 100));
  return (
    <div className={`text-xs${bordered ? ' pt-1 border-t border-muted mt-1' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground whitespace-nowrap">
          {spending.toLocaleString()} / {limit >= 1_000 ? `${Math.round(limit / 1_000)}k` : limit}
        </span>
      </div>
      <div className="mt-0.5 h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-foreground/60" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UserTable({ tick = 0 }: UserTableProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/users`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast.error(t('admin.userTable.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tick]);

  const openEditLimit = (user: AdminUserRow) => {
    setEditTarget(user);
    setLimitInput(user.monthlyLimit != null ? String(user.monthlyLimit) : '');
  };

  const handleSaveLimit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const limit = limitInput.trim() === '' ? null : Number(limitInput);
      const res = await fetch(`${baseUrl}/users/${editTarget.id}/limit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limit }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.editLimit.success'));
      setEditTarget(null);
      fetchUsers();
    } catch {
      toast.error(t('admin.editLimit.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t('admin.userTable.name')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.userTable.email')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.userTable.tokenLimits')}</th>
              <th className="px-4 py-3 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  {t('admin.userList.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  {t('admin.userList.empty')}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    {(user.tokenLimits ?? []).length > 0 ? (
                      <div className="space-y-1">
                        {(user.tokenLimits ?? []).map((tl) => {
                          const pct = tl.tokenCount > 0 ? Math.min(100, Math.round((tl.usedTokens / tl.tokenCount) * 100)) : 0;
                          return (
                            <div key={tl.modelName} className="text-xs">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium truncate max-w-[160px]" title={`${tl.modelName} (${tl.provider})`}>{tl.modelName}</span>
                                <span className="tabular-nums text-muted-foreground whitespace-nowrap">{fmtTokens(tl.usedTokens)} / {fmtTokens(tl.tokenCount)}</span>
                              </div>
                              <div className="mt-0.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-foreground/60" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {user.monthlyLimit != null && (
                          <GlobalLimitBar spending={user.currentSpending} limit={user.monthlyLimit} label={t('admin.userTable.global')} bordered />
                        )}
                      </div>
                    ) : user.monthlyLimit != null ? (
                      <GlobalLimitBar spending={user.currentSpending} limit={user.monthlyLimit} label={t('admin.userTable.global')} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditLimit(user)}>
                          {t('admin.userTable.editLimit')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={editTarget != null} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.editLimit.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.editLimit.description', { email: editTarget?.email ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('admin.editLimit.label')}</Label>
            <Input
              type="number"
              min={1}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder={t('admin.editLimit.placeholder')}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t('profile.cancel')}
            </Button>
            <Button
              variant="outline"
              disabled={submitting}
              className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
              onClick={handleSaveLimit}
            >
              {t('admin.editLimit.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
