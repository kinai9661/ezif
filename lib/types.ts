export interface SizeOption {
  label: string;
  value: string;
  width?: number;
  height?: number;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  order: number;
  supportedSizes?: SizeOption[];
  sizeFormat?: 'size' | 'aspect_ratio' | 'resolution' | 'custom';
}

export interface ModelConfig {
  id: string;
  value: string;
  label: string;
  enabled: boolean;
  isGrok: boolean;
  order: number;
  providerId?: string; // 關聯的供應商 ID，若未設定則使用全域設定
}

export interface AppSettings {
  apiBaseUrl: string;
  apiKey: string;
  rateLimitPerMinute: number;
  rateLimitBurst: number;
  rateLimitBurstWindow: number;
  enableEnvKey: boolean;
  theme: 'dark' | 'light';
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  rateLimitPerDay: number;
  rateLimitPerHour: number;
  ipWhitelist: string[];
  enableIpWhitelist: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'viewer';
  enabled: boolean;
  createdAt: number;
  lastLogin?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  timestamp: number;
  ipAddress: string;
}

export const DEFAULT_PROVIDERS: Provider[] = [];

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
  theme: 'light',
  logo: '',
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  rateLimitPerDay: 1000,
  rateLimitPerHour: 100,
  ipWhitelist: [],
  enableIpWhitelist: false,
};
