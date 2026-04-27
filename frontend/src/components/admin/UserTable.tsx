import { useCallback, useEffect, useState } from 'react';

import CreateUserDialog from '@/components/admin/CreateUserDialog.tsx';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog.tsx';
import EditUserDialog from '@/components/admin/EditUserDialog.tsx';
import ManageTokensDialog from '@/components/admin/ManageTokensDialog.tsx';
import { type AdminUser } from '@/components/admin/UserSearchList.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { getApiBaseUrl } from '@/lib/api-url.ts';
import { fmtProvider } from '@/lib/formatModel';

import { MoreHorizontal, Search, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface BudgetLimit {
  modelName: string;
  provider: string;
  dollarLimit: number | null;
  usedDollars: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  budgetLimits?: BudgetLimit[];
  role: 'USER' | 'ADMIN';
}

interface UserTableProps {
  tick?: number;
  onChanged?: () => void;
}

function barColor(pct: number): string {
  return pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-primary';
}

function fmtUsd(n: number | null): string {
  if (n === null) return '∞';
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function UserTable({ tick = 0, onChanged }: UserTableProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [actionUser, setActionUser] = useState<AdminUserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const baseUrl = getApiBaseUrl();

  const fetchUsers = useCallback(async () => {
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
  }, [baseUrl, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, tick]);

  const handleChanged = () => {
    onChanged?.();
  };

  const openAction = (user: AdminUserRow, action: 'edit' | 'tokens' | 'delete') => {
    setActionUser(user);
    if (action === 'edit') setEditOpen(true);
    else if (action === 'tokens') setTokensOpen(true);
    else setDeleteOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const preselected: AdminUser | null = actionUser
    ? {
        id: actionUser.id,
        name: actionUser.name,
        email: actionUser.email,
        role: actionUser.role,
      }
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
          />
          <Input
            className="pl-8"
            placeholder={t('admin.userList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CreateUserDialog onCreated={handleChanged} />
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/80 text-muted-foreground border-b text-left backdrop-blur">
              <th className="px-4 py-3 font-medium">{t('admin.userTable.name')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.userTable.email')}</th>
              <th className="px-4 py-3 font-medium">
                {t('admin.userTable.tokenLimits')}
              </th>
              <th className="w-10 px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6 text-center">
                  {t('admin.userList.loading')}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6 text-center">
                  {t('admin.userList.empty')}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 border-b transition-colors last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {user.name}
                      {user.role === 'ADMIN' && (
                        <ShieldCheck
                          size={14}
                          className="text-muted-foreground shrink-0"
                          aria-label={t('admin.userTable.admin', {
                            defaultValue: 'Admin',
                          })}
                        />
                      )}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {(user.budgetLimits ?? []).length > 0 ? (
                      <div className="space-y-1">
                        {(user.budgetLimits ?? []).map((bl) => {
                          const pct =
                            bl.dollarLimit != null && bl.dollarLimit > 0
                              ? Math.min(
                                  100,
                                  Math.round((bl.usedDollars / bl.dollarLimit) * 100),
                                )
                              : 0;
                          return (
                            <div key={bl.provider} className="text-xs">
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className="max-w-[120px] truncate font-medium"
                                  title={fmtProvider(bl.provider)}>
                                  {fmtProvider(bl.provider)}
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap tabular-nums">
                                  {fmtUsd(bl.usedDollars)} / {fmtUsd(bl.dollarLimit)}
                                </span>
                              </div>
                              {bl.dollarLimit != null && (
                                <div className="bg-muted mt-0.5 h-1 w-full overflow-hidden rounded-full">
                                  <div
                                    className={`h-full rounded-full transition-all ${barColor(pct)}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={t('admin.userTable.actions')}>
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAction(user, 'edit')}>
                          {t('admin.editUser.trigger')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAction(user, 'tokens')}>
                          {t('admin.manageTokens.trigger')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openAction(user, 'delete')}
                          className="text-destructive focus:text-destructive">
                          {t('admin.deleteUser.trigger')}
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

      {preselected && (
        <>
          <EditUserDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            user={preselected}
            onUpdated={handleChanged}
          />
          <ManageTokensDialog
            open={tokensOpen}
            onOpenChange={setTokensOpen}
            user={preselected}
            onUpdated={handleChanged}
          />
          <DeleteUserDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            user={preselected}
            onDeleted={handleChanged}
          />
        </>
      )}
    </div>
  );
}
