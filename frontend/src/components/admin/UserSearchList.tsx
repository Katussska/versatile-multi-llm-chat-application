import { Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input.tsx';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  admin: boolean;
}

interface UserSearchListProps {
  users: AdminUser[];
  renderAction: (user: AdminUser) => ReactNode;
}

export default function UserSearchList({ users, renderAction }: UserSearchListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={t('admin.userList.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            {t('admin.userList.empty')}
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{user.email}</span>
                    {user.admin && (
                      <ShieldCheck size={13} className="shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{user.name}</span>
                </div>
                {renderAction(user)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
