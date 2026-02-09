import { Input } from '@/components/ui/input.tsx';

import { Paperclip, SendHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ChatInput() {
  const { t } = useTranslation();
  return (
    <div className="mb-7 flex w-full flex-row items-center justify-center">
      <Paperclip className="" />
      <Input className="mx-8 max-w-3xl" placeholder={t('chat.inputPlaceholder')} />
      <SendHorizontal />
    </div>
  );
}
