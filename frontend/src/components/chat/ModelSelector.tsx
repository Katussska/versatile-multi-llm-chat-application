import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import type { components } from '@/api/generated/schema.d.ts';
import { useTranslation } from 'react-i18next';

type ModelResponseDto = components['schemas']['ModelResponseDto'];

const PROVIDER_ORDER = ['gemini', 'anthropic', 'openai'] as const;

const PROVIDER_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  gemini: {
    label: 'Gemini',
    icon: <img src="/gemini.png" className="h-4 w-4 rounded-full object-cover" alt="Gemini" />,
  },
  anthropic: {
    label: 'Claude',
    icon: <img src="/claude.png" className="h-4 w-4 rounded-full object-cover" alt="Claude" />,
  },
  openai: {
    label: 'ChatGPT',
    icon: <img src="/chatGPT.png" className="h-4 w-4 rounded-full object-cover" alt="ChatGPT" />,
  },
};

interface ModelSelectorProps {
  models: ModelResponseDto[];
  selectedModelId: string;
  onProviderChange: (provider: string) => void;
  isPending?: boolean;
}

export default function ModelSelector({
  models,
  selectedModelId,
  onProviderChange,
  isPending,
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const availableProviders = PROVIDER_ORDER.filter((p) => models.some((m) => m.provider === p));
  const currentProvider = models.find((m) => m.id === selectedModelId)?.provider ?? '';

  return (
    <div className="flex justify-center p-5">
      <Select
        value={currentProvider}
        onValueChange={onProviderChange}
        disabled={isPending || availableProviders.length === 0}
      >
        <SelectTrigger className="border-background w-auto gap-2">
          <SelectValue placeholder={isPending ? '…' : t('chat.selectProvider')} />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((provider) => {
            const cfg = PROVIDER_CONFIG[provider];
            if (!cfg) return null;
            return (
              <SelectItem
                key={provider}
                value={provider}
                className="pl-2 [&>span:first-child]:hidden"
              >
                <span className="flex items-center gap-2">
                  {cfg.icon}
                  {cfg.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
