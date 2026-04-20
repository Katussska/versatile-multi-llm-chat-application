import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

import { useNavigate } from 'react-router-dom';

export default function UserBadge() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="absolute right-0 top-0 flex flex-row items-center justify-end p-3 md:p-5">
      <div className="mx-3 hidden flex-col items-end gap-1 md:flex">
        <span className="text-sm font-medium leading-none">{user?.name ?? 'User'}</span>
        <span className="text-sm leading-none text-muted-foreground">{user?.email ?? 'No email'}</span>
      </div>
      <Avatar onClick={() => navigate('/profile')} className="cursor-pointer">
        <AvatarImage src="/avatar.png" />
        <AvatarFallback>
          {user?.name
            ? (user.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?')
            : '?'}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
