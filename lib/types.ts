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
  supportedQualities?: string[]; // 支援的質量等級
  supportedStylePresets?: string[]; // 支援的風格預設
  defaultQuality?: string; // 預設質量等級
  defaultStylePreset?: string; // 預設風格預設
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

export interface StyleConfig {
  id: string;
  name: string;
  value: string;
  description?: string;
  enabled: boolean;
  order: number;
  supportedModels?: string[]; // 支援的模型 ID
}

export interface ImageRecord {
  id: string;
  prompt: string;
  imageUrl: string;
  modelId: string;
  size?: string;
  style?: string;
  quality?: string;
  createdAt: number;
  isFavorite: boolean;
  shareToken?: string;
}

export interface BatchJob {
  id: string;
  prompts: string[];
  modelId: string;
  size?: string;
  style?: string;
  quality?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: ImageRecord[];
  createdAt: number;
  completedAt?: number;
}

export interface ShareLink {
  token: string;
  imageId: string;
  createdAt: number;
  expiresAt?: number;
  viewCount: number;
}

export const NANO_BANANA_QUALITIES = ['standard', 'high', 'ultra'];
export const NANO_BANANA_STYLE_PRESETS = ['photorealistic', 'anime', 'oil_painting', 'watercolor', 'sketch', 'digital_art'];

export const DEFAULT_PROVIDERS: Provider[] = [];

export const DEFAULT_STYLES: StyleConfig[] = [
  { id: '1', name: 'Professional', value: 'professional', description: '專業風格', enabled: true, order: 0 },
  { id: '2', name: 'Artistic', value: 'artistic', description: '藝術風格', enabled: true, order: 1 },
  { id: '3', name: 'Realistic', value: 'realistic', description: '寫實風格', enabled: true, order: 2 },
  { id: '4', name: 'Cartoon', value: 'cartoon', description: '卡通風格', enabled: true, order: 3 },
];

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
