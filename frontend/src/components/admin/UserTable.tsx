import { useEffect, useState } from 'react';

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

import { MoreHorizontal, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface TokenLimit {
  modelName: string;
  provider: string;
  tokenCount: number | null;
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
  onChanged?: () => void;
}

function barColor(pct: number): string {
  return pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-primary';
}

function fmtTokens(n: number | null): string {
  if (n === null) return '∞';
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${Math.round(n / 1_000)}k`
      : String(n);
}

function GlobalLimitBar({
  spending,
  limit,
  label,
  bordered,
}: {
  spending: number;
  limit: number;
  label: string;
  bordered?: boolean;
}) {
  const pct = Math.min(100, Math.round((spending / limit) * 100));
  return (
    <div className={`text-xs${bordered ? 'border-muted mt-1 border-t pt-1' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground whitespace-nowrap tabular-nums">
          {spending.toLocaleString()} /{' '}
          {limit >= 1_000 ? `${Math.round(limit / 1_000)}k` : limit}
        </span>
      </div>
      <div className="bg-muted mt-0.5 h-1 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
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

  const handleChanged = () => {
    fetchUsers();
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
        admin: actionUser.admin,
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
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="text-muted-foreground px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {(user.tokenLimits ?? []).length > 0 ? (
                      <div className="space-y-1">
                        {(user.tokenLimits ?? []).map((tl) => {
                          const pct =
                            tl.tokenCount != null && tl.tokenCount > 0
                              ? Math.min(
                                  100,
                                  Math.round((tl.usedTokens / tl.tokenCount) * 100),
                                )
                              : 0;
                          return (
                            <div
                              key={`${tl.provider}:${tl.modelName}`}
                              className="text-xs">
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className="max-w-[160px] truncate font-medium"
                                  title={`${tl.modelName} (${tl.provider})`}>
                                  {tl.modelName}
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap tabular-nums">
                                  {fmtTokens(tl.usedTokens)} / {fmtTokens(tl.tokenCount)}
                                </span>
                              </div>
                              <div className="bg-muted mt-0.5 h-1 w-full overflow-hidden rounded-full">
                                <div
                                  className={`h-full rounded-full transition-all ${barColor(pct)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {user.monthlyLimit != null && (
                          <GlobalLimitBar
                            spending={user.currentSpending}
                            limit={user.monthlyLimit}
                            label={t('admin.userTable.global')}
                            bordered
                          />
                        )}
                      </div>
                    ) : user.monthlyLimit != null ? (
                      <GlobalLimitBar
                        spending={user.currentSpending}
                        limit={user.monthlyLimit}
                        label={t('admin.userTable.global')}
                      />
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
