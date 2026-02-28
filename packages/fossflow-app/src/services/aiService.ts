/**
 * AI Service for FossFLOW - Generates architecture diagrams via LLM APIs
 *
 * Supports OpenAI-compatible APIs (OpenAI, DeepSeek, Ollama, etc.)
 */

// ============================================================================
// AI-Friendly JSON Schema Definition
// This is the simplified format that AI generates, which gets converted
// to the internal FossFLOW DiagramData format.
// ============================================================================

/**
 * Compact AI-generated diagram schema.
 * This is what the LLM should output.
 */
export type AICompactItem = [name: string, icon: string, description?: string];

export type AICompactPosition = [itemIndex: number, x: number, y: number];

export type AICompactConnection = [fromIndex: number, toIndex: number];

export type AICompactView = [AICompactPosition[], AICompactConnection[]];

export interface AICompactDiagram {
  /** Title of the architecture diagram */
  t: string;
  /** Items: [name, iconId, description?] */
  i: AICompactItem[];
  /** Views: [positions, connections] */
  v: AICompactView[];
  /** Compact format metadata */
  _?: { f: 'compact'; v: '1.0' };
}

// ============================================================================
// AI Service Configuration
// ============================================================================

export interface AIServiceConfig {
  /** API endpoint URL (e.g., https://api.openai.com/v1/chat/completions) */
  apiEndpoint: string;
  /** API key for authentication */
  apiKey: string;
  /** Model name (e.g., gpt-4, deepseek-chat, etc.) */
  model: string;
  /** Temperature for generation (0-2, default 0.7) */
  temperature?: number;
  /** Maximum tokens for the response */
  maxTokens?: number;
}

// Preset configurations for popular providers
export const AI_PRESETS: Record<string, Partial<AIServiceConfig>> = {
  openai: {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096
  },
  deepseek: {
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4096
  },
  ollama: {
    apiEndpoint: 'http://localhost:11434/v1/chat/completions',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 4096
  },
  custom: {
    apiEndpoint: '',
    model: '',
    temperature: 0.7,
    maxTokens: 4096
  }
};

// ============================================================================
// Available Icons
// ============================================================================

export const AVAILABLE_ICONS = [
  { id: 'block', name: 'Block', description: 'Generic component' },
  { id: 'cache', name: 'Cache', description: 'Cache or in-memory store' },
  {
    id: 'cardterminal',
    name: 'Card Terminal',
    description: 'POS or payment terminal'
  },
  { id: 'cloud', name: 'Cloud', description: 'Cloud or CDN' },
  { id: 'cronjob', name: 'Cron Job', description: 'Scheduled job' },
  { id: 'cube', name: 'Service', description: 'Service or microservice' },
  { id: 'desktop', name: 'Desktop', description: 'Web app or UI' },
  { id: 'diamond', name: 'Decision', description: 'Decision or analytics' },
  { id: 'dns', name: 'DNS', description: 'DNS or naming' },
  { id: 'document', name: 'Document', description: 'Docs or logs' },
  { id: 'firewall', name: 'Firewall', description: 'Security or WAF' },
  {
    id: 'function-module',
    name: 'Function',
    description: 'Serverless function'
  },
  { id: 'image', name: 'Image', description: 'Asset or media' },
  { id: 'laptop', name: 'Laptop', description: 'Client device' },
  {
    id: 'loadbalancer',
    name: 'Load Balancer',
    description: 'Traffic distribution'
  },
  { id: 'lock', name: 'Lock', description: 'Authentication or security' },
  { id: 'mail', name: 'Mail', description: 'Notification or email' },
  {
    id: 'mailmultiple',
    name: 'Mail Multiple',
    description: 'Bulk notification'
  },
  { id: 'mobiledevice', name: 'Mobile', description: 'Mobile app' },
  { id: 'office', name: 'Office', description: 'Organization or team' },
  { id: 'package-module', name: 'Module', description: 'Service module' },
  {
    id: 'paymentcard',
    name: 'Payment Card',
    description: 'Payment or billing'
  },
  { id: 'plane', name: 'Plane', description: 'Transport or network' },
  { id: 'printer', name: 'Printer', description: 'Peripheral or output' },
  {
    id: 'pyramid',
    name: 'Pyramid',
    description: 'Hierarchy or layered system'
  },
  { id: 'queue', name: 'Queue', description: 'Message queue' },
  { id: 'router', name: 'Router', description: 'Gateway or routing' },
  { id: 'server', name: 'Server', description: 'API or backend service' },
  { id: 'speech', name: 'Speech', description: 'Chat or messaging' },
  { id: 'sphere', name: 'Sphere', description: 'Global service' },
  { id: 'storage', name: 'Storage', description: 'Database or storage' },
  { id: 'switch-module', name: 'Switch', description: 'Network switch' },
  { id: 'tower', name: 'Tower', description: 'Control tower' },
  { id: 'truck-2', name: 'Truck', description: 'Logistics' },
  { id: 'truck', name: 'Truck', description: 'Logistics' },
  { id: 'user', name: 'User', description: 'Human user or actor' },
  { id: 'vm', name: 'VM', description: 'Virtual machine' }
];

