import { Bot, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { $api } from '@/api/client.ts';

const ICON_MAP: Record<string, React.ReactNode> = {
  anthropic: <Bot className="h-4 w-4" />,
  gemini: <Sparkles className="h-4 w-4" />,
};

interface ModelSelectorProps {
  value: string;
  onValueChange: (id: string) => void;
}

export default function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  const { data: models, isPending } = $api.useQuery('get', '/models');

  return (
    <div className="flex justify-center p-5">
      <Select value={value} onValueChange={onValueChange} disabled={isPending}>
        <SelectTrigger className="border-background w-auto gap-2">
          <SelectValue placeholder={isPending ? '…' : 'Vybrat model'} />
        </SelectTrigger>
        <SelectContent>
          {models?.map((model) => (
            <SelectItem
              key={model.id}
              value={model.id}>
              <span className="flex items-center gap-2">
                {ICON_MAP[model.iconKey] ?? <Bot className="h-4 w-4" />}
                {model.displayLabel}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
