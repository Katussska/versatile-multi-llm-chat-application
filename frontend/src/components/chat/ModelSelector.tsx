import { Bot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { $api } from '@/api/client.ts';

const ICON_MAP: Record<string, React.ReactNode> = {
  anthropic: <img src="/claude.png" className="h-4 w-4 rounded-full object-cover" alt="Claude" />,
  gemini: <img src="/gemini.png" className="h-4 w-4 rounded-full object-cover" alt="Gemini" />,
  openai: <img src="/chatGPT.png" className="h-4 w-4 rounded-full object-cover" alt="OpenAI" />,
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
              value={model.id}
              className="pl-2 [&>span:first-child]:hidden">
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