export const AVAILABLE_ICON_IDS = AVAILABLE_ICONS.map((i) => i.id);

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are an expert system architecture designer. Your task is to generate architecture diagrams in a compact JSON format.

## Output Format

You MUST output ONLY valid JSON (no markdown code blocks, no explanations) matching this schema:

{
  "t": "string - Title of the diagram",
  "i": [
    ["string - Name", "string - Icon ID from the list below", "string (optional) - Description"]
  ],
  "v": [
    [
      [[itemIndex, x, y], ...],
      [[fromIndex, toIndex], ...]
    ]
  ],
  "_": { "f": "compact", "v": "1.0" }
}

## Rules

- Use EXACTLY one view in "v" unless explicitly asked otherwise.
- Every item must appear in the positions list of that view.
- itemIndex must match the item's index in "i" (0-based).
- x and y are tile coordinates (integers). Keep them within -20 to 20.
- Keep items spaced 3-6 tiles apart to avoid overlap.
- If unsure about icon, use "block".
- Output ONLY the JSON object, no other text.

## Available Icons

Choose the most appropriate icon for each item:
- block: Generic component
- cache: Cache or in-memory store
- cardterminal: POS or payment terminal
- cloud: Cloud or CDN
- cronjob: Scheduled job
- cube: Service or microservice
- desktop: Web app or UI
- diamond: Decision or analytics
- dns: DNS or naming
- document: Docs or logs
- firewall: Security or WAF
- function-module: Serverless function
- image: Asset or media
- laptop: Client device
- loadbalancer: Traffic distribution
- lock: Authentication or security
- mail: Notification or email
- mailmultiple: Bulk notification
- mobiledevice: Mobile app
- office: Organization or team
- package-module: Service module
- paymentcard: Payment or billing
- plane: Transport or network
- printer: Peripheral or output
- pyramid: Hierarchy or layered system
- queue: Message queue
- router: Gateway or routing
- server: API or backend service
- speech: Chat or messaging
- sphere: Global service
- storage: Database or storage
- switch-module: Network switch
- tower: Control tower
- truck-2: Logistics
- truck: Logistics
- user: Human user or actor
- vm: Virtual machine
`;

// ============================================================================
// AI Service Implementation
// ============================================================================

/**
 * Load default AI config from environment variables (.env)
 */
function getEnvAIConfig(): AIServiceConfig | null {
  const endpoint = process.env.AI_API_ENDPOINT;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (endpoint && apiKey && model) {
    return {
      apiEndpoint: endpoint,
      apiKey,
      model,
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10)
    };
  }
  return null;
}

/**
 * Load AI configuration from localStorage, falling back to .env defaults
 */
export function loadAIConfig(): AIServiceConfig | null {
  try {
    const saved = localStorage.getItem('fossflow-ai-config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load AI config:', e);
  }
  // Fall back to environment variables
  return getEnvAIConfig();
}

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config: AIServiceConfig): void {
  localStorage.setItem('fossflow-ai-config', JSON.stringify(config));
}

/**
 * Call the AI API to generate a diagram from a natural language prompt
 */
export async function generateDiagramWithAI(
  prompt: string,
  config: AIServiceConfig,
  locale?: string
): Promise<AICompactDiagram> {
  // Determine the output language based on locale
  const langMap: Record<string, string> = {
    'zh-CN': '中文(简体中文)',
    zh: '中文(简体中文)',
    'zh-TW': '中文(繁體中文)',
    ja: '日本語',
    ko: '한국어',
    fr: 'français',
    de: 'Deutsch',
    es: 'español',
    pt: 'português',
    ru: 'русский',
    hi: 'हिन्दी',
    bn: 'বাংলা',
    id: 'Bahasa Indonesia',
    en: 'English',
    'en-US': 'English'
  };
  const outputLang = locale
    ? langMap[locale] || langMap[locale.split('-')[0]] || locale
    : '';
  const langInstruction = outputLang
    ? `\n\n## Language Requirement\n\nIMPORTANT: All text content (title in "t", item names, and descriptions) MUST be written in ${outputLang}. Only the JSON keys and icon IDs remain in English.`
    : '';

  const requestBody = {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT + langInstruction
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 4096
  };

  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Extract the content from OpenAI-compatible response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI returned empty response');
    }

    // Parse the JSON from the response (handle markdown code blocks)
    let jsonString = content.trim();

    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const diagram: AICompactDiagram = JSON.parse(jsonString);

    // Validate the generated diagram
    validateAICompactDiagram(diagram);

    return diagram;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        'AI returned invalid JSON. Please try again with a clearer prompt.'
      );
    }
    throw error;
  }
}

