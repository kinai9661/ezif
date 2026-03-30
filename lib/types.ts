export interface ModelConfig {
  id: string;
  value: string;
  label: string;
  enabled: boolean;
  isGrok: boolean;
  order: number;
}

export interface AppSettings {
  apiBaseUrl: string;
  apiKey: string;
  rateLimitPerMinute: number;
  rateLimitBurst: number;
  rateLimitBurstWindow: number;
  enableEnvKey: boolean;
}

export const DEFAULT_MODELS: ModelConfig[] = [
  { id: '1', value: 'gpt-image-1', label: 'GPT Image 1', enabled: true, isGrok: false, order: 0 },
  { id: '2', value: 'gpt-image-1.5', label: 'GPT Image 1.5', enabled: true, isGrok: false, order: 1 },
  { id: '3', value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro', enabled: true, isGrok: false, order: 2 },
  { id: '4', value: 'grok-image', label: 'Grok', enabled: true, isGrok: true, order: 3 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'https://ai.ezif.in',
  apiKey: '',
  rateLimitPerMinute: 20,
  rateLimitBurst: 5,
  rateLimitBurstWindow: 10000,
  enableEnvKey: true,
};
