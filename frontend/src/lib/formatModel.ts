const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-sonnet-4-5': 'Claude Sonnet 4.5',
  'claude-opus-4-7': 'Claude Opus 4.7',
  'gpt-5.4-nano': 'GPT 5.4 Nano',
  'gpt-5.4-mini': 'GPT 5.4 Mini',
  'gpt-5.4': 'GPT 5.4',
  'gpt-5.5': 'GPT 5.5',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
};

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
};

export function formatModelName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId;
}

export function fmtProvider(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider.toLowerCase()] ?? provider;
}