/**
 * Validate the AI-generated diagram schema
 */
function validateAICompactDiagram(diagram: AICompactDiagram): void {
  if (!diagram || typeof diagram !== 'object') {
    throw new Error('Diagram must be a JSON object');
  }

  if (!diagram.t || typeof diagram.t !== 'string') {
    throw new Error('Diagram must have a title string in "t"');
  }

  if (!Array.isArray(diagram.i) || diagram.i.length === 0) {
    throw new Error('Diagram must have at least one item in "i"');
  }

  for (const [index, item] of diagram.i.entries()) {
    if (!Array.isArray(item) || item.length < 2) {
      throw new Error(
        `Item at index ${index} must be [name, icon, description?]`
      );
    }
    if (typeof item[0] !== 'string' || !item[0].trim()) {
      throw new Error(`Item at index ${index} must have a name`);
    }
    if (typeof item[1] !== 'string' || !item[1].trim()) {
      throw new Error(`Item at index ${index} must have an icon ID`);
    }
    if (item[2] !== undefined && typeof item[2] !== 'string') {
      throw new Error(
        `Item description at index ${index} must be a string if provided`
      );
    }
  }

  if (!Array.isArray(diagram.v)) {
    throw new Error('Diagram must have a views array in "v"');
  }

  for (const [viewIndex, view] of diagram.v.entries()) {
    if (!Array.isArray(view) || view.length < 2) {
      throw new Error(
        `View at index ${viewIndex} must be [positions, connections]`
      );
    }
    const [positions, connections] = view;
    if (!Array.isArray(positions) || !Array.isArray(connections)) {
      throw new Error(
        `View at index ${viewIndex} must contain arrays for positions and connections`
      );
    }

    for (const [posIndex, pos] of positions.entries()) {
      if (!Array.isArray(pos) || pos.length < 3) {
        throw new Error(
          `Position at index ${posIndex} in view ${viewIndex} must be [itemIndex, x, y]`
        );
      }
      if (
        typeof pos[0] !== 'number' ||
        typeof pos[1] !== 'number' ||
        typeof pos[2] !== 'number'
      ) {
        throw new Error(
          `Position at index ${posIndex} in view ${viewIndex} must contain numbers`
        );
      }
    }

    for (const [connIndex, conn] of connections.entries()) {
      if (!Array.isArray(conn) || conn.length < 2) {
        throw new Error(
          `Connection at index ${connIndex} in view ${viewIndex} must be [fromIndex, toIndex]`
        );
      }
      if (typeof conn[0] !== 'number' || typeof conn[1] !== 'number') {
        throw new Error(
          `Connection at index ${connIndex} in view ${viewIndex} must contain numbers`
        );
      }
    }
  }
}
