import { TypographyMuted } from '@/components/typography/Muted.tsx';
import { TypographySmall } from '@/components/typography/Small.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

import { useNavigate } from 'react-router-dom';

export default function UserBadge() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="absolute right-0 top-0 flex flex-row items-center justify-end p-3 md:p-5">
      <div className="hidden items-center md:flex">
        <div className="mx-3 flex flex-col items-end">
          <TypographySmall>{user?.name ?? 'User'}</TypographySmall>
          <TypographyMuted>{user?.email ?? 'No email'}</TypographyMuted>
        </div>
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
