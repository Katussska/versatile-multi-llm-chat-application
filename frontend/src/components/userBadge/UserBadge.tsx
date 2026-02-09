import { useContext } from 'react';

import { TreeContext } from '@/components/TreeProvider.tsx';
import { TypographyMuted } from '@/components/typography/Muted.tsx';
import { TypographySmall } from '@/components/typography/Small.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

import { Network, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserBadge() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { showConversationTree, setShowConversationTree } = useContext(TreeContext);

  return (
    <div className="absolute right-0 top-0 flex flex-row items-center justify-end p-5">
      <Share2 className="mx-3" size={16} />
      <Network
        className="mx-3 cursor-pointer"
        size={16}
        onClick={() => setShowConversationTree(!showConversationTree)}
      />
      <div className="mx-3 flex flex-col items-end">
        <TypographySmall>username</TypographySmall>
        <TypographyMuted>{user?.email || 'email'}</TypographyMuted>
      </div>
      <Avatar onClick={() => navigate('/profile')} className="cursor-pointer">
        <AvatarImage src="/avatar.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </div>
  );
}
