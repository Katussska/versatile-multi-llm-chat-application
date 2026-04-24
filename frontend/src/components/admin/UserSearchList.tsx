import { useState } from 'react';
import { type ReactNode } from 'react';

import { Input } from '@/components/ui/input.tsx';

import { Search, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
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

      <div className="max-h-64 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-center text-sm">
            {t('admin.userList.empty')}
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{user.email}</span>
                    {user.role === 'ADMIN' && (
                      <ShieldCheck size={13} className="text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">{user.name}</span>
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
