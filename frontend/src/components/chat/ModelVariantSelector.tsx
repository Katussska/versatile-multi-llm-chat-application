import { MoreVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import type { components } from '@/api/generated/schema.d.ts';

type ModelResponseDto = components['schemas']['ModelResponseDto'];

const PROVIDER_PREFIXES: Record<string, string> = {
  gemini: 'Gemini ',
  anthropic: 'Claude ',
  openai: 'ChatGPT ',
};

const MODEL_PRICING: Record<string, string> = {
  'gemini-2.5-pro': '$$$',
  'gemini-2.5-flash': '$$',
  'gemini-2.5-flash-lite': '$',
  'claude-opus-4-7': '$$$',
  'claude-sonnet-4-5': '$$',
  'claude-haiku-4-5-20251001': '$',
  'gpt-5.4': '$$$',
  'gpt-5.5': '$$$$',
  'gpt-5.4-mini': '$$',
  'gpt-5.4-nano': '$',
};

function shortLabel(model: ModelResponseDto): string {
  const prefix = PROVIDER_PREFIXES[model.provider];
  if (prefix && model.displayLabel.startsWith(prefix)) {
    return model.displayLabel.slice(prefix.length);
  }
  return model.displayLabel;
}

interface ModelVariantSelectorProps {
  models: ModelResponseDto[];
  selectedModelId: string;
  onModelChange: (id: string) => void;
  disabled?: boolean;
}

export default function ModelVariantSelector({
  models,
  selectedModelId,
  onModelChange,
  disabled,
}: ModelVariantSelectorProps) {
  const currentProvider = models.find((m) => m.id === selectedModelId)?.provider;
  const variantModels = models
    .filter((m) => m.provider === currentProvider)
    .sort((a, b) => (MODEL_PRICING[a.name]?.length ?? 0) - (MODEL_PRICING[b.name]?.length ?? 0));
  const selectedModel = variantModels.find((m) => m.id === selectedModelId);

  if (variantModels.length <= 1) return null;

  return (
    <Select value={selectedModelId} onValueChange={onModelChange} disabled={disabled}>
      <SelectTrigger className="h-auto w-auto shrink-0 border-0 bg-transparent p-1 shadow-none focus:ring-0 focus:ring-offset-0 [&>span:last-child]:hidden sm:h-10 sm:gap-1 sm:border sm:border-input sm:bg-background sm:px-3 sm:py-2 sm:focus:ring-2 sm:focus:ring-ring sm:focus:ring-offset-2 sm:[&>span:last-child]:flex">
        <SelectValue placeholder="…">
          {selectedModel && (
            <>
              <span className="hidden text-sm sm:block">
                {shortLabel(selectedModel)}
                {MODEL_PRICING[selectedModel.name] && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    {MODEL_PRICING[selectedModel.name]}
                  </span>
                )}
              </span>
              <span className="sm:hidden">
                <MoreVertical size={16} />
              </span>
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {variantModels.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            className="pl-2 text-sm [&>span:first-child]:hidden [&>span:last-child]:w-full"
          >
            <span className="flex w-full items-center justify-between gap-4">
              <span>{shortLabel(model)}</span>
              {MODEL_PRICING[model.name] && (
                <span className="text-muted-foreground text-xs">{MODEL_PRICING[model.name]}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
